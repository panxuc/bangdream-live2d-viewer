import { defineHandler } from "nitro/h3";
import { getPathSegments } from "../../../../nitro-api.js";
import { handleSpineAssetRequest } from "../../../../spine/route-handler.js";

export default defineHandler((event) => {
  const model = event.context.params?.model;
  const path = getPathSegments(event);

  return handleSpineAssetRequest({ model, path });
});
