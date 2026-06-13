import { getCloudflareContext } from "@opennextjs/cloudflare";

const R2_BINDING_NAME = "BANGDREAM_R2";
const DEFAULT_CONTENT_TYPE = "application/octet-stream";

const normalizeR2Key = (key) => String(key || "").replace(/^\/+/, "");

function getBangDreamR2Bucket() {
  try {
    return getCloudflareContext().env?.[R2_BINDING_NAME] || null;
  } catch {
    return null;
  }
}

function createR2Response(object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  if (!headers.has("content-type")) {
    headers.set("content-type", DEFAULT_CONTENT_TYPE);
  }

  return new Response(object.body, {
    headers,
  });
}

export async function fetchBangDreamR2Object(key) {
  const bucket = getBangDreamR2Bucket();

  if (!bucket) {
    return new Response("Cloudflare R2 binding BANGDREAM_R2 is unavailable.", {
      status: 503,
      statusText: "Service Unavailable",
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  const r2Key = normalizeR2Key(key);
  const object = await bucket.get(r2Key);
  if (!object) {
    return new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return createR2Response(object);
}

export async function readBangDreamR2ArrayBuffer(key) {
  const response = await fetchBangDreamR2Object(key);
  if (!response.ok) {
    throw Object.assign(new Error(`Failed to read R2 object ${key}: ${response.status} ${response.statusText}`), {
      status: response.status,
    });
  }

  return response.arrayBuffer();
}

export async function readBangDreamR2Json(key) {
  const response = await fetchBangDreamR2Object(key);
  if (!response.ok) {
    throw Object.assign(new Error(`Failed to read R2 object ${key}: ${response.status} ${response.statusText}`), {
      status: response.status,
    });
  }

  return response.json();
}

export async function readBangDreamR2Text(key) {
  const response = await fetchBangDreamR2Object(key);
  if (!response.ok) {
    throw Object.assign(new Error(`Failed to read R2 object ${key}: ${response.status} ${response.statusText}`), {
      status: response.status,
    });
  }

  return response.text();
}
