import { readBangDreamR2Json } from "@/src/server/r2/bangdream-r2";
import { toLive2DExpressionAssetPath } from "@/src/lib/live2dExpressionAsset";
import {
  decodeOnLive2DModelId,
  getBaseName,
  getDirName,
  getOnLive2DModelJsonKey,
  getOnLive2DModelJsonRelativePath,
  joinR2KeyParts,
  normalizeRelativePath,
} from "./remote";

const CACHE_DURATION = 60 * 1000;
const descriptorCache = new Map();

const getCacheKey = (modelId) => String(modelId || "");

const resolveFromModelJsonDirectory = (modelJsonRelativePath, filePath) => {
  if (typeof filePath !== "string" || !filePath) {
    return filePath;
  }

  if (/^(https?:|data:|blob:|\/)/i.test(filePath)) {
    return filePath;
  }

  return normalizeRelativePath(joinR2KeyParts(getDirName(modelJsonRelativePath), filePath));
};

const getModelJsonPathWithinModelDirectory = (modelDirectory, modelJsonRelativePath) => {
  const normalizedDirectory = normalizeRelativePath(modelDirectory);
  const normalizedModelJsonPath = normalizeRelativePath(modelJsonRelativePath);
  const directoryPrefix = `${normalizedDirectory}/`;

  return normalizedModelJsonPath.startsWith(directoryPrefix)
    ? normalizedModelJsonPath.slice(directoryPrefix.length)
    : normalizedModelJsonPath;
};

const toMotionGroupName = (motionFilePath = "") =>
  getBaseName(motionFilePath)
    .replace(/\.motion3\.json$/i, "")
    .replace(/\.json$/i, "");

const rewriteMotionGroups = (motions, modelJsonRelativePath) => {
  if (!motions || typeof motions !== "object") {
    return motions;
  }

  const groups = {};

  Object.values(motions).forEach((motionList) => {
    if (!Array.isArray(motionList)) return;

    motionList.forEach((motion) => {
      if (!motion || typeof motion !== "object") return;
      const rewrittenMotion = { ...motion };
      if (typeof rewrittenMotion.File === "string") {
        rewrittenMotion.File = resolveFromModelJsonDirectory(modelJsonRelativePath, rewrittenMotion.File);
      }
      if (typeof rewrittenMotion.file === "string") {
        rewrittenMotion.file = resolveFromModelJsonDirectory(modelJsonRelativePath, rewrittenMotion.file);
      }
      if (typeof rewrittenMotion.Sound === "string") {
        rewrittenMotion.Sound = resolveFromModelJsonDirectory(modelJsonRelativePath, rewrittenMotion.Sound);
      }
      if (typeof rewrittenMotion.sound === "string") {
        rewrittenMotion.sound = resolveFromModelJsonDirectory(modelJsonRelativePath, rewrittenMotion.sound);
      }

      const groupName = toMotionGroupName(rewrittenMotion.File || rewrittenMotion.file || "");
      if (!groupName) return;
      groups[groupName] = [rewrittenMotion];
    });
  });

  return groups;
};

const rewriteExpressions = (expressions, modelJsonRelativePath) => {
  if (!Array.isArray(expressions)) {
    return expressions;
  }

  return expressions.map((expression) => {
    if (!expression || typeof expression !== "object") return expression;
    const rewrittenExpression = { ...expression };
    if (typeof rewrittenExpression.File === "string") {
      rewrittenExpression.File = toLive2DExpressionAssetPath(
        resolveFromModelJsonDirectory(modelJsonRelativePath, rewrittenExpression.File),
      );
    }
    if (typeof rewrittenExpression.file === "string") {
      rewrittenExpression.file = toLive2DExpressionAssetPath(
        resolveFromModelJsonDirectory(modelJsonRelativePath, rewrittenExpression.file),
      );
    }
    return rewrittenExpression;
  });
};

const normalizeOnLive2DModelJson = (rawData, modelDirectory, modelJsonRelativePath) => {
  const data = JSON.parse(JSON.stringify(rawData || {}));
  const references = data.FileReferences;
  const modelJsonPathWithinDirectory = getModelJsonPathWithinModelDirectory(modelDirectory, modelJsonRelativePath);

  if (!references || typeof references !== "object") {
    return data;
  }

  ["Moc", "Physics", "Pose", "DisplayInfo", "UserData"].forEach((key) => {
    if (typeof references[key] === "string") {
      references[key] = resolveFromModelJsonDirectory(modelJsonPathWithinDirectory, references[key]);
    }
  });

  if (Array.isArray(references.Textures)) {
    references.Textures = references.Textures.map((texture) =>
      resolveFromModelJsonDirectory(modelJsonPathWithinDirectory, texture),
    );
  }

  references.Expressions = rewriteExpressions(references.Expressions, modelJsonPathWithinDirectory);
  references.Motions = rewriteMotionGroups(references.Motions, modelJsonPathWithinDirectory);

  return data;
};

export async function getOnLive2DModelDescriptor(modelId) {
  const cacheKey = getCacheKey(modelId);
  const now = Date.now();
  const cached = descriptorCache.get(cacheKey);
  if (cached && now - cached.fetchedAt <= CACHE_DURATION) {
    return cached;
  }

  const modelDirectory = decodeOnLive2DModelId(modelId);
  const modelJsonRelativePath = getOnLive2DModelJsonRelativePath(modelDirectory);
  const modelJsonKey = getOnLive2DModelJsonKey(modelId);
  const rawBuildData = await readBangDreamR2Json(modelJsonKey);
  const processedBuildData = normalizeOnLive2DModelJson(rawBuildData, modelDirectory, modelJsonRelativePath);

  const nextCache = {
    modelId,
    modelDirectory,
    modelJsonRelativePath,
    modelJsonKey,
    rawBuildData,
    processedBuildData,
    fetchedAt: now,
  };

  descriptorCache.set(cacheKey, nextCache);
  return nextCache;
}
