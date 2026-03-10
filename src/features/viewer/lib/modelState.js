export const MAX_MODELS = 32;
export const DEFAULT_MODEL_ID = "default-1";
const DEFAULT_SCALE = 0.25;

const EMPTY_MODEL = {
  modelSource: "remote",
  characterId: null,
  modelId: null,
  modelData: null,
  customModelData: null,
  localModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  borrowedExpressionModelId: null,
  borrowedExpressionCharId: null,
  isBorrowingExpression: false,
  x: 0,
  y: 0,
  scale: DEFAULT_SCALE,
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
  expression: null,
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
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  borrowedExpressionModelId: null,
  borrowedExpressionCharId: null,
  isBorrowingExpression: false,
  localModelError: null,
};

export const RESET_ON_SOURCE_CHANGE = {
  characterId: null,
  modelId: null,
  modelData: null,
  customModelData: null,
  localModelData: null,
  motion: null,
  expression: null,
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
  x: 0,
  y: 0,
  scale: DEFAULT_SCALE,
};

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
    model?.modelSource || "",
    model?.characterId || "",
    model?.modelId || "",
    model?.isModified ? "1" : "0",
    model?.localArchiveToken || "",
    model?.localModelLabel || "",
  ].join("|");
