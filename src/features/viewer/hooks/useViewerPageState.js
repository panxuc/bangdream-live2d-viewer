"use client";

import * as PIXI from "pixi.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getViewerModelApiBase } from "@/src/config/urls";
import { buildLocalModelFromArchive, collectModelCandidates, extractArchiveEntries } from "@/src/features/viewer/lib/localModelArchive";
import {
  applyProcessedExpressions,
  applyProcessedMotions,
  toControlModelData,
  toProcessedExpressions,
  toProcessedMotionGroups,
} from "@/src/features/viewer/lib/modelData";
import {
  DEFAULT_MODEL_ID,
  MAX_MODELS,
  RESET_ON_CHARACTER_CHANGE,
  RESET_ON_MODEL_CHANGE,
  RESET_ON_SOURCE_CHANGE,
  createModel,
  deepCloneValue,
  getModelSourceSignature,
  toNullableSelection,
} from "@/src/features/viewer/lib/modelState";

export { MAX_MODELS };

const nextModelRequestId = (requestMapRef, modelId) => {
  const nextId = (requestMapRef.current.get(modelId) || 0) + 1;
  requestMapRef.current.set(modelId, nextId);
  return nextId;
};

const isCurrentModelRequest = (requestMapRef, modelId, requestId) => requestMapRef.current.get(modelId) === requestId;

