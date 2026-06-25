import { fetchBangDreamR2Object } from "@/src/server/r2/bangdream-r2";
import { getOnLive2DModelDescriptor } from "./model-descriptor-cache";
import { getOnLive2DAssetKey } from "./remote";

const MTN_PARAM_IMPORT_LINE = /^\s*PARAM_IMPORT=.*(?:\r?\n)?/gim;

export async function createOnLive2DAssetResponse({ model, path = [] }) {
  const filePath = Array.isArray(path) ? path.join("/") : "";
  if (filePath === "buildData.asset") {
    const descriptorRecord = await getOnLive2DModelDescriptor(model);

    return {
      ok: true,
      isJson: true,
      body: descriptorRecord.processedBuildData,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    };
  }

  const objectKey = getOnLive2DAssetKey({ modelId: model, filePath });
  const response = await fetchBangDreamR2Object(objectKey);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: { error: `Failed to fetch ON data: ${response.status} ${response.statusText}` },
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
