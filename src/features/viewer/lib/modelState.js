export const MAX_MODELS = 32;
export const DEFAULT_MODEL_ID = "default-1";
export const MODEL_TYPES = {
  LIVE2D: "live2d",
  SPINE: "spine",
};

export const MODEL_PROVIDERS = {
  GBP: "gbp",
  ON: "on",
};

const DEFAULT_SCALE_BY_MODEL_TYPE = {
  [MODEL_TYPES.LIVE2D]: 0.3,
  [MODEL_TYPES.SPINE]: 1.4,
};

const DEFAULT_TRANSFORM_BY_MODEL_TYPE = {
  [MODEL_TYPES.LIVE2D]: {
    x: 0,
    y: 0,
  },
  [MODEL_TYPES.SPINE]: {
    x: 0,
    y: 0,
  },
};

const DEFAULT_TRANSFORM_BY_PROVIDER = {
  [MODEL_PROVIDERS.ON]: {
    [MODEL_TYPES.LIVE2D]: {
      x: 0,
      y: 350,
      scale: 1,
    },
  },
};

const TRANSFORM_CONFIG_BY_MODEL_TYPE = {
  [MODEL_TYPES.LIVE2D]: {
    min: 0.1,
    max: 0.7,
    step: 0.05,
  },
  [MODEL_TYPES.SPINE]: {
    min: 0.1,
    max: 3,
    step: 0.05,
  },
};

const LIVE2D_SCALE_DISPLAY_CONFIG_BY_PROVIDER = {
  [MODEL_PROVIDERS.GBP]: {
    min: 0.3,
    max: 3,
    step: 0.05,
  },
  [MODEL_PROVIDERS.ON]: {
    min: 0.3,
    max: 3,
    step: 0.05,
  },
};

const toFiniteNumber = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback);

export const getDefaultScaleForModelType = (modelType = MODEL_TYPES.LIVE2D) =>
  DEFAULT_SCALE_BY_MODEL_TYPE[modelType] || DEFAULT_SCALE_BY_MODEL_TYPE[MODEL_TYPES.LIVE2D];

export const getTransformConfigForModelType = (modelType = MODEL_TYPES.LIVE2D) => ({
  defaultValue: getDefaultScaleForModelType(modelType),
  ...(TRANSFORM_CONFIG_BY_MODEL_TYPE[modelType] || TRANSFORM_CONFIG_BY_MODEL_TYPE[MODEL_TYPES.LIVE2D]),
});

export const getDefaultTransformForModelType = (modelType = MODEL_TYPES.LIVE2D) => ({
  ...(DEFAULT_TRANSFORM_BY_MODEL_TYPE[modelType] || DEFAULT_TRANSFORM_BY_MODEL_TYPE[MODEL_TYPES.LIVE2D]),
  scale: getDefaultScaleForModelType(modelType),
});

export const getDefaultTransformForModel = (model = {}) => ({
  ...getDefaultTransformForModelType(model.modelType),
  ...(DEFAULT_TRANSFORM_BY_PROVIDER[model.modelProvider]?.[model.modelType] || {}),
});

export const getTransformDisplayConfigForModel = (model = {}) => {
  const defaultTransform = getDefaultTransformForModel(model);
  const baseScaleConfig = getTransformConfigForModelType(model.modelType);
  const scaleConfig =
    model.modelType === MODEL_TYPES.LIVE2D
      ? LIVE2D_SCALE_DISPLAY_CONFIG_BY_PROVIDER[model.modelProvider] || LIVE2D_SCALE_DISPLAY_CONFIG_BY_PROVIDER[MODEL_PROVIDERS.GBP]
      : baseScaleConfig;
  const actualScale = toFiniteNumber(model.scale, defaultTransform.scale);
  const defaultScale = defaultTransform.scale || 1;
  const normalizeScale = model.modelType === MODEL_TYPES.LIVE2D;

  return {
    x: {
      min: -400,
      max: 400,
      step: 5,
      value: toFiniteNumber(model.x, defaultTransform.x) - defaultTransform.x,
      defaultValue: 0,
    },
    y: {
      min: -400,
      max: 400,
      step: 5,
      value: toFiniteNumber(model.y, defaultTransform.y) - defaultTransform.y,
      defaultValue: 0,
    },
    scale: {
      min: scaleConfig.min,
      max: scaleConfig.max,
      step: scaleConfig.step,
      value: normalizeScale ? actualScale / defaultScale : actualScale,
      defaultValue: normalizeScale ? 1 : baseScaleConfig.defaultValue,
    },
    defaultTransform,
    normalizeScale,
  };
};

export const toActualTransformValue = (model = {}, key, displayValue) => {
  const displayConfig = getTransformDisplayConfigForModel(model);
  const numericValue = toFiniteNumber(displayValue, displayConfig[key]?.defaultValue || 0);

  if (key === "scale" && displayConfig.normalizeScale) {
    return displayConfig.defaultTransform.scale * numericValue;
  }

  if ((key === "x" || key === "y") && displayConfig[key]) {
    return displayConfig.defaultTransform[key] + numericValue;
  }

  return numericValue;
};

export const supportsRemoteModelSource = (modelType) => modelType === MODEL_TYPES.LIVE2D;
export const supportsRemoteSpineModelSource = (modelType) => modelType === MODEL_TYPES.SPINE;
export const isSpineModelType = (modelType) => modelType === MODEL_TYPES.SPINE;
export const isLive2DModelType = (modelType) => !isSpineModelType(modelType);

