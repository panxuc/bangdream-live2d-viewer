import { getLive2DBranch, getLive2DModelIndexKey } from "./remote";
import { readBangDreamR2Json } from "@/src/server/r2/bangdream-r2";

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const branchCache = new Map();

export async function getModelIndex(isModified) {
  const branch = getLive2DBranch(isModified);
  const now = Date.now();
  const cached = branchCache.get(branch);

  if (cached && now - cached.fetchedAt <= CACHE_DURATION) {
    return cached;
  }

  const data = await readBangDreamR2Json(getLive2DModelIndexKey(isModified));
  const nextCache = { data, fetchedAt: now, branch };
  branchCache.set(branch, nextCache);
  return nextCache;
}
