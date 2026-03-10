"use client";

import { useCallback, useMemo, useReducer } from "react";
import { createInitialViewerLayerState, viewerLayerReducer } from "@/src/features/viewer/lib/viewerLayerReducer.mjs";

export function useViewerLayerState() {
  const [state, dispatch] = useReducer(viewerLayerReducer, undefined, createInitialViewerLayerState);

  const activeModel = useMemo(
    () => state.models.find((model) => model.id === state.activeModelId) || state.models[0],
    [state.models, state.activeModelId],
  );
  const activeModelIndex = useMemo(
    () => state.models.findIndex((model) => model.id === state.activeModelId),
    [state.models, state.activeModelId],
  );

  const setActiveModelId = useCallback((modelId) => {
    dispatch({ type: "set_active_model", modelId });
  }, []);

  const addModel = useCallback((model) => {
    dispatch({ type: "add_model", model });
  }, []);

  const insertModelAfter = useCallback((afterId, model) => {
    dispatch({ type: "insert_model_after", afterId, model });
  }, []);

  const removeModel = useCallback((modelId) => {
    dispatch({ type: "remove_model", modelId });
  }, []);

  const moveModel = useCallback((modelId, direction) => {
    dispatch({ type: "move_model", modelId, direction });
  }, []);

  const reorderModels = useCallback((draggedId, targetId) => {
    dispatch({ type: "reorder_models", draggedId, targetId });
  }, []);

  const updateModelById = useCallback((modelId, updates) => {
    dispatch({ type: "update_model", modelId, updates });
  }, []);

  const mapModels = useCallback((updater) => {
    dispatch({ type: "map_models", updater });
  }, []);

  return {
    models: state.models,
    activeModelId: state.activeModelId,
    activeModel,
    activeModelIndex,
    setActiveModelId,
    addModel,
    insertModelAfter,
    removeModel,
    moveModel,
    reorderModels,
    updateModelById,
    mapModels,
  };
}
