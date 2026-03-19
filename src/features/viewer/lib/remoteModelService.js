import { getViewerModelApiBase } from "../../../config/urls.js";
import {
  applyProcessedExpressions,
  applyProcessedMotions,
  toControlModelData,
  toProcessedExpressions,
  toProcessedMotionGroups,
} from "./modelData.js";
import { deepCloneValue } from "./modelState.js";

export async function fetchBuildDataAsset(modelId, isModified) {
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
}

export async function resolveTargetModelData(targetModel, fetchBuildData) {
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

  const remoteData = await fetchBuildData(targetModel.modelId, targetModel.isModified);
  return {
    json: remoteData.json,
    baseUrl: remoteData.baseUrl,
    isLocalTarget: false,
  };
}

export async function buildBorrowingPatchForModel({
  targetModel,
  sourceCharId,
  sourceModelId,
  processedMotions,
  fetchBuildData,
}) {
  const resolvedTarget = await resolveTargetModelData(targetModel, fetchBuildData);
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
}

export async function buildCombinedOverridePatchForModel({
  targetModel,
  motionSourceModelId = null,
  expressionSourceModelId = null,
  fetchBuildData,
}) {
  const resolvedTarget = await resolveTargetModelData(targetModel, fetchBuildData);
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
    const motionSourceData = await fetchBuildData(motionSourceModelId, false);
    const processedMotions = toProcessedMotionGroups(motionSourceData.json, motionSourceData.baseUrl);
    hybridModelData = applyProcessedMotions(hybridModelData, targetBaseUrl, processedMotions);
  }

  if (hasExpressionOverride) {
    const expressionSourceData = await fetchBuildData(expressionSourceModelId, false);
    const processedExpressions = toProcessedExpressions(expressionSourceData.json, expressionSourceData.baseUrl);
    hybridModelData = applyProcessedExpressions(hybridModelData, targetBaseUrl, processedExpressions);
  }

  return {
    customModelData: hybridModelData,
    modelData: toControlModelData(hybridModelData),
  };
}
