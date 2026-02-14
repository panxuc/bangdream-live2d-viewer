import { getLive2DBranch, getLive2DModelIndexUrl } from "@/src/config/urls";

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const branchCache = new Map();

export async function getModelIndex(isModified) {
  const branch = getLive2DBranch(isModified);
  const now = Date.now();
  const cached = branchCache.get(branch);

  if (cached && now - cached.fetchedAt <= CACHE_DURATION) {
    return cached;
  }

  const response = await fetch(getLive2DModelIndexUrl(isModified));
  if (!response.ok) {
    throw new Error(`Failed to fetch model index: ${response.status}`);
  }

  const data = await response.json();
  const nextCache = { data, fetchedAt: now, branch };
  branchCache.set(branch, nextCache);
  return nextCache;
}
