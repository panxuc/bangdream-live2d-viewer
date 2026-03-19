import { defineHandler } from "nitro/h3";
import { filterLive2DModelEntriesByCharacter } from "../../../features/viewer/lib/live2dRemoteUtils.js";
import { jsonResponse } from "../../http.js";
import { getModelIndex } from "../../live2d/model-index-cache.js";
import { getRequestUrl } from "../../nitro-api.js";

export default defineHandler(async (event) => {
  const searchParams = getRequestUrl(event).searchParams;
  const characterId = searchParams.get("characterId");
  const isModified = searchParams.get("isModified") === "true";

  if (!characterId) {
    return jsonResponse({ error: "Character ID is required" }, { status: 400 });
  }

  try {
    const { data, fetchedAt, branch } = await getModelIndex(isModified);
    const characterModels = filterLive2DModelEntriesByCharacter(data, characterId);

    return jsonResponse(
      {
        characterId,
        models: characterModels,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          ETag: `"${characterId}-${branch}-${fetchedAt}"`,
        },
      },
    );
  } catch {
    return jsonResponse({ error: "Failed to fetch character data" }, { status: 500 });
  }
});
