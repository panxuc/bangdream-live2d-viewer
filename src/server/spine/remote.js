import { EXTERNAL_URLS, getViewerSpineApiBase } from "../../config/urls.js";
import {
  extractSpineModelIds,
  findSpineBuilddataAtlasFileName,
  getBuilddataAtlasAssetBaseName,
  filterSpineModelIdsByCharacter,
  getSpineBuildDataFileName,
  mapAtlasPageNameToBuilddataFileName,
  parseAtlasPageNames,
  resolveSpineSkeletonMeta,
  resolveSpineTextureBaseName,
  toBuilddataTextureBaseName,
} from "../../features/viewer/lib/spineRemoteUtils.js";

const ensureTrailingSlash = (value) => (value.endsWith("/") ? value : `${value}/`);
const joinUrlParts = (...parts) =>
  parts
    .filter(Boolean)
    .map((part, index) => {
      if (index === 0) return String(part).replace(/\/+$/, "");
      return String(part).replace(/^\/+|\/+$/g, "");
    })
    .join("/");

export function getSpineBuildDataFileUrl(assetPath, modelId) {
  return joinUrlParts(EXTERNAL_URLS.bangdreamR2Origin, ensureTrailingSlash(assetPath), getSpineBuildDataFileName(modelId));
}

export function buildSpineRemoteDescriptor({ modelId, assetPath, buildData, atlasText, atlasFileName }) {
  const base = buildData?.Base || {};
  const textures = Array.isArray(base.textures) ? base.textures : [];
  const primaryTexture = textures[0] || {};
  const textureBaseName = resolveSpineTextureBaseName(primaryTexture.fileName || "");
  const pageNames = parseAtlasPageNames(atlasText);
  const apiBase = getViewerSpineApiBase(modelId);
  const { skeletonFileName } = resolveSpineSkeletonMeta(buildData);

  const imageMap = Object.fromEntries(
    pageNames.map((pageName) => [
      pageName,
      {
        url: `${apiBase}${encodeURIComponent(pageName)}`,
      },
    ]),
  );

  return {
    kind: "spine",
    modelId,
    skinName: base.skinName || "default",
    skeletonFileType: "binary",
    skeletonFileName,
    skeletonUrl: `${apiBase}${encodeURIComponent(skeletonFileName)}`,
    atlasFileName,
    atlasText,
    images: imageMap,
    textureBaseName,
    assetPath,
  };
}

export {
  extractSpineModelIds,
  findSpineBuilddataAtlasFileName,
  getBuilddataAtlasAssetBaseName,
  filterSpineModelIdsByCharacter,
  getSpineBuildDataFileName,
  mapAtlasPageNameToBuilddataFileName,
  parseAtlasPageNames,
  resolveSpineSkeletonMeta,
  resolveSpineTextureBaseName,
  toBuilddataTextureBaseName,
};
