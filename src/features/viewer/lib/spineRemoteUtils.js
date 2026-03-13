import { expandCharacterIdVariants } from "./characterIdAliases.js";

const BUILD_DATA_FILE_PATTERN = /^assets-star-forassetbundle-startapp-sdchara-builddata-(.+)-builddata\.asset$/i;
const SKELETON_DATA_SUFFIX = "_SkeletonData.asset";
const ATLAS_ASSET_SUFFIX = "_Atlas.asset";
const ATLAS_TEXT_SUFFIX = ".atlas.txt";
const PNG_SUFFIX_PATTERN = /(?:_(\d+))?\.png$/i;

export function extractSpineModelIds(indexData) {
  const files = Array.isArray(indexData?.builddata?.files) ? indexData.builddata.files : [];

  return files
    .map((fileName) => {
      const matched = fileName.match(BUILD_DATA_FILE_PATTERN);
      return matched?.[1] || null;
    })
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export function filterSpineModelIdsByCharacter(modelIds, characterId) {
  if (!characterId) return modelIds;
  const variants = expandCharacterIdVariants(characterId);
  if (variants.length === 0) return [];

  return modelIds.filter((modelId) =>
    variants.some((variant) => modelId === variant || modelId.startsWith(`${variant}_`)),
  );
}

export function getSpineBuildDataFileName(modelId) {
  return `assets-star-forassetbundle-startapp-sdchara-builddata-${modelId}-builddata.asset`;
}

export function findSpineBuilddataAtlasFileName(builddataFiles, modelId, preferredTextureBaseName = "") {
  const prefix = `${getSpineBuildDataFileName(modelId).replace(/-builddata\.asset$/i, "")}-`;
  const atlasCandidates = (Array.isArray(builddataFiles) ? builddataFiles : [])
    .filter((fileName) => fileName.startsWith(prefix) && fileName.toLowerCase().endsWith(ATLAS_TEXT_SUFFIX));

  if (atlasCandidates.length === 0) return null;
  if (atlasCandidates.length === 1) return atlasCandidates[0];

  const preferredBaseName = toBuilddataTextureBaseName(preferredTextureBaseName);
  if (preferredBaseName) {
    const exactMatch = atlasCandidates.find((fileName) =>
      fileName.toLowerCase() === `${prefix}${preferredBaseName}${ATLAS_TEXT_SUFFIX}`.toLowerCase(),
    );
    if (exactMatch) return exactMatch;
  }

  return atlasCandidates.sort((a, b) => a.localeCompare(b))[0];
}

export function resolveSpineTextureBaseName(textureFileName = "") {
  return textureFileName.replace(new RegExp(`${ATLAS_ASSET_SUFFIX}$`, "i"), "");
}

export function toBuilddataTextureBaseName(textureBaseName = "") {
  return String(textureBaseName || "").toLowerCase();
}

export function getBuilddataAtlasAssetBaseName(atlasFileName, modelId) {
  const prefix = `${getSpineBuildDataFileName(modelId).replace(/-builddata\.asset$/i, "")}-`;
  if (typeof atlasFileName !== "string" || !atlasFileName.startsWith(prefix)) {
    return "";
  }

  return atlasFileName.slice(prefix.length).replace(new RegExp(`${ATLAS_TEXT_SUFFIX}$`, "i"), "");
}

export function mapAtlasPageNameToBuilddataFileName(pageName, builddataAtlasAssetBaseName) {
  const normalizedBaseName = toBuilddataTextureBaseName(builddataAtlasAssetBaseName);
  if (!pageName) return normalizedBaseName;

  const matched = String(pageName).match(PNG_SUFFIX_PATTERN);
  if (matched) {
    const suffix = matched[1] ? `_${matched[1]}` : "";
    return `${normalizedBaseName}${suffix}.png`;
  }

  return pageName.toLowerCase();
}

export function parseAtlasPageNames(atlasText) {
  const lines = String(atlasText || "").split(/\r\n|\r|\n/);
  const pageNames = [];
  let expectingPageName = true;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      expectingPageName = true;
      return;
    }

    if (expectingPageName) {
      pageNames.push(line);
      expectingPageName = false;
    }
  });

  return pageNames;
}

export function resolveSpineSkeletonMeta(buildData) {
  const base = buildData?.Base || {};
  const model = base.model || {};
  const bundleBaseName = model.bundleName?.split("/").filter(Boolean).pop() || "";
  const fallbackBaseName = (model.fileName || "").replace(new RegExp(`${SKELETON_DATA_SUFFIX}$`, "i"), "");
  const skeletonBaseName = bundleBaseName || fallbackBaseName;

  return {
    skeletonBaseName,
    skeletonFileName: `${skeletonBaseName}.skel`,
    bundleRipPath: `${String(model.bundleName || "").toLowerCase()}_rip`,
  };
}
