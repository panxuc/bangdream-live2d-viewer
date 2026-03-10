import { DEFAULT_MODEL_ID, createModel } from "./modelState.js";

export const createInitialViewerLayerState = () => ({
  models: [createModel(DEFAULT_MODEL_ID)],
  activeModelId: DEFAULT_MODEL_ID,
});

export function viewerLayerReducer(state, action) {
  switch (action.type) {
    case "set_active_model":
      return {
        ...state,
        activeModelId: action.modelId,
      };

    case "add_model":
      return {
        models: [...state.models, action.model],
        activeModelId: action.model.id,
      };

    case "insert_model_after": {
      const sourceIndex = state.models.findIndex((model) => model.id === action.afterId);
      if (sourceIndex === -1) return state;

      const nextModels = [...state.models];
      nextModels.splice(sourceIndex + 1, 0, action.model);

      return {
        models: nextModels,
        activeModelId: action.model.id,
      };
    }

    case "remove_model": {
      const nextModels = state.models.filter((model) => model.id !== action.modelId);
      if (nextModels.length === state.models.length || nextModels.length === 0) {
        return state;
      }

      return {
        models: nextModels,
        activeModelId:
          state.activeModelId === action.modelId
            ? nextModels[nextModels.length - 1].id
            : state.activeModelId,
      };
    }

    case "move_model": {
      const index = state.models.findIndex((model) => model.id === action.modelId);
      if (index === -1) return state;

      const targetIndex = action.direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= state.models.length) return state;

      const nextModels = [...state.models];
      const [movedModel] = nextModels.splice(index, 1);
      nextModels.splice(targetIndex, 0, movedModel);

      return {
        ...state,
        models: nextModels,
      };
    }

    case "reorder_models": {
      const fromIndex = state.models.findIndex((model) => model.id === action.draggedId);
      const toIndex = state.models.findIndex((model) => model.id === action.targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return state;

      const nextModels = [...state.models];
      const [draggedModel] = nextModels.splice(fromIndex, 1);
      nextModels.splice(toIndex, 0, draggedModel);

      return {
        ...state,
        models: nextModels,
      };
    }

    case "update_model":
      return {
        ...state,
        models: state.models.map((model) => {
          if (model.id !== action.modelId) return model;
          const nextUpdates = typeof action.updates === "function" ? action.updates(model) : action.updates;
          return nextUpdates ? { ...model, ...nextUpdates } : model;
        }),
      };

    case "map_models":
      return {
        ...state,
        models: state.models.map((model, index) => {
          const nextModel = action.updater(model, index);
          return nextModel || model;
        }),
      };

    default:
      return state;
  }
}
