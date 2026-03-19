import { defineHandler } from "nitro/h3";
import { collectAvailableCharacterIds } from "../../../features/viewer/lib/characterAvailability.js";
import { filterOutGeneralLive2DModelKeys } from "../../../features/viewer/lib/live2dRemoteUtils.js";
import { jsonResponse } from "../../http.js";
import { getRequestUrl } from "../../nitro-api.js";
import { getModelIndex } from "../../live2d/model-index-cache.js";
import { getSpineModelIndex } from "../../spine/model-index-cache.js";
import { extractSpineModelIds } from "../../spine/remote.js";

export default defineHandler(async (event) => {
  const searchParams = getRequestUrl(event).searchParams;
  const modelType = searchParams.get("modelType");
  const isModified = searchParams.get("isModified") === "true";
  const rulesVersion = searchParams.get("rulesVersion") || "default";

  if (modelType !== "live2d" && modelType !== "spine") {
    return jsonResponse({ error: "Unsupported modelType" }, { status: 400 });
  }

  try {
    if (modelType === "live2d") {
      const { data, fetchedAt, branch } = await getModelIndex(isModified);
      const availableCharacterIds = Array.from(
        collectAvailableCharacterIds(filterOutGeneralLive2DModelKeys(Object.keys(data))),
      ).sort((a, b) => a - b);

      return jsonResponse(
        {
          modelType,
          isModified,
          availableCharacterIds,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
            ETag: `"character-availability-${modelType}-${branch}-${rulesVersion}-${fetchedAt}"`,
          },
        },
      );
    }

    const { data, fetchedAt } = await getSpineModelIndex();
    const availableCharacterIds = Array.from(collectAvailableCharacterIds(extractSpineModelIds(data))).sort((a, b) => a - b);

    return jsonResponse(
      {
        modelType,
        availableCharacterIds,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          ETag: `"character-availability-${modelType}-${rulesVersion}-${fetchedAt}"`,
        },
      },
    );
  } catch {
    return jsonResponse({ error: "Failed to fetch character availability" }, { status: 500 });
  }
});