export function useViewerPageState() {
  const [models, setModels] = useState([createModel(DEFAULT_MODEL_ID)]);
  const [activeModelId, setActiveModelId] = useState(DEFAULT_MODEL_ID);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [isBatching, setIsBatching] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isUploadingLocalModel, setIsUploadingLocalModel] = useState(false);
  const canvasRef = useRef(null);
  const reloadPendingRef = useRef(false);
  const reloadTimeoutRef = useRef(null);
  const localArchivesRef = useRef(new Map());
  const modelsRef = useRef(models);
  const overrideRequestsRef = useRef(new Map());
  const localArchiveUploadRequestsRef = useRef(new Map());
  const localModelApplyRequestsRef = useRef(new Map());

  modelsRef.current = models;

  const activeModel = useMemo(() => models.find((model) => model.id === activeModelId) || models[0], [models, activeModelId]);
  const activeModelIndex = useMemo(() => models.findIndex((model) => model.id === activeModelId), [models, activeModelId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.PIXI = PIXI;
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }

      localArchivesRef.current.clear();
      overrideRequestsRef.current.clear();
      localArchiveUploadRequestsRef.current.clear();
      localModelApplyRequestsRef.current.clear();
    };
  }, []);

  const getModelById = useCallback((modelId) => modelsRef.current.find((model) => model.id === modelId) || null, []);

  const updateModelById = useCallback((modelId, updates) => {
    setModels((prev) =>
      prev.map((model) => {
        if (model.id !== modelId) return model;
        const nextUpdates = typeof updates === "function" ? updates(model) : updates;
        return nextUpdates ? { ...model, ...nextUpdates } : model;
      }),
    );
  }, []);

  const updateActiveModel = useCallback((updates) => updateModelById(activeModelId, updates), [activeModelId, updateModelById]);

  const fetchBuildDataAsset = useCallback(async (modelId, isModified) => {
    const modelBaseUrl = getViewerModelApiBase(modelId, isModified);
    const buildDataUrl = `${modelBaseUrl}buildData.asset`;
    const response = await fetch(buildDataUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch model data");
    }

    return {
      json: await response.json(),
      baseUrl: modelBaseUrl,
    };
  }, []);

  const resolveTargetModelData = useCallback(
    async (targetModel) => {
      const isLocalTarget = targetModel.modelSource === "local" && !!targetModel.localModelData;
      if (!isLocalTarget && !targetModel.modelId) {
        return null;
      }

      if (isLocalTarget) {
        return {
          json: deepCloneValue(targetModel.localModelData),
          baseUrl: "",
          isLocalTarget: true,
        };
      }

      const remoteData = await fetchBuildDataAsset(targetModel.modelId, targetModel.isModified);
      return {
        json: remoteData.json,
        baseUrl: remoteData.baseUrl,
        isLocalTarget: false,
      };
    },
    [fetchBuildDataAsset],
  );

  const buildBorrowingPatchForModel = useCallback(
    async (targetModel, sourceCharId, sourceModelId, processedMotions) => {
      const resolvedTarget = await resolveTargetModelData(targetModel);
      if (!resolvedTarget) return null;

      const hybridModelData = applyProcessedMotions(resolvedTarget.json, resolvedTarget.baseUrl, processedMotions);
      return {
        customModelData: hybridModelData,
        modelData: toControlModelData(hybridModelData),
        motion: null,
        borrowedModelId: sourceModelId,
        borrowedCharId: sourceCharId,
        isBorrowingMotion: true,
      };
    },
    [resolveTargetModelData],
  );

  const buildCombinedOverridePatchForModel = useCallback(
    async (targetModel, { motionSourceModelId = null, expressionSourceModelId = null } = {}) => {
      const resolvedTarget = await resolveTargetModelData(targetModel);
      if (!resolvedTarget) return null;

      const { json: targetJson, baseUrl: targetBaseUrl, isLocalTarget } = resolvedTarget;
      const hasMotionOverride = !!motionSourceModelId;
      const hasExpressionOverride = !!expressionSourceModelId;

      if (!hasMotionOverride && !hasExpressionOverride) {
        return {
          customModelData: null,
          modelData: isLocalTarget ? toControlModelData(targetModel.localModelData) : toControlModelData(targetJson),
        };
      }

      let hybridModelData = {
        ...targetJson,
        url: targetBaseUrl,
      };

      if (hasMotionOverride) {
        const motionSourceData = await fetchBuildDataAsset(motionSourceModelId, false);
        const processedMotions = toProcessedMotionGroups(motionSourceData.json, motionSourceData.baseUrl);
        hybridModelData = applyProcessedMotions(hybridModelData, targetBaseUrl, processedMotions);
      }

      if (hasExpressionOverride) {
        const expressionSourceData = await fetchBuildDataAsset(expressionSourceModelId, false);
        const processedExpressions = toProcessedExpressions(expressionSourceData.json, expressionSourceData.baseUrl);
        hybridModelData = applyProcessedExpressions(hybridModelData, targetBaseUrl, processedExpressions);
      }

      return {
        customModelData: hybridModelData,
        modelData: toControlModelData(hybridModelData),
      };
    },
    [fetchBuildDataAsset, resolveTargetModelData],
  );

  const handleAddModel = useCallback(() => {
    if (models.length >= MAX_MODELS) return;

    const newId = `model-${Date.now()}`;
    setModels((prev) => [...prev, createModel(newId)]);
    setActiveModelId(newId);
  }, [models.length]);

  const handleDuplicateModel = useCallback(
    (idToDuplicate) => {
      if (models.length >= MAX_MODELS) return;

      const sourceIndex = models.findIndex((model) => model.id === idToDuplicate);
      if (sourceIndex === -1) return;

      const sourceModel = models[sourceIndex];
      const newId = `model-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const duplicatedModel = {
        ...sourceModel,
        id: newId,
        modelData: deepCloneValue(sourceModel.modelData),
        customModelData: deepCloneValue(sourceModel.customModelData),
        localModelData: deepCloneValue(sourceModel.localModelData),
        localModelCandidates: deepCloneValue(sourceModel.localModelCandidates),
      };

      setModels((prev) => {
        const currentSourceIndex = prev.findIndex((model) => model.id === idToDuplicate);
        if (currentSourceIndex === -1 || prev.length >= MAX_MODELS) return prev;

        const next = [...prev];
        next.splice(currentSourceIndex + 1, 0, duplicatedModel);
        return next;
      });

      const sourceArchive = localArchivesRef.current.get(idToDuplicate);
      if (sourceArchive) {
        localArchivesRef.current.set(newId, sourceArchive);
      }

      setActiveModelId(newId);
    },
    [models],
  );

  const handleRemoveModel = useCallback(
    (idToRemove) => {
      if (models.length <= 1) return;

      localArchivesRef.current.delete(idToRemove);
      overrideRequestsRef.current.delete(idToRemove);
      localArchiveUploadRequestsRef.current.delete(idToRemove);
      localModelApplyRequestsRef.current.delete(idToRemove);

      setModels((prev) => {
        const filtered = prev.filter((model) => model.id !== idToRemove);
        if (idToRemove === activeModelId) {
          setActiveModelId(filtered[filtered.length - 1].id);
        }
        return filtered;
      });
    },
    [models.length, activeModelId],
  );

  const handleMoveModel = useCallback((id, direction) => {
    if (direction !== "up" && direction !== "down") return;

    setModels((prev) => {
      const index = prev.findIndex((model) => model.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }, []);

  const handleReorderModels = useCallback((draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return;

    setModels((prev) => {
      const fromIndex = prev.findIndex((model) => model.id === draggedId);
      const toIndex = prev.findIndex((model) => model.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [dragged] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, dragged);
      return next;
    });
  }, []);

  const handleCharacterSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelSource: "remote",
        characterId: toNullableSelection(value),
        ...RESET_ON_CHARACTER_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleModelSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelSource: "remote",
        modelId: toNullableSelection(value),
        ...RESET_ON_MODEL_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleModelSourceChange = useCallback(
    (source) => {
      if (source !== "remote" && source !== "local") return;

      localArchivesRef.current.delete(activeModelId);

      updateActiveModel({
        ...RESET_ON_SOURCE_CHANGE,
        modelSource: source,
      });
    },
    [activeModelId, updateActiveModel],
  );

  const handleModelLoad = useCallback(
    (modelId, data) => {
      updateModelById(modelId, { modelData: toControlModelData(data) });
    },
    [updateModelById],
  );

  const handleMotionSelect = useCallback(
    (value) => {
      updateActiveModel({ motion: toNullableSelection(value) });
    },
    [updateActiveModel],
  );

  const handleMotionOverride = useCallback(
    async (sourceCharId, sourceModelId) => {
      const targetModelId = activeModelId;
      const modelSnapshot = getModelById(targetModelId);
      if (!modelSnapshot) return;

      const requestId = nextModelRequestId(overrideRequestsRef, targetModelId);
      const sourceSignature = getModelSourceSignature(modelSnapshot);

      try {
        const nextMotionModelId = sourceCharId && sourceModelId ? sourceModelId : null;
        const nextMotionCharId = sourceCharId && sourceModelId ? sourceCharId : null;
        const expressionModelId = modelSnapshot.isBorrowingExpression ? modelSnapshot.borrowedExpressionModelId : null;

        const patch = await buildCombinedOverridePatchForModel(modelSnapshot, {
          motionSourceModelId: nextMotionModelId,
          expressionSourceModelId: expressionModelId,
        });
        if (!patch || !isCurrentModelRequest(overrideRequestsRef, targetModelId, requestId)) return;

        const currentModel = getModelById(targetModelId);
        if (!currentModel || getModelSourceSignature(currentModel) !== sourceSignature) return;

        updateModelById(targetModelId, {
          ...patch,
          motion: null,
          borrowedModelId: nextMotionModelId,
          borrowedCharId: nextMotionCharId,
          isBorrowingMotion: Boolean(nextMotionModelId),
        });
      } catch (error) {
        if (isCurrentModelRequest(overrideRequestsRef, targetModelId, requestId)) {
          console.error("Motion override failed:", error);
        }
      }
    },
    [activeModelId, buildCombinedOverridePatchForModel, getModelById, updateModelById],
  );

  const handleBorrowingToggle = useCallback(() => {
    const nextState = !activeModel.isBorrowingMotion;
    updateActiveModel({ isBorrowingMotion: nextState });
    if (!nextState) {
      void handleMotionOverride(null, null);
    }
  }, [activeModel.isBorrowingMotion, updateActiveModel, handleMotionOverride]);

  const handleSourceCharChange = useCallback(
    (charId) => {
      const normalizedCharId = typeof charId === "string" ? charId.padStart(3, "0") : null;
      const defaultBorrowedModelId = normalizedCharId ? `${normalizedCharId}_casual-2023` : null;

      updateActiveModel({
        borrowedCharId: charId,
        borrowedModelId: defaultBorrowedModelId,
      });

      if (charId && defaultBorrowedModelId) {
        void handleMotionOverride(charId, defaultBorrowedModelId);
      }
    },
    [updateActiveModel, handleMotionOverride],
  );

  const handleExpressionOverride = useCallback(
    async (sourceCharId, sourceModelId) => {
      const targetModelId = activeModelId;
      const modelSnapshot = getModelById(targetModelId);
      if (!modelSnapshot) return;

      const requestId = nextModelRequestId(overrideRequestsRef, targetModelId);
      const sourceSignature = getModelSourceSignature(modelSnapshot);

      try {
        const nextExpressionModelId = sourceCharId && sourceModelId ? sourceModelId : null;
        const nextExpressionCharId = sourceCharId && sourceModelId ? sourceCharId : null;
        const motionModelId = modelSnapshot.isBorrowingMotion ? modelSnapshot.borrowedModelId : null;

        const patch = await buildCombinedOverridePatchForModel(modelSnapshot, {
          motionSourceModelId: motionModelId,
          expressionSourceModelId: nextExpressionModelId,
        });
        if (!patch || !isCurrentModelRequest(overrideRequestsRef, targetModelId, requestId)) return;

        const currentModel = getModelById(targetModelId);
        if (!currentModel || getModelSourceSignature(currentModel) !== sourceSignature) return;

        updateModelById(targetModelId, {
          ...patch,
          expression: null,
          borrowedExpressionModelId: nextExpressionModelId,
          borrowedExpressionCharId: nextExpressionCharId,
          isBorrowingExpression: Boolean(nextExpressionModelId),
        });
      } catch (error) {
        if (isCurrentModelRequest(overrideRequestsRef, targetModelId, requestId)) {
          console.error("Expression override failed:", error);
        }
      }
    },
    [activeModelId, buildCombinedOverridePatchForModel, getModelById, updateModelById],
  );

  const handleExpressionBorrowingToggle = useCallback(() => {
    const nextState = !activeModel.isBorrowingExpression;
    updateActiveModel({ isBorrowingExpression: nextState });
    if (!nextState) {
      void handleExpressionOverride(null, null);
    }
  }, [activeModel.isBorrowingExpression, updateActiveModel, handleExpressionOverride]);

  const handleExpressionSourceCharChange = useCallback(
    (charId) => {
      const normalizedCharId = typeof charId === "string" ? charId.padStart(3, "0") : null;
      const defaultBorrowedExpressionModelId = normalizedCharId ? `${normalizedCharId}_casual-2023` : null;

      updateActiveModel({
        borrowedExpressionCharId: charId,
        borrowedExpressionModelId: defaultBorrowedExpressionModelId,
      });

      if (charId && defaultBorrowedExpressionModelId) {
        void handleExpressionOverride(charId, defaultBorrowedExpressionModelId);
      }
    },
    [updateActiveModel, handleExpressionOverride],
  );

  const handleApplyBorrowingToAllLayers = useCallback(async () => {
    const sourceCharId = activeModel.borrowedCharId;
    const sourceModelId = activeModel.borrowedModelId;
    if (!sourceCharId || !sourceModelId) return;

    try {
      const sourceData = await fetchBuildDataAsset(sourceModelId, false);
      const processedMotions = toProcessedMotionGroups(sourceData.json, sourceData.baseUrl);

      const modelSnapshot = modelsRef.current;
      const updates = await Promise.all(
        modelSnapshot.map(async (model) => {
          const patch = await buildBorrowingPatchForModel(model, sourceCharId, sourceModelId, processedMotions);
          return patch ? { id: model.id, patch } : null;
        }),
      );

      const patchMap = new Map(updates.filter(Boolean).map((entry) => [entry.id, entry.patch]));
      if (patchMap.size === 0) return;

      setModels((prev) => prev.map((model) => (patchMap.has(model.id) ? { ...model, ...patchMap.get(model.id) } : model)));
    } catch (error) {
      console.error("Apply borrowing to all layers failed:", error);
    }
  }, [activeModel.borrowedCharId, activeModel.borrowedModelId, buildBorrowingPatchForModel, fetchBuildDataAsset]);

  const handleExpressionSelect = useCallback(
    (value) => {
      updateActiveModel({ expression: toNullableSelection(value) });
    },
    [updateActiveModel],
  );

  const handleModelReload = useCallback(() => {
    reloadPendingRef.current = true;
    setIsReloading(true);

    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }

    reloadTimeoutRef.current = setTimeout(() => {
      reloadPendingRef.current = false;
      setIsReloading(false);
      reloadTimeoutRef.current = null;
    }, 15000);

    setModels((prev) =>
      prev.map((model) => ({
        ...model,
        motion: null,
        expression: null,
        reloadKey: (model.reloadKey || 0) + 1,
      })),
    );
  }, []);

  const handleCanvasSyncComplete = useCallback(() => {
    if (!reloadPendingRef.current) return;

    reloadPendingRef.current = false;
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
      reloadTimeoutRef.current = null;
    }

    setIsReloading(false);
  }, []);

  const handleTransformChange = useCallback(
    (key, value) => {
      updateActiveModel({ [key]: value });
    },
    [updateActiveModel],
  );

  const handleModifiedChange = useCallback(
    (checked) => {
      updateActiveModel({
        modelSource: "remote",
        isModified: checked,
        modelId: null,
        modelData: null,
        motion: null,
        expression: null,
        borrowedModelId: null,
        borrowedCharId: null,
        isBorrowingMotion: false,
        borrowedExpressionModelId: null,
        borrowedExpressionCharId: null,
        isBorrowingExpression: false,
        customModelData: null,
        localModelError: null,
      });
    },
    [updateActiveModel],
  );

  const handleHeadlessChange = useCallback(() => {
    updateActiveModel({ isHeadless: !activeModel.isHeadless });
  }, [activeModel.isHeadless, updateActiveModel]);

  const handleBodylessChange = useCallback(() => {
    updateActiveModel({ isBodyless: !activeModel.isBodyless });
  }, [activeModel.isBodyless, updateActiveModel]);

  const handleLocalArchiveUpload = useCallback(
    async (file) => {
      if (!file) return;

      const targetModelId = activeModelId;
      const modelSnapshot = getModelById(targetModelId);
      if (!modelSnapshot) return;

      const requestId = nextModelRequestId(localArchiveUploadRequestsRef, targetModelId);
      const sourceSignature = getModelSourceSignature(modelSnapshot);

      setIsUploadingLocalModel(true);

      try {
        const archivePayload = await extractArchiveEntries(file);
        const candidates = collectModelCandidates(archivePayload.entries);
        if (candidates.length === 0) {
          throw new Error("压缩包中没有可选的 model.json / buildData.asset / *.model3.json 文件");
        }

        if (!isCurrentModelRequest(localArchiveUploadRequestsRef, targetModelId, requestId)) return;

        const currentModel = getModelById(targetModelId);
        if (!currentModel || getModelSourceSignature(currentModel) !== sourceSignature) return;

        localArchivesRef.current.set(targetModelId, archivePayload);

        updateModelById(targetModelId, {
          localModelFileName: file.name,
          localArchiveToken: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          localModelCandidates: candidates,
          localModelPath: null,
          localModelData: null,
          customModelData: null,
          localModelLabel: null,
          localModelError: null,
          modelData: null,
          motion: null,
          expression: null,
          borrowedModelId: null,
          borrowedCharId: null,
          isBorrowingMotion: false,
          borrowedExpressionModelId: null,
          borrowedExpressionCharId: null,
          isBorrowingExpression: false,
        });
      } catch (error) {
        if (isCurrentModelRequest(localArchiveUploadRequestsRef, targetModelId, requestId)) {
          updateModelById(targetModelId, {
            localModelError: error instanceof Error ? error.message : "读取压缩包失败",
          });
        }
      } finally {
        if (isCurrentModelRequest(localArchiveUploadRequestsRef, targetModelId, requestId)) {
          setIsUploadingLocalModel(false);
        }
      }
    },
    [activeModelId, getModelById, updateModelById],
  );

  const handleLocalModelPathSelect = useCallback(
    (candidateId) => {
      updateActiveModel({
        localModelPath: candidateId,
        localModelError: null,
      });
    },
    [updateActiveModel],
  );

  const handleApplyLocalModel = useCallback(
    async (pathOverride) => {
      const targetModelId = activeModelId;
      const modelSnapshot = getModelById(targetModelId);
      if (!modelSnapshot) return;

      const archive = localArchivesRef.current.get(targetModelId);
      if (!archive) {
        updateModelById(targetModelId, { localModelError: "请先上传一个压缩包" });
        return;
      }

      const selectedCandidateId = pathOverride || modelSnapshot.localModelPath;
      if (!selectedCandidateId) {
        updateModelById(targetModelId, { localModelError: "请选择 model.json 或 buildData.asset" });
        return;
      }

      const requestId = nextModelRequestId(localModelApplyRequestsRef, targetModelId);
      const sourceSignature = getModelSourceSignature(modelSnapshot);

      try {
        const result = await buildLocalModelFromArchive({
          archive,
          selectedCandidateId,
          candidates: modelSnapshot.localModelCandidates,
          localModelFileName: modelSnapshot.localModelFileName,
        });

        if (!isCurrentModelRequest(localModelApplyRequestsRef, targetModelId, requestId)) return;

        const currentModel = getModelById(targetModelId);
        if (!currentModel || getModelSourceSignature(currentModel) !== sourceSignature) return;

        updateModelById(targetModelId, {
          modelSource: "local",
          localModelData: result.localModelData,
          customModelData: null,
          modelData: toControlModelData(result.localModelData),
          motion: null,
          expression: null,
          borrowedModelId: null,
          borrowedCharId: null,
          isBorrowingMotion: false,
          borrowedExpressionModelId: null,
          borrowedExpressionCharId: null,
          isBorrowingExpression: false,
          localModelLabel: result.localModelLabel,
          localModelError: null,
        });
      } catch (error) {
        if (isCurrentModelRequest(localModelApplyRequestsRef, targetModelId, requestId)) {
          updateModelById(targetModelId, {
            localModelError: error instanceof Error ? error.message : "加载本地模型失败",
          });
        }
      }
    },
    [activeModelId, getModelById, updateModelById],
  );

  return {
    models,
    activeModel,
    activeModelId,
    activeModelIndex,
    isDarkMode,
    backgroundColor,
    isBatching,
    isReloading,
    isUploadingLocalModel,
    canvasRef,
    setActiveModelId,
    setIsDarkMode,
    setBackgroundColor,
    setIsBatching,
    handleAddModel,
    handleDuplicateModel,
    handleRemoveModel,
    handleMoveModel,
    handleReorderModels,
    handleCharacterSelect,
    handleModelSelect,
    handleModelSourceChange,
    handleModelLoad,
    handleMotionSelect,
    handleMotionOverride,
    handleBorrowingToggle,
    handleApplyBorrowingToAllLayers,
    handleSourceCharChange,
    handleExpressionOverride,
    handleExpressionBorrowingToggle,
    handleExpressionSourceCharChange,
    handleExpressionSelect,
    handleModelReload,
    handleCanvasSyncComplete,
    handleTransformChange,
    handleModifiedChange,
    handleHeadlessChange,
    handleBodylessChange,
    handleLocalArchiveUpload,
    handleLocalModelPathSelect,
    handleApplyLocalModel,
  };
}
