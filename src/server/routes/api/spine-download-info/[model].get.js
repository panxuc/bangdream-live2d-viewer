import { defineHandler } from "nitro/h3";
import { getSpineDownloadPackage } from "../../../spine/download-package.js";
import { jsonResponse } from "../../../http.js";

export default defineHandler(async (event) => {
  const model = event.context.params?.model;

  if (!model) {
    return jsonResponse({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const downloadPackage = await getSpineDownloadPackage({ model });
    return jsonResponse({
      fileName: downloadPackage.fileName,
      sizeBytes: downloadPackage.sizeBytes,
    });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Failed to fetch Spine download info" },
      { status: error.status || 500 },
    );
  }
});
