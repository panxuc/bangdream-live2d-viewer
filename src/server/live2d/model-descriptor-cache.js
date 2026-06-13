import { getLive2DBaseKey, getLive2DFileKey } from "./remote";
import { Asset2JsonConverter } from "./asset-converter";
import { getLive2DBranch } from "@/src/config/urls";
import { toLive2DModelDescriptor } from "@/src/features/viewer/lib/live2dRemoteUtils";
import { readBangDreamR2Json } from "@/src/server/r2/bangdream-r2";

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

  const modelBaseKey = getLive2DBaseKey({ isModified, model });
  const rawBuildData = await readBangDreamR2Json(getLive2DFileKey({ isModified, model, filePath: "buildData.asset" }));
  const processedBuildData = Asset2JsonConverter.processFile(rawBuildData, model.replace("_rip", ""));
  const nextCache = {
    model,
    isModified: Boolean(isModified),
    branch: getLive2DBranch(isModified, model),
    fetchedAt: now,
    modelBaseKey,
    rawBuildData,
    processedBuildData,
    descriptor: toLive2DModelDescriptor({
      modelId: model,
      isModified,
      buildData: processedBuildData,
    }),
  };

  descriptorCache.set(key, nextCache);
  return nextCache;
}
