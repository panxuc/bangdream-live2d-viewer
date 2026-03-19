import { getSpineModelIndex } from "./model-index-cache.js";
import { EXTERNAL_URLS } from "../../config/urls.js";
import {
  buildSpineRemoteDescriptor,
  findSpineBuilddataAtlasFileName,
  getBuilddataAtlasAssetBaseName,
  getSpineBuildDataFileName,
  getSpineBuildDataFileUrl,
  mapAtlasPageNameToBuilddataFileName,
  resolveSpineSkeletonMeta,
  resolveSpineTextureBaseName,
  toBuilddataTextureBaseName,
  parseAtlasPageNames,
} from "./remote.js";

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

const joinUrlParts = (...parts) =>
  parts
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) return String(part).replace(/\/+$/, "");
      return String(part).replace(/^\/+|\/+$/g, "");
    })
    .join("/");

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

  const buildDataUrl = getSpineBuildDataFileUrl(assetPath, modelId);
  const buildDataResponse = await fetch(buildDataUrl);
  if (!buildDataResponse.ok) {
    throw new Error(`Failed to fetch Spine build data: ${buildDataResponse.status}`);
  }

  const buildData = await buildDataResponse.json();
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
  const atlasRemoteUrl = joinUrlParts(EXTERNAL_URLS.bangdreamR2Origin, assetPath, atlasFileName);
  const atlasResponse = await fetch(atlasRemoteUrl);
  if (!atlasResponse.ok) {
    throw new Error(`Failed to fetch Spine atlas: ${atlasResponse.status}`);
  }

  const atlasText = await atlasResponse.text();
  const pageNames = parseAtlasPageNames(atlasText);
  const { skeletonFileName, bundleRipPath } = resolveSpineSkeletonMeta(buildData);
  const skeletonRemoteUrl = joinUrlParts(EXTERNAL_URLS.bangdreamR2Origin, bundleRipPath, skeletonFileName);

  const pageUrlMap = Object.fromEntries(
    pageNames.map((pageName) => [
      pageName,
      joinUrlParts(
        EXTERNAL_URLS.bangdreamR2Origin,
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
    atlasRemoteUrl,
    skeletonFileName,
    skeletonRemoteUrl,
    pageUrlMap,
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
