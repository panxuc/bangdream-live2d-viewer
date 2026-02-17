import { Asset2JsonConverter } from "./asset-converter";
import { getLive2DFileUrl } from "./remote";

const MTN_PARAM_IMPORT_LINE = /^\s*PARAM_IMPORT=.*(?:\r?\n)?/gim;

export async function createLive2DAssetResponse({ model, path = [], isModified = false }) {
  const filePath = Array.isArray(path) ? path.join("/") : "";
  const currentPath = model.replace("_rip", "");
  const fullUrl = getLive2DFileUrl({ isModified, model, filePath });

  const response = await fetch(fullUrl);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: { error: `Failed to fetch data: ${response.status} ${response.statusText}` },
    };
  }

  if (filePath === "buildData.asset") {
    const data = await response.json();
    const processedData = Asset2JsonConverter.processFile(data, currentPath);

    return {
      ok: true,
      isJson: true,
      body: processedData,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
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
