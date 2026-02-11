export function getLive2DBranch(isModified) {
  return isModified ? "live2d-modified" : "live2d";
}

export function getLive2DBaseUrl({ isModified, model }) {
  return `https://bangdreamr2.haneoka.org/${getLive2DBranch(isModified)}/chara/${model}_rip/`;
}

export function getLive2DFileUrl({ isModified, model, filePath = "" }) {
  return `${getLive2DBaseUrl({ isModified, model })}${filePath}`;
}
