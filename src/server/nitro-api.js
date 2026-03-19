export function getRequestUrl(event) {
  return new URL(event.req.url, "http://nitro.local");
}

export function getPathSegments(event) {
  const rawPath = event.context.params?.path;

  if (!rawPath) {
    return [];
  }

  const pathValue = Array.isArray(rawPath) ? rawPath.join("/") : String(rawPath);

  return pathValue
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
}
