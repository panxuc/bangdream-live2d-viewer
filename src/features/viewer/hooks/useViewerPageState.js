"use client";

import * as PIXI from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useViewerLayerState } from "@/src/features/viewer/hooks/useViewerLayerState";
import { buildLocalModelFromArchive, collectModelCandidates, extractArchiveEntries } from "@/src/features/viewer/lib/localModelArchive";
import { toControlModelData, toProcessedMotionGroups } from "@/src/features/viewer/lib/modelData";
import {
  MAX_MODELS,
  MODEL_TYPES,
  RESET_ON_CHARACTER_CHANGE,
  RESET_ON_MODEL_CHANGE,
  createResetOnSourceChange,
  createModel,
  deepCloneValue,
  getModelSourceSignature,
  parseSourceOptionKey,
  toNullableSelection,
} from "@/src/features/viewer/lib/modelState";
import {
  buildBorrowingPatchForModel,
  buildCombinedOverridePatchForModel,
  fetchBuildDataAsset as fetchRemoteBuildDataAsset,
} from "@/src/features/viewer/lib/remoteModelService";

export { MAX_MODELS };

const nextModelRequestId = (requestMapRef, modelId) => {
  const nextId = (requestMapRef.current.get(modelId) || 0) + 1;
  requestMapRef.current.set(modelId, nextId);
  return nextId;
};

const isCurrentModelRequest = (requestMapRef, modelId, requestId) => requestMapRef.current.get(modelId) === requestId;

