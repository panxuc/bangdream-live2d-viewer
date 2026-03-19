import { defineHandler } from "nitro/h3";
import { jsonResponse } from "../../http.js";
import { getRequestUrl } from "../../nitro-api.js";
import { getSpineModelIndex } from "../../spine/model-index-cache.js";
import { extractSpineModelIds, filterSpineModelIdsByCharacter } from "../../spine/remote.js";

export default defineHandler(async (event) => {
  const searchParams = getRequestUrl(event).searchParams;
  const characterId = searchParams.get("characterId");

  try {
    const { data, fetchedAt } = await getSpineModelIndex();
    const modelIds = filterSpineModelIdsByCharacter(extractSpineModelIds(data), characterId);

    return jsonResponse(
      {
        characterId,
        models: modelIds,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          ETag: `"spine-${characterId || "all"}-${fetchedAt}"`,
        },
      },
    );
  } catch {
    return jsonResponse({ error: "Failed to fetch Spine model list" }, { status: 500 });
  }
});
