import { extractNumericCharacterIdFromModelKey } from "./characterIdAliases.js";

export function collectAvailableCharacterIds(modelKeys = []) {
  const availableIds = new Set();

  modelKeys.forEach((modelKey) => {
    const numericId = extractNumericCharacterIdFromModelKey(modelKey);
    if (numericId != null) {
      availableIds.add(numericId);
    }
  });

  return availableIds;
}
