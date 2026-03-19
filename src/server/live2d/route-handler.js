import { jsonResponse } from "../http.js";
import { createLive2DAssetResponse } from "./proxy-route.js";

export async function handleLive2DAssetRequest({ model, path = [], isModified = false }) {
  if (!model) {
    return jsonResponse({ error: "Model parameter is required" }, { status: 400 });
  }

  try {
    const result = await createLive2DAssetResponse({ model, path, isModified });

    if (!result.ok) {
      return jsonResponse(result.body, { status: result.status });
    }

    if (result.isJson) {
      return jsonResponse(result.body, { headers: result.headers });
    }

    return new Response(result.body, { headers: result.headers });
  } catch (error) {
    return jsonResponse({ error: `Failed to fetch data: ${error.message}` }, { status: 500 });
  }
}
