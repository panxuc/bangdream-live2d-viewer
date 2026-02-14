import { getLive2DBaseUrl, getLive2DBranch } from "@/src/config/urls";

export function getLive2DFileUrl({ isModified, model, filePath = "" }) {
  return `${getLive2DBaseUrl({ isModified, model })}${filePath}`;
}

export { getLive2DBaseUrl, getLive2DBranch };
