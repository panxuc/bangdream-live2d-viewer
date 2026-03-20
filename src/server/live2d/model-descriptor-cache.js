import { getLive2DBaseUrl } from "./remote";
import { Asset2JsonConverter } from "./asset-converter";
import { getLive2DBranch } from "@/src/config/urls";
import { toLive2DModelDescriptor } from "@/src/features/viewer/lib/live2dRemoteUtils";

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const descriptorCache = new Map();

const getCacheKey = ({ model, isModified }) => `${model}:${isModified ? "1" : "0"}`;

export async function getLive2DModelDescriptor({ model, isModified = false }) {
  const key = getCacheKey({ model, isModified });
  const now = Date.now();
  const cached = descriptorCache.get(key);
  if (cached && now - cached.fetchedAt <= CACHE_DURATION) {
    return cached;
  }

  const modelBaseUrl = getLive2DBaseUrl({ isModified, model });
  const response = await fetch(`${modelBaseUrl}buildData.asset`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Live2D build data: ${response.status}`);
  }

  const rawBuildData = await response.json();
  const processedBuildData = Asset2JsonConverter.processFile(rawBuildData, model.replace("_rip", ""));
  const nextCache = {
    model,
    isModified: Boolean(isModified),
    branch: getLive2DBranch(isModified, model),
    fetchedAt: now,
    modelBaseUrl,
    rawBuildData,
    processedBuildData,
    descriptor: toLive2DModelDescriptor({
      modelId: model,
      isModified,
      buildData: processedBuildData,
      modelBaseUrl,
    }),
  };

  descriptorCache.set(key, nextCache);
  return nextCache;
}
