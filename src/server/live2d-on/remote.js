import { onCharacterById } from "@/src/server/catalog/on-characters";

export const LIVE2D_ON_ROOT_KEY = "live2d-bdon";
export const LIVE2D_ON_INFO_KEY = `${LIVE2D_ON_ROOT_KEY}/_info.json`;

export const joinR2KeyParts = (...parts) =>
  parts
    .filter((part) => part !== null && part !== undefined && part !== "")
    .map((part) => String(part).replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");

export const normalizeRelativePath = (path = "") => {
  const stack = [];

  String(path)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .forEach((segment) => {
      if (!segment || segment === ".") return;
      if (segment === "..") {
        if (stack.length > 0) {
          stack.pop();
        }
        return;
      }
      stack.push(segment);
    });

  return stack.join("/");
};

export const getDirName = (path = "") => {
  const normalizedPath = normalizeRelativePath(path);
  const index = normalizedPath.lastIndexOf("/");
  return index >= 0 ? normalizedPath.slice(0, index) : "";
};

export const getBaseName = (path = "") => normalizeRelativePath(path).split("/").pop() || "";

export const decodeOnLive2DModelId = (modelId) => {
  const decoded = normalizeRelativePath(modelId);

  if (!decoded) {
    throw Object.assign(new Error("Invalid ON model id"), { status: 400 });
  }

  return decoded;
};

export const encodeOnLive2DModelId = (modelDirectory) => normalizeRelativePath(modelDirectory);

export const getOnLive2DModelName = (modelDirectory) => getBaseName(modelDirectory);

export const getOnLive2DModelJsonRelativePath = (modelDirectory) => {
  const normalizedDirectory = normalizeRelativePath(modelDirectory);
  const modelName = getOnLive2DModelName(normalizedDirectory);
  return joinR2KeyParts(normalizedDirectory, "model", `${modelName}.model3.json`);
};

export const getOnLive2DModelJsonKey = (modelId) =>
  joinR2KeyParts(LIVE2D_ON_ROOT_KEY, getOnLive2DModelJsonRelativePath(decodeOnLive2DModelId(modelId)));

export const getOnLive2DAssetKey = ({ modelId, filePath = "" }) => {
  const modelDirectory = decodeOnLive2DModelId(modelId);
  const normalizedFilePath = normalizeRelativePath(filePath);
  const directoryPrefix = `${modelDirectory}/`;
  const filePathWithinDirectory = normalizedFilePath.startsWith(directoryPrefix)
    ? normalizedFilePath.slice(directoryPrefix.length)
    : normalizedFilePath;
  const assetRelativePath = normalizeRelativePath(joinR2KeyParts(modelDirectory, filePathWithinDirectory));
  return joinR2KeyParts(LIVE2D_ON_ROOT_KEY, assetRelativePath);
};

export const isOnModelForCharacter = (modelDirectory, characterId) => {
  const character = onCharacterById.get(characterId);
  if (!character) return false;

  const firstSegment = normalizeRelativePath(modelDirectory).split("/")[0] || "";
  return (character.pathPrefixes || []).includes(firstSegment);
};

export const toOnLive2DModelEntry = (modelDirectory) => {
  const normalizedDirectory = normalizeRelativePath(modelDirectory);

  return {
    id: encodeOnLive2DModelId(normalizedDirectory),
    label: normalizedDirectory,
    modelDirectory: normalizedDirectory,
  };
};
