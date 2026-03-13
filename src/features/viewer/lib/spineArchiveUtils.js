const SPINE_BINARY_SUFFIXES = [".skel", ".skel.bytes"];
const SPINE_ATLAS_SUFFIXES = [".atlas", ".atlas.txt"];

const getBaseName = (path) => path.replace(/\\/g, "/").split("/").pop() || path;
const getDirName = (path) => {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
};

const stripRepeatedExtension = (path, suffixes = []) => {
  let nextPath = path;
  let changed = true;

  while (changed) {
    changed = false;
    const lowerPath = nextPath.toLowerCase();
    const matchedSuffix = suffixes.find((suffix) => lowerPath.endsWith(suffix));
    if (matchedSuffix) {
      nextPath = nextPath.slice(0, -matchedSuffix.length);
      changed = true;
    }
  }

  return nextPath;
};

const stripSpineAtlasSuffix = (path) => stripRepeatedExtension(path, [".atlas.txt", ".atlas", ".txt"]);
const stripSpineSkeletonSuffix = (path) => stripRepeatedExtension(path, [".skel.bytes", ".skel", ".json", ".txt"]);
const normalizeSpineBaseName = (path) =>
  stripSpineSkeletonSuffix(stripSpineAtlasSuffix(getBaseName(path)))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const isObject = (value) => value !== null && typeof value === "object";

const isSpineBinaryPath = (path) => SPINE_BINARY_SUFFIXES.some((suffix) => path.toLowerCase().endsWith(suffix));
const isSpineAtlasPath = (path) => SPINE_ATLAS_SUFFIXES.some((suffix) => path.toLowerCase().endsWith(suffix));

const isSpineJsonData = (value) => {
  if (!isObject(value)) return false;

  const hasSkeletonMeta = isObject(value.skeleton);
  const hasBones = Array.isArray(value.bones) && value.bones.length > 0;
  const hasSlots = Array.isArray(value.slots) && value.slots.length > 0;
  const hasAnimations = isObject(value.animations) && Object.keys(value.animations).length > 0;

  return hasSkeletonMeta && (hasBones || hasSlots || hasAnimations);
};

const findSpineAtlasEntry = (entries, skeletonPath) => {
  const normalizedSkeletonPath = skeletonPath.replace(/\\/g, "/");
  const skeletonDir = getDirName(normalizedSkeletonPath);
  const skeletonBaseName = normalizeSpineBaseName(normalizedSkeletonPath);
  const atlasEntries = entries.filter((entry) => isSpineAtlasPath(entry.path));
  if (atlasEntries.length === 0) return null;

  const rankedEntries = atlasEntries
    .map((entry) => {
      const atlasDir = getDirName(entry.path);
      const atlasBaseName = normalizeSpineBaseName(entry.path);
      const sameDir = atlasDir === skeletonDir;
      const exactBase = atlasBaseName && atlasBaseName === skeletonBaseName;
      const containsMatch =
        atlasBaseName &&
        skeletonBaseName &&
        (atlasBaseName.includes(skeletonBaseName) || skeletonBaseName.includes(atlasBaseName));

      let commonPrefixLength = 0;
      const prefixLimit = Math.min(atlasBaseName.length, skeletonBaseName.length);
      while (
        commonPrefixLength < prefixLimit &&
        atlasBaseName[commonPrefixLength] === skeletonBaseName[commonPrefixLength]
      ) {
        commonPrefixLength += 1;
      }

      return {
        entry,
        score:
          (sameDir ? 1000 : 0) +
          (exactBase ? 400 : 0) +
          (containsMatch ? 150 : 0) +
          commonPrefixLength,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (rankedEntries.length === 0) return null;
  if (rankedEntries.length === 1) return rankedEntries[0].entry;
  if (rankedEntries[0].score <= 0) return null;
  return rankedEntries[0].entry;
};

const collectSpineCandidateEntries = ({ entries, loadFileContent, parseJsonBytes }) =>
  entries
    .map((entry) => {
      const lowerPath = entry.path.toLowerCase();

      if (isSpineBinaryPath(lowerPath)) {
        return {
          entry,
          skeletonJson: null,
        };
      }

      if (!lowerPath.endsWith(".json")) {
        return null;
      }

      const bytes = loadFileContent(entry.path, entry.key);
      const parsedJson = bytes ? parseJsonBytes(bytes) : null;
      if (!isSpineJsonData(parsedJson)) {
        return null;
      }

      return {
        entry,
        skeletonJson: parsedJson,
      };
    })
    .filter(Boolean)
    .map((item) => ({
      ...item,
      atlasEntry: findSpineAtlasEntry(entries, item.entry.path),
    }))
    .filter((item) => item.atlasEntry)
    .sort((a, b) => a.entry.path.localeCompare(b.entry.path));

export {
  SPINE_ATLAS_SUFFIXES,
  SPINE_BINARY_SUFFIXES,
  collectSpineCandidateEntries,
  findSpineAtlasEntry,
  isSpineAtlasPath,
  isSpineBinaryPath,
  isSpineJsonData,
};
