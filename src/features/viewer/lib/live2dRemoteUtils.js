import { matchesCharacterPrefixedModelKey } from "./characterIdAliases.js";

export function filterOutGeneralLive2DModelKeys(modelKeys = []) {
  return modelKeys.filter((modelKey) => !String(modelKey).includes("_general"));
}

export function filterLive2DModelEntriesByCharacter(modelEntries, characterId) {
  const entries = Object.entries(modelEntries || {});

  return entries
    .filter(([modelKey]) => matchesCharacterPrefixedModelKey(modelKey, characterId, { allowBiliPrefix: true }))
    .reduce((accumulator, [modelKey, value]) => {
      accumulator[modelKey] = value;
      return accumulator;
    }, {});
}

export function toLive2DModelDescriptor({ modelId, isModified, buildData }) {
  return {
    kind: "live2d",
    modelId,
    isModified: Boolean(isModified),
    buildData,
  };
}
