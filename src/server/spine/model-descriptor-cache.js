import { getSpineModelIndex } from "./model-index-cache";
import {
  buildSpineRemoteDescriptor,
  findSpineBuilddataAtlasFileName,
  getBuilddataAtlasAssetBaseName,
  getSpineBuildDataFileName,
  getSpineBuildDataFileKey,
  joinSpineR2KeyParts,
  mapAtlasPageNameToBuilddataFileName,
  resolveSpineSkeletonMeta,
  resolveSpineTextureBaseName,
  toBuilddataTextureBaseName,
  parseAtlasPageNames,
} from "./remote";
import { readBangDreamR2Json, readBangDreamR2Text } from "@/src/server/r2/bangdream-r2";

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const descriptorCache = new Map();

const jsonHeaders = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

const textHeaders = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "content-type": "text/plain; charset=utf-8",
};

const binaryHeaders = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
  "content-type": "application/octet-stream",
};

export async function getSpineModelDescriptor(modelId) {
  const now = Date.now();
  const cached = descriptorCache.get(modelId);
  if (cached && now - cached.fetchedAt <= CACHE_DURATION) {
    return cached;
  }

  const { data: indexData } = await getSpineModelIndex();
  const assetPath = indexData?.builddata?.assetPath;
  if (!assetPath) {
    throw new Error("Spine asset path is missing in index");
  }

  const buildDataKey = getSpineBuildDataFileKey(assetPath, modelId);
  const buildData = await readBangDreamR2Json(buildDataKey);
  const buildDataPrefix = getSpineBuildDataFileName(modelId).replace(/-builddata\.asset$/i, "");
  const base = buildData?.Base || {};
  const textures = Array.isArray(base.textures) ? base.textures : [];
  const primaryTexture = textures[0] || {};
  const textureBaseName = resolveSpineTextureBaseName(primaryTexture.fileName || "");
  const builddataFiles = indexData?.builddata?.files || [];
  const atlasFileName =
    findSpineBuilddataAtlasFileName(builddataFiles, modelId, textureBaseName) ||
    `${buildDataPrefix}-${toBuilddataTextureBaseName(textureBaseName)}.atlas.txt`;
  const builddataAtlasAssetBaseName = getBuilddataAtlasAssetBaseName(atlasFileName, modelId);
  const atlasKey = joinSpineR2KeyParts(assetPath, atlasFileName);
  const atlasText = await readBangDreamR2Text(atlasKey);
  const pageNames = parseAtlasPageNames(atlasText);
  const { skeletonFileName, bundleRipPath } = resolveSpineSkeletonMeta(buildData);
  const skeletonKey = joinSpineR2KeyParts(bundleRipPath, skeletonFileName);

  const pageKeyMap = Object.fromEntries(
    pageNames.map((pageName) => [
      pageName,
      joinSpineR2KeyParts(
        assetPath,
        `${buildDataPrefix}-${mapAtlasPageNameToBuilddataFileName(pageName, builddataAtlasAssetBaseName)}`,
      ),
    ]),
  );

  const descriptor = buildSpineRemoteDescriptor({
    modelId,
    assetPath,
    buildData,
    atlasText,
    atlasFileName,
  });

  const nextCache = {
    modelId,
    assetPath,
    buildData,
    descriptor,
    atlasText,
    atlasFileName,
    buildDataKey,
    atlasKey,
    skeletonFileName,
    skeletonKey,
    pageKeyMap,
    fetchedAt: now,
    headers: {
      json: jsonHeaders,
      text: textHeaders,
      binary: binaryHeaders,
    },
  };

  descriptorCache.set(modelId, nextCache);
  return nextCache;
}
