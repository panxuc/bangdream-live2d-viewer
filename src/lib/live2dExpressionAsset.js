export const EXPRESSION_ASSET_EXTENSION = ".exp3.asset.json";
export const EXPRESSION_JSON_EXTENSION = ".exp3.json";

const BLEND_MODE_BY_ENUM = new Map([
  [0, "Overwrite"],
  [1, "Add"],
  [2, "Multiply"],
]);

const BLEND_MODE_BY_TEXT = new Map([
  ["add", "Add"],
  ["additive", "Add"],
  ["multiply", "Multiply"],
  ["overwrite", "Overwrite"],
  ["override", "Overwrite"],
]);

const isObject = (value) => value !== null && typeof value === "object";

const toFiniteNumber = (value, fallback) => {
  const number =
    typeof value === "number" || (typeof value === "string" && value.trim() !== "") ? Number(value) : NaN;
  return Number.isFinite(number) ? number : fallback;
};

export const isLive2DExpressionAssetPath = (path) =>
  typeof path === "string" && path.toLowerCase().endsWith(EXPRESSION_ASSET_EXTENSION);

export const isLive2DExpressionJsonPath = (path) =>
  typeof path === "string" && path.toLowerCase().endsWith(EXPRESSION_JSON_EXTENSION);

export const toLive2DExpressionAssetPath = (path) => {
  if (typeof path !== "string" || isLive2DExpressionAssetPath(path)) {
    return path;
  }

  return path.replace(/\.exp3\.json$/i, EXPRESSION_ASSET_EXTENSION);
};

export const toCubismExpressionBlend = (blend) => {
  if (typeof blend === "number") {
    return BLEND_MODE_BY_ENUM.get(blend) || "Add";
  }

  if (typeof blend === "string") {
    const numericBlend = Number(blend);
    if (blend.trim() !== "" && Number.isFinite(numericBlend)) {
      return BLEND_MODE_BY_ENUM.get(numericBlend) || "Add";
    }

    return BLEND_MODE_BY_TEXT.get(blend.toLowerCase()) || "Add";
  }

  return "Add";
};

export const convertLive2DExpressionAssetJson = (assetJson) => {
  const data = isObject(assetJson?.data) ? assetJson.data : assetJson;
  const parameters = Array.isArray(data?.Parameters) ? data.Parameters : [];

  return {
    Type: typeof data?.Type === "string" ? data.Type : "Live2D Expression",
    FadeInTime: toFiniteNumber(data?.FadeInTime, 1),
    FadeOutTime: toFiniteNumber(data?.FadeOutTime, 1),
    Parameters: parameters
      .map((parameter) => {
        if (!isObject(parameter) || typeof parameter.Id !== "string" || !parameter.Id) {
          return null;
        }

        return {
          Id: parameter.Id,
          Value: toFiniteNumber(parameter.Value, 0),
          Blend: toCubismExpressionBlend(parameter.Blend),
        };
      })
      .filter(Boolean),
  };
};
