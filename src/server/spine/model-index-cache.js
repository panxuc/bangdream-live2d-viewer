import { getSpineModelIndexUrl } from "@/src/config/urls";

const CACHE_DURATION = 24 * 60 * 60 * 1000;

let cachedIndex = null;

export async function getSpineModelIndex() {
  const now = Date.now();
  if (cachedIndex && now - cachedIndex.fetchedAt <= CACHE_DURATION) {
    return cachedIndex;
  }

  const response = await fetch(getSpineModelIndexUrl());
  if (!response.ok) {
    throw new Error(`Failed to fetch Spine model index: ${response.status}`);
  }

  const data = await response.json();
  cachedIndex = {
    data,
    fetchedAt: now,
  };
  return cachedIndex;
}
