import { defineHandler } from "nitro/h3";
import { getSpineDownloadPackage, getSpineDownloadResponseHeaders } from "../../../spine/download-package.js";
import { jsonResponse } from "../../../http.js";

export default defineHandler(async (event) => {
  const model = event.context.params?.model;

  if (!model) {
    return jsonResponse({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const downloadPackage = await getSpineDownloadPackage({ model });
    return new Response(downloadPackage.zipBuffer, {
      headers: getSpineDownloadResponseHeaders(downloadPackage),
    });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Failed to process Spine download" },
      { status: error.status || 500 },
    );
  }
});
