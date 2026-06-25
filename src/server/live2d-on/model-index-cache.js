import { onCharacterById } from "@/src/server/catalog/on-characters";
import { readBangDreamR2Json } from "@/src/server/r2/bangdream-r2";
import {
  LIVE2D_ON_INFO_KEY,
  isOnModelForCharacter,
  toOnLive2DModelEntry,
} from "./remote";
import { getOnLive2DModelDescriptor } from "./model-descriptor-cache";

const CACHE_DURATION = 60 * 1000;

let cachedInfo = null;
const characterIndexCache = new Map();

export async function getOnLive2DInfoIndex() {
  const now = Date.now();
  if (cachedInfo && now - cachedInfo.fetchedAt <= CACHE_DURATION) {
    return cachedInfo;
  }

  const data = await readBangDreamR2Json(LIVE2D_ON_INFO_KEY);
  cachedInfo = {
    data,
    modelDirectories: Object.keys(data || {}),
    fetchedAt: now,
  };
  characterIndexCache.clear();
  return cachedInfo;
}

export async function getOnLive2DModelIndex(characterId) {
  const character = onCharacterById.get(characterId);
  if (!character) {
    throw Object.assign(new Error("Unsupported ON character ID"), { status: 400 });
  }

  const now = Date.now();
  const cached = characterIndexCache.get(characterId);
  if (cached && now - cached.fetchedAt <= CACHE_DURATION) {
    return cached;
  }

  const info = await getOnLive2DInfoIndex();
  const candidateModels = info.modelDirectories
    .filter((modelDirectory) => isOnModelForCharacter(modelDirectory, characterId))
    .sort((a, b) => a.localeCompare(b))
    .map(toOnLive2DModelEntry);
  const checkedModels = await Promise.all(
    candidateModels.map(async (model) => {
      try {
        await getOnLive2DModelDescriptor(model.id);
        return model;
      } catch (error) {
        if (error.status === 404) return null;
        throw error;
      }
    }),
  );
  const models = checkedModels.filter(Boolean);

  const nextCache = {
    characterId,
    character,
    models,
    fetchedAt: now,
    infoFetchedAt: info.fetchedAt,
  };

  characterIndexCache.set(characterId, nextCache);
  return nextCache;
}
