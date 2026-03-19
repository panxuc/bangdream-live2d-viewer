import { defineHandler } from "nitro/h3";
import { handleLive2DAssetRequest } from "../../../../live2d/route-handler.js";
import { getPathSegments } from "../../../../nitro-api.js";

export default defineHandler((event) => {
  const model = event.context.params?.model;
  const path = getPathSegments(event);

  return handleLive2DAssetRequest({ model, path, isModified: true });
});
