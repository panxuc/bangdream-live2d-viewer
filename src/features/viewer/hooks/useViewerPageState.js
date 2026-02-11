"use client";

import * as PIXI from "pixi.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const BRAND_PINK = "#E5004F";
export const MAX_MODELS = 10;

const DEFAULT_MODEL_ID = "default-1";
const EMPTY_MODEL = {
  characterId: null,
  modelId: null,
  modelData: null,
  customModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  x: 0,
  y: 0,
  scale: 0.25,
  isModified: false,
  isHeadless: false,
  isBodyless: false,
  isVisible: true,
};

const RESET_ON_CHARACTER_CHANGE = {
  modelId: null,
  modelData: null,
  customModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
};

const RESET_ON_MODEL_CHANGE = {
  modelData: null,
  customModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
};

const toNullableSelection = (value) => (value === "none" ? null : value);
const getModelApiBase = (modelId, isModified) => (isModified ? `/api/charam/${modelId}/` : `/api/chara/${modelId}/`);
const createModel = (id) => ({ id, ...EMPTY_MODEL });
const toControlModelData = (data) => ({
  motions: data?.motions || null,
  expressions: data?.expressions || [],
});

export function useViewerPageState() {
  const [models, setModels] = useState([createModel(DEFAULT_MODEL_ID)]);
  const [activeModelId, setActiveModelId] = useState(DEFAULT_MODEL_ID);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [isBatching, setIsBatching] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const canvasRef = useRef();
  const reloadPendingRef = useRef(false);
  const reloadTimeoutRef = useRef(null);

  const activeModel = useMemo(() => models.find((m) => m.id === activeModelId) || models[0], [models, activeModelId]);
  const activeModelIndex = useMemo(() => models.findIndex((m) => m.id === activeModelId), [models, activeModelId]);

  useEffect(() => {
    if (typeof window !== "undefined") window.PIXI = PIXI;
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
  }, []);

  const updateActiveModel = useCallback(
    (updates) => {
      setModels((prev) => prev.map((m) => (m.id === activeModelId ? { ...m, ...updates } : m)));
    },
    [activeModelId],
  );

  const handleAddModel = useCallback(() => {
    if (models.length >= MAX_MODELS) return;

    const newId = `model-${Date.now()}`;
    setModels((prev) => [...prev, createModel(newId)]);
    setActiveModelId(newId);
  }, [models.length]);

  const handleRemoveModel = useCallback(
    (idToRemove) => {
      if (models.length <= 1) return;

      setModels((prev) => {
        const filtered = prev.filter((m) => m.id !== idToRemove);
        if (idToRemove === activeModelId) {
          setActiveModelId(filtered[filtered.length - 1].id);
        }
        return filtered;
      });
    },
    [models.length, activeModelId],
  );

  const handleCharacterSelect = useCallback(
    (value) => {
      updateActiveModel({
        characterId: toNullableSelection(value),
        ...RESET_ON_CHARACTER_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleModelSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelId: toNullableSelection(value),
        ...RESET_ON_MODEL_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleModelLoad = useCallback((modelId, data) => {
    const controlData = toControlModelData(data);
    setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, modelData: controlData } : m)));
  }, []);

  const handleMotionSelect = useCallback(
    (value) => {
      updateActiveModel({ motion: toNullableSelection(value) });
    },
    [updateActiveModel],
  );

  const handleMotionOverride = useCallback(
    async (sourceCharId, sourceModelId) => {
      if (!sourceCharId || !sourceModelId) {
        updateActiveModel({ customModelData: null, motion: null, borrowedModelId: null, borrowedCharId: null });
        return;
      }

      try {
        const currentModelId = activeModel.modelId;
        if (!currentModelId) return;

        const targetBaseUrl = getModelApiBase(currentModelId, activeModel.isModified);
        const targetDataUrl = `${targetBaseUrl}buildData.asset`;
        const sourceBaseUrl = getModelApiBase(sourceModelId, false);
        const sourceDataUrl = `${sourceBaseUrl}buildData.asset`;

        const [targetRes, sourceRes] = await Promise.all([fetch(targetDataUrl), fetch(sourceDataUrl)]);
        if (!targetRes.ok || !sourceRes.ok) throw new Error("Failed to fetch model data");

        const targetJson = await targetRes.json();
        const sourceJson = await sourceRes.json();

        const processedMotions = {};
        if (sourceJson.motions) {
          Object.keys(sourceJson.motions).forEach((groupName) => {
            processedMotions[groupName] = sourceJson.motions[groupName].map((motion) => {
              const nextMotion = { ...motion };
              if (nextMotion.file) {
                nextMotion.file = new URL(nextMotion.file, window.location.origin + sourceBaseUrl).href;
              }
              if (nextMotion.sound) {
                nextMotion.sound = new URL(nextMotion.sound, window.location.origin + sourceBaseUrl).href;
              }
              return nextMotion;
            });
          });
        }

        const hybridModelData = {
          ...targetJson,
          url: targetBaseUrl,
          motions: processedMotions,
        };

        updateActiveModel({
          customModelData: hybridModelData,
          modelData: toControlModelData(hybridModelData),
          motion: null,
          borrowedModelId: sourceModelId,
          borrowedCharId: sourceCharId,
        });
      } catch (error) {
        console.error("Motion override failed:", error);
      }
    },
    [activeModel, updateActiveModel],
  );

  const handleBorrowingToggle = useCallback(() => {
    const nextState = !activeModel.isBorrowingMotion;
    updateActiveModel({ isBorrowingMotion: nextState });
    if (!nextState) {
      handleMotionOverride(null, null);
    }
  }, [activeModel.isBorrowingMotion, updateActiveModel, handleMotionOverride]);

  const handleSourceCharChange = useCallback(
    (charId) => {
      updateActiveModel({ borrowedCharId: charId, borrowedModelId: null });
    },
    [updateActiveModel],
  );

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
      prev.map((m) => ({
        ...m,
        motion: null,
        expression: null,
        reloadKey: (m.reloadKey || 0) + 1,
      })),
    );
  }, []);

  const handleCanvasSyncComplete = useCallback(({ reloadedModelIds }) => {
    if (!reloadPendingRef.current) return;

    if (Array.isArray(reloadedModelIds) && reloadedModelIds.length > 0) {
      reloadPendingRef.current = false;
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
      setIsReloading(false);
    }
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
        isModified: checked,
        modelId: null,
        modelData: null,
        motion: null,
        expression: null,
        borrowedModelId: null,
        borrowedCharId: null,
        isBorrowingMotion: false,
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

  return {
    models,
    activeModel,
    activeModelId,
    activeModelIndex,
    isDarkMode,
    backgroundColor,
    isBatching,
    isReloading,
    canvasRef,
    setActiveModelId,
    setIsDarkMode,
    setBackgroundColor,
    setIsBatching,
    handleAddModel,
    handleRemoveModel,
    handleCharacterSelect,
    handleModelSelect,
    handleModelLoad,
    handleMotionSelect,
    handleMotionOverride,
    handleBorrowingToggle,
    handleSourceCharChange,
    handleExpressionSelect,
    handleModelReload,
    handleCanvasSyncComplete,
    handleTransformChange,
    handleModifiedChange,
    handleHeadlessChange,
    handleBodylessChange,
  };
}
