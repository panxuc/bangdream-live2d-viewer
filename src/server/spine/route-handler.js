import { jsonResponse } from "../http.js";
import { getSpineModelDescriptor } from "./model-descriptor-cache.js";

export async function handleSpineAssetRequest({ model, path = [] }) {
  const requestedPath = Array.isArray(path) ? decodeURIComponent(path.join("/")) : "";
  if (!model) {
    return jsonResponse({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const descriptorRecord = await getSpineModelDescriptor(model);

    if (!requestedPath || requestedPath === "buildData.asset") {
      return jsonResponse(descriptorRecord.descriptor, {
        headers: descriptorRecord.headers.json,
      });
    }

    if (requestedPath === descriptorRecord.atlasFileName) {
      return new Response(descriptorRecord.atlasText, {
        headers: descriptorRecord.headers.text,
      });
    }

    const remoteUrl =
      (requestedPath === descriptorRecord.skeletonFileName ? descriptorRecord.skeletonRemoteUrl : null) ||
      descriptorRecord.pageUrlMap[requestedPath];

    if (!remoteUrl) {
      return jsonResponse({ error: "Requested Spine asset was not found" }, { status: 404 });
    }

    const response = await fetch(remoteUrl);
    if (!response.ok) {
      return jsonResponse({ error: `Failed to fetch asset: ${response.status}` }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || descriptorRecord.headers.binary["content-type"];
    const body = await response.arrayBuffer();
    return new Response(body, {
      headers: {
        ...descriptorRecord.headers.binary,
        "content-type": contentType,
      },
    });
  } catch (error) {
    return jsonResponse({ error: `Failed to fetch Spine data: ${error.message}` }, { status: 500 });
  }
}
