import { defineHandler } from "nitro/h3";
import { getDownloadPackage, getDownloadResponseHeaders } from "../../../live2d/download-package.js";
import { jsonResponse } from "../../../http.js";
import { getRequestUrl } from "../../../nitro-api.js";

export default defineHandler(async (event) => {
  const model = event.context.params?.model;
  const searchParams = getRequestUrl(event).searchParams;
  const isModified = searchParams.get("isModified") === "true";

  if (!model) {
    return jsonResponse({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const downloadPackage = await getDownloadPackage({ model, isModified });
    return new Response(downloadPackage.zipBuffer, {
      headers: getDownloadResponseHeaders(downloadPackage),
    });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Failed to process data" },
      { status: error.status || 500 },
    );
  }
});