export const SOURCE_OPTION_KEYS = {
  REMOTE_LIVE2D: "remote-live2d",
  REMOTE_SPINE: "remote-spine",
  LOCAL_LIVE2D: "local-live2d",
  LOCAL_SPINE: "local-spine",
};

export const getSourceOptionKey = (modelType = MODEL_TYPES.LIVE2D, modelSource = "remote") => {
  if (modelSource === "remote" && modelType === MODEL_TYPES.SPINE) {
    return SOURCE_OPTION_KEYS.REMOTE_SPINE;
  }

  if (modelSource === "local" && modelType === MODEL_TYPES.SPINE) {
    return SOURCE_OPTION_KEYS.LOCAL_SPINE;
  }

  if (modelSource === "local") {
    return SOURCE_OPTION_KEYS.LOCAL_LIVE2D;
  }

  return SOURCE_OPTION_KEYS.REMOTE_LIVE2D;
};

export const parseSourceOptionKey = (optionKey) => {
  switch (optionKey) {
    case "local":
    case SOURCE_OPTION_KEYS.LOCAL_SPINE:
    case SOURCE_OPTION_KEYS.LOCAL_LIVE2D:
      return {
        modelType: optionKey === SOURCE_OPTION_KEYS.LOCAL_SPINE ? MODEL_TYPES.SPINE : MODEL_TYPES.LIVE2D,
        modelSource: "local",
      };
    case SOURCE_OPTION_KEYS.REMOTE_SPINE:
      return {
        modelType: MODEL_TYPES.SPINE,
        modelSource: "remote",
      };
    case "remote":
    case SOURCE_OPTION_KEYS.REMOTE_LIVE2D:
    default:
      return {
        modelType: MODEL_TYPES.LIVE2D,
        modelSource: "remote",
      };
  }
};

const EMPTY_MODEL = {
  modelProvider: MODEL_PROVIDERS.GBP,
  modelType: MODEL_TYPES.LIVE2D,
  modelSource: "remote",
  characterId: null,
  modelId: null,
  modelData: null,
  customModelData: null,
  localModelData: null,
  motion: null,
  motionLoop: false,
  expression: null,
  live2dParameterValues: {},
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  borrowedExpressionModelId: null,
  borrowedExpressionCharId: null,
  isBorrowingExpression: false,
  ...getDefaultTransformForModelType(MODEL_TYPES.LIVE2D),
  isModified: false,
  isHeadless: false,
  isBodyless: false,
  isVisible: true,
  localModelFileName: null,
  localArchiveToken: null,
  localModelCandidates: [],
  localModelPath: null,
  localModelLabel: null,
  localModelError: null,
};

export const RESET_ON_CHARACTER_CHANGE = {
  modelId: null,
  modelData: null,
  customModelData: null,
  motion: null,
  motionLoop: false,
  expression: null,
  live2dParameterValues: {},
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  borrowedExpressionModelId: null,
  borrowedExpressionCharId: null,
  isBorrowingExpression: false,
  localModelError: null,
};

export const RESET_ON_MODEL_CHANGE = {
  modelData: null,
  customModelData: null,
  motion: null,
  motionLoop: false,
  expression: null,
  live2dParameterValues: {},
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  borrowedExpressionModelId: null,
  borrowedExpressionCharId: null,
  isBorrowingExpression: false,
  localModelError: null,
};

export const RESET_ON_SOURCE_CHANGE = {
  modelProvider: MODEL_PROVIDERS.GBP,
  characterId: null,
  modelId: null,
  modelData: null,
  customModelData: null,
  localModelData: null,
  motion: null,
  motionLoop: false,
  expression: null,
  live2dParameterValues: {},
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  borrowedExpressionModelId: null,
  borrowedExpressionCharId: null,
  isBorrowingExpression: false,
  isModified: false,
  isHeadless: false,
  isBodyless: false,
  localModelFileName: null,
  localArchiveToken: null,
  localModelCandidates: [],
  localModelPath: null,
  localModelLabel: null,
  localModelError: null,
  ...getDefaultTransformForModelType(MODEL_TYPES.LIVE2D),
};

export const createResetOnSourceChange = (modelType = MODEL_TYPES.LIVE2D) => ({
  ...RESET_ON_SOURCE_CHANGE,
  modelType,
  ...getDefaultTransformForModelType(modelType),
});

export const createResetOnProviderChange = (modelProvider = MODEL_PROVIDERS.GBP) => ({
  ...RESET_ON_SOURCE_CHANGE,
  modelProvider,
  modelType: MODEL_TYPES.LIVE2D,
  modelSource: "remote",
  ...getDefaultTransformForModel({ modelProvider, modelType: MODEL_TYPES.LIVE2D }),
});

export const toNullableSelection = (value) => (value === "none" ? null : value);
export const createModel = (id) => ({ id, ...EMPTY_MODEL });

export const deepCloneValue = (value) => {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fall back to JSON cloning below.
    }
  }

  return value == null ? value : JSON.parse(JSON.stringify(value));
};

export const getModelSourceSignature = (model) =>
  [
    model?.modelType || "",
    model?.modelProvider || MODEL_PROVIDERS.GBP,
    model?.modelSource || "",
    model?.characterId || "",
    model?.modelId || "",
    model?.isModified ? "1" : "0",
    model?.localArchiveToken || "",
    model?.localModelPath || "",
    model?.localModelLabel || "",
  ].join("|");
