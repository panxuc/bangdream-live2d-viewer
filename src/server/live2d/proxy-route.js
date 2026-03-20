import { getLive2DFileUrl } from "./remote";
import { getLive2DModelDescriptor } from "./model-descriptor-cache";

const MTN_PARAM_IMPORT_LINE = /^\s*PARAM_IMPORT=.*(?:\r?\n)?/gim;

export async function createLive2DAssetResponse({ model, path = [], isModified = false }) {
  const filePath = Array.isArray(path) ? path.join("/") : "";
  if (filePath === "buildData.asset") {
    const descriptorRecord = await getLive2DModelDescriptor({ model, isModified });

    return {
      ok: true,
      isJson: true,
      body: descriptorRecord.processedBuildData,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    };
  }

  const fullUrl = getLive2DFileUrl({ isModified, model, filePath });
  const response = await fetch(fullUrl);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: { error: `Failed to fetch data: ${response.status} ${response.statusText}` },
    };
  }

  const contentType = response.headers.get("content-type");
  let buffer = await response.arrayBuffer();

  if (filePath.toLowerCase().endsWith(".mtn")) {
    const sourceText = new TextDecoder().decode(buffer);
    const sanitizedText = sourceText.replace(MTN_PARAM_IMPORT_LINE, "");
    buffer = new TextEncoder().encode(sanitizedText).buffer;
  }

  return {
    ok: true,
    isJson: false,
    body: buffer,
    headers: {
      "content-type": contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  };
}
