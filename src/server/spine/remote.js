import { getViewerSpineApiBase } from "@/src/config/urls";
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
} from "@/src/features/viewer/lib/spineRemoteUtils";

const ensureTrailingSlash = (value) => (value.endsWith("/") ? value : `${value}/`);
const joinR2KeyParts = (...parts) =>
  parts
    .filter(Boolean)
    .map((part) => String(part).replace(/^\/+|\/+$/g, ""))
    .join("/");

export function getSpineModelIndexKey() {
  return "sdchara/_info.json";
}

export function getSpineBuildDataFileKey(assetPath, modelId) {
  return joinR2KeyParts(ensureTrailingSlash(assetPath), getSpineBuildDataFileName(modelId));
}

export function joinSpineR2KeyParts(...parts) {
  return joinR2KeyParts(...parts);
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
