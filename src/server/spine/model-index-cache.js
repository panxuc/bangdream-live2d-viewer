import { getSpineModelIndexKey } from "./remote";
import { readBangDreamR2Json } from "@/src/server/r2/bangdream-r2";

const CACHE_DURATION = 24 * 60 * 60 * 1000;

let cachedIndex = null;

export async function getSpineModelIndex() {
  const now = Date.now();
  if (cachedIndex && now - cachedIndex.fetchedAt <= CACHE_DURATION) {
    return cachedIndex;
  }

  const data = await readBangDreamR2Json(getSpineModelIndexKey());
  cachedIndex = {
    data,
    fetchedAt: now,
  };
  return cachedIndex;
}
