import {
  characters,
} from "../../../server/catalog/characters.js";

const DIGITS_ONLY_PATTERN = /^\d+$/;
const MODEL_KEY_NUMERIC_PREFIX_PATTERN = /^(?:bili_)?(\d+)(?:_|$)/;

const addAliasEntry = (aliasMap, fromId, toId) => {
  if (!aliasMap.has(fromId)) {
    aliasMap.set(fromId, new Set());
  }
  aliasMap.get(fromId).add(toId);
};

const buildAliasMap = () => {
  const aliasMap = new Map();

  (Array.isArray(characters) ? characters : []).forEach((character) => {
    const numericBaseId = Number.parseInt(character?.id, 10);
    if (!Number.isFinite(numericBaseId)) return;

    const aliasIds = character?.alias;
    (Array.isArray(aliasIds) ? aliasIds : [aliasIds]).forEach((aliasId) => {
      const numericAliasId = Number.parseInt(aliasId, 10);
      if (!Number.isFinite(numericAliasId) || numericAliasId === numericBaseId) return;
      addAliasEntry(aliasMap, numericBaseId, numericAliasId);
    });
  });

  return aliasMap;
};

const CHARACTER_ALIAS_MAP_RESOLVED = buildAliasMap();

export function expandCharacterIdVariants(characterId) {
  if (typeof characterId !== "string" || !DIGITS_ONLY_PATTERN.test(characterId)) {
    return [];
  }

  const numericId = Number.parseInt(characterId, 10);
  if (!Number.isFinite(numericId)) {
    return [characterId];
  }

  const variants = [numericId, ...(CHARACTER_ALIAS_MAP_RESOLVED.get(numericId) || [])];
  return Array.from(new Set(variants)).map((variantId) => String(variantId).padStart(characterId.length, "0"));
}

export function matchesCharacterPrefixedModelKey(modelKey, characterId, { allowBiliPrefix = false } = {}) {
  const variants = expandCharacterIdVariants(characterId);
  if (variants.length === 0) return false;

  return variants.some((variant) => {
    if (modelKey.startsWith(`${variant}_`)) {
      return true;
    }

    if (allowBiliPrefix && modelKey.startsWith(`bili_${variant}_`)) {
      return true;
    }

    return false;
  });
}

export function expandCharacterNumericVariants(characterId) {
  const numericId = typeof characterId === "number" ? characterId : Number.parseInt(characterId, 10);
  if (!Number.isFinite(numericId)) {
    return [];
  }

  return Array.from(new Set([numericId, ...(CHARACTER_ALIAS_MAP_RESOLVED.get(numericId) || [])])).sort((a, b) => a - b);
}

export function extractNumericCharacterIdFromModelKey(modelKey) {
  if (typeof modelKey !== "string") return null;
  const matched = modelKey.match(MODEL_KEY_NUMERIC_PREFIX_PATTERN);
  if (!matched?.[1]) return null;

  const numericId = Number.parseInt(matched[1], 10);
  return Number.isFinite(numericId) ? numericId : null;
}

export function hasAvailableModelForCharacter(characterId, availableCharacterIds) {
  if (!(availableCharacterIds instanceof Set)) {
    return false;
  }

  return expandCharacterNumericVariants(characterId).some((candidateId) => availableCharacterIds.has(candidateId));
}
