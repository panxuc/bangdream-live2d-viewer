import { getLive2DBranch } from "@/src/config/urls";

const joinR2KeyParts = (...parts) =>
  parts
    .filter(Boolean)
    .map((part) => String(part).replace(/^\/+|\/+$/g, ""))
    .join("/");

export function getLive2DBaseKey({ isModified, model }) {
  return joinR2KeyParts(getLive2DBranch(isModified, model), "chara", `${model}_rip`);
}

export function getLive2DFileKey({ isModified, model, filePath = "" }) {
  return joinR2KeyParts(getLive2DBaseKey({ isModified, model }), filePath);
}

export function getLive2DModelIndexKey(isModified) {
  return joinR2KeyParts(getLive2DBranch(isModified), "_info.json");
}

export { getLive2DBranch };