export function useViewerPageState() {
  const {
    models,
    activeModel,
    activeModelId,
    activeModelIndex,
    setActiveModelId,
    addModel,
    insertModelAfter,
    removeModel,
    moveModel,
    reorderModels,
    updateModelById,
    mapModels,
  } = useViewerLayerState();
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
  const updateActiveModel = useCallback((updates) => updateModelById(activeModelId, updates), [activeModelId, updateModelById]);
  const fetchBuildDataAsset = useCallback((modelId, isModified) => fetchRemoteBuildDataAsset(modelId, isModified), []);

  const handleAddModel = useCallback(() => {
    if (models.length >= MAX_MODELS) return;

    const newId = `model-${Date.now()}`;
    addModel(createModel(newId));
  }, [addModel, models.length]);

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

      insertModelAfter(idToDuplicate, duplicatedModel);

      const sourceArchive = localArchivesRef.current.get(idToDuplicate);
      if (sourceArchive) {
        localArchivesRef.current.set(newId, sourceArchive);
      }
    },
    [insertModelAfter, models],
  );

  const handleRemoveModel = useCallback(
    (idToRemove) => {
      if (models.length <= 1) return;

      localArchivesRef.current.delete(idToRemove);
      overrideRequestsRef.current.delete(idToRemove);
      localArchiveUploadRequestsRef.current.delete(idToRemove);
      localModelApplyRequestsRef.current.delete(idToRemove);
      removeModel(idToRemove);
    },
    [models.length, removeModel],
  );

  const handleMoveModel = useCallback(
    (id, direction) => {
      if (direction !== "up" && direction !== "down") return;
      moveModel(id, direction);
    },
    [moveModel],
  );

  const handleReorderModels = useCallback(
    (draggedId, targetId) => {
      if (!draggedId || !targetId || draggedId === targetId) return;
      reorderModels(draggedId, targetId);
    },
    [reorderModels],
  );

  const handleCharacterSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelType: MODEL_TYPES.LIVE2D,
        modelSource: "remote",
        characterId: toNullableSelection(value),
        ...RESET_ON_CHARACTER_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleSpineCharacterSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelType: MODEL_TYPES.SPINE,
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
        modelType: MODEL_TYPES.LIVE2D,
        modelSource: "remote",
        modelId: toNullableSelection(value),
        ...RESET_ON_MODEL_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleSpineModelSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelType: MODEL_TYPES.SPINE,
        modelSource: "remote",
        modelId: toNullableSelection(value),
        ...RESET_ON_MODEL_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleModelSourceChange = useCallback(
    (sourceOptionKey) => {
      const nextSource = parseSourceOptionKey(sourceOptionKey);
      if (!nextSource) return;

      localArchivesRef.current.delete(activeModelId);
      updateActiveModel({
        ...createResetOnSourceChange(nextSource.modelType),
        modelSource: nextSource.modelSource,
        modelType: nextSource.modelType,
      });
    },
    [activeModelId, updateActiveModel],
  );

  const handleModelLoad = useCallback(
    (modelId, payload) => {
      const controlData = payload?.controlData || toControlModelData(payload);
      updateModelById(modelId, { modelData: controlData, localModelError: null });
    },
    [updateModelById],
  );

  const handleModelError = useCallback(
    (modelId, error) => {
      updateModelById(modelId, {
        localModelError: error instanceof Error ? error.message : "模型加载失败",
      });
    },
    [updateModelById],
  );

  const handleMotionSelect = useCallback(
    (value) => {
      updateActiveModel({ motion: toNullableSelection(value) });
    },
    [updateActiveModel],
  );

  const handleMotionLoopChange = useCallback(
    (checked) => {
      updateActiveModel({ motionLoop: Boolean(checked) });
    },
    [updateActiveModel],
  );

  const handleMotionOverride = useCallback(
    async (sourceCharId, sourceModelId) => {
      const targetModelId = activeModelId;
      const modelSnapshot = getModelById(targetModelId);
      if (!modelSnapshot || modelSnapshot.modelType !== MODEL_TYPES.LIVE2D) return;

      const requestId = nextModelRequestId(overrideRequestsRef, targetModelId);
      const sourceSignature = getModelSourceSignature(modelSnapshot);

      try {
        const nextMotionModelId = sourceCharId && sourceModelId ? sourceModelId : null;
        const nextMotionCharId = sourceCharId && sourceModelId ? sourceCharId : null;
        const expressionModelId = modelSnapshot.isBorrowingExpression ? modelSnapshot.borrowedExpressionModelId : null;

        const patch = await buildCombinedOverridePatchForModel({
          targetModel: modelSnapshot,
          motionSourceModelId: nextMotionModelId,
          expressionSourceModelId: expressionModelId,
          fetchBuildData: fetchBuildDataAsset,
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
    [activeModelId, fetchBuildDataAsset, getModelById, updateModelById],
  );

  const handleBorrowingToggle = useCallback(() => {
    if (activeModel.modelType !== MODEL_TYPES.LIVE2D) return;
    const nextState = !activeModel.isBorrowingMotion;
    updateActiveModel({ isBorrowingMotion: nextState });
    if (!nextState) {
      void handleMotionOverride(null, null);
    }
  }, [activeModel.isBorrowingMotion, activeModel.modelType, updateActiveModel, handleMotionOverride]);

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
      if (!modelSnapshot || modelSnapshot.modelType !== MODEL_TYPES.LIVE2D) return;

      const requestId = nextModelRequestId(overrideRequestsRef, targetModelId);
      const sourceSignature = getModelSourceSignature(modelSnapshot);

      try {
        const nextExpressionModelId = sourceCharId && sourceModelId ? sourceModelId : null;
        const nextExpressionCharId = sourceCharId && sourceModelId ? sourceCharId : null;
        const motionModelId = modelSnapshot.isBorrowingMotion ? modelSnapshot.borrowedModelId : null;

        const patch = await buildCombinedOverridePatchForModel({
          targetModel: modelSnapshot,
          motionSourceModelId: motionModelId,
          expressionSourceModelId: nextExpressionModelId,
          fetchBuildData: fetchBuildDataAsset,
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
    [activeModelId, fetchBuildDataAsset, getModelById, updateModelById],
  );

  const handleExpressionBorrowingToggle = useCallback(() => {
    if (activeModel.modelType !== MODEL_TYPES.LIVE2D) return;
    const nextState = !activeModel.isBorrowingExpression;
    updateActiveModel({ isBorrowingExpression: nextState });
    if (!nextState) {
      void handleExpressionOverride(null, null);
    }
  }, [activeModel.isBorrowingExpression, activeModel.modelType, updateActiveModel, handleExpressionOverride]);

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
    if (activeModel.modelType !== MODEL_TYPES.LIVE2D) return;
    const sourceCharId = activeModel.borrowedCharId;
    const sourceModelId = activeModel.borrowedModelId;
    if (!sourceCharId || !sourceModelId) return;

    try {
      const sourceData = await fetchBuildDataAsset(sourceModelId, false);
      const processedMotions = toProcessedMotionGroups(sourceData.json, sourceData.baseUrl);

      const updates = await Promise.all(
        modelsRef.current.map(async (model) => {
          if (model.modelType !== MODEL_TYPES.LIVE2D) return null;
          const patch = await buildBorrowingPatchForModel({
            targetModel: model,
            sourceCharId,
            sourceModelId,
            processedMotions,
            fetchBuildData: fetchBuildDataAsset,
          });
          return patch ? { id: model.id, patch } : null;
        }),
      );

      const patchMap = new Map(updates.filter(Boolean).map((entry) => [entry.id, entry.patch]));
      if (patchMap.size === 0) return;

      mapModels((model) => (patchMap.has(model.id) ? { ...model, ...patchMap.get(model.id) } : model));
    } catch (error) {
      console.error("Apply borrowing to all layers failed:", error);
    }
  }, [activeModel.borrowedCharId, activeModel.borrowedModelId, fetchBuildDataAsset, mapModels]);

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

    mapModels((model) => ({
      ...model,
      motion: null,
      expression: null,
      reloadKey: (model.reloadKey || 0) + 1,
    }));
  }, [mapModels]);

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
        modelType: MODEL_TYPES.LIVE2D,
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
        const candidates = collectModelCandidates(archivePayload, modelSnapshot.modelType);
        if (candidates.length === 0) {
          throw new Error(
            modelSnapshot.modelType === MODEL_TYPES.SPINE
              ? "压缩包中没有可用的 Spine 骨骼文件，请确认包含 .json/.skel、.atlas 和贴图文件"
              : "压缩包中没有可选的 model.json / buildData.asset / *.model3.json 文件",
          );
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
        updateModelById(targetModelId, {
          localModelError:
            modelSnapshot.modelType === MODEL_TYPES.SPINE
              ? "请选择一个 Spine skeleton 文件"
              : "请选择 model.json 或 buildData.asset",
        });
        return;
      }

      const requestId = nextModelRequestId(localModelApplyRequestsRef, targetModelId);
      const sourceSignatures = [
        getModelSourceSignature(modelSnapshot),
        getModelSourceSignature({
          ...modelSnapshot,
          localModelPath: selectedCandidateId,
        }),
      ];

      try {
        const result = await buildLocalModelFromArchive({
          archive,
          selectedCandidateId,
          candidates: modelSnapshot.localModelCandidates,
          localModelFileName: modelSnapshot.localModelFileName,
          modelType: modelSnapshot.modelType,
        });

        if (!isCurrentModelRequest(localModelApplyRequestsRef, targetModelId, requestId)) return;

        const currentModel = getModelById(targetModelId);
        if (!currentModel || !sourceSignatures.includes(getModelSourceSignature(currentModel))) return;

        updateModelById(targetModelId, {
          modelSource: "local",
          localModelPath: selectedCandidateId,
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
    handleSpineCharacterSelect,
    handleModelSelect,
    handleSpineModelSelect,
    handleModelSourceChange,
    handleModelLoad,
    handleModelError,
    handleMotionSelect,
    handleMotionLoopChange,
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
