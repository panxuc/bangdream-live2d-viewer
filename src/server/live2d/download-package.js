import JSZip from "jszip";
import { EXTERNAL_URLS, ZIP_METADATA, getLive2DBranch } from "@/src/config/urls";
import { getLive2DBaseUrl } from "./remote";

const FIXED_DATE = new Date(0);
const CACHE_TTL_MS = 2 * 60 * 1000;
const DATA_FOLDER = "data";
const TEXTURES_FOLDER = `${DATA_FOLDER}/textures`;
const MOTIONS_FOLDER = `${DATA_FOLDER}/motions`;
const EXPRESSIONS_FOLDER = `${DATA_FOLDER}/expressions`;
const packageCache = new Map();

const createHttpError = (status, message) => Object.assign(new Error(message), { status });
const getCacheKey = ({ model, isModified }) => `${model}:${isModified ? "1" : "0"}`;

const stripBytesExtension = (fileName = "") => fileName.replace(/\.bytes$/i, "");
const toArchiveFileName = (fileName = "", fallbackFileName = "") =>
  stripBytesExtension(String(fileName || fallbackFileName).replace(/\\/g, "/").replace(/^\/+/, ""));

const normalizeTextureFileName = (fileName = "") => {
  if (fileName.endsWith(".bytes")) {
    return fileName.replace(/\.bytes$/i, ".png");
  }
  return fileName.includes(".") ? fileName : `${fileName}.png`;
};

const toMotionFileName = (fileName = "") => stripBytesExtension(fileName);
const toModelFileName = (fileName = "") => stripBytesExtension(fileName);
const toRootAssetPath = (asset, fallbackFileName) => `${DATA_FOLDER}/${toArchiveFileName(asset?.fileName, fallbackFileName)}`;

const getBundlePath = (bundleName = "") => {
  if (!bundleName) return "";
  if (bundleName.startsWith("live2d/")) return bundleName.slice("live2d/".length);
  return bundleName;
};

const toAssetUrl = ({ bundleName, fileName }, type, { model, isModified }) => {
  const branch = getLive2DBranch(isModified);
  const bundlePath = getBundlePath(bundleName);
  const normalizedFileName =
    type === "texture"
      ? normalizeTextureFileName(fileName)
      : type === "motion"
        ? toMotionFileName(fileName)
        : type === "model" || type === "physics"
          ? toModelFileName(fileName)
          : fileName;

  if (!bundlePath) {
    return new URL(normalizedFileName, getLive2DBaseUrl({ isModified, model })).href;
  }

  const resolvedBundlePath = bundlePath.endsWith("_rip") ? bundlePath : `${bundlePath}_rip`;
  return `${EXTERNAL_URLS.bangdreamR2Origin}/${branch}/${resolvedBundlePath}/${normalizedFileName}`;
};

const fetchBinary = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw createHttpError(response.status, `Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
};

const addDirectoryEntry = (zip, path) => {
  const normalizedPath = path.endsWith("/") ? path : `${path}/`;
  zip.file(normalizedPath, null, { dir: true, date: FIXED_DATE });
};

const toModelJson = (baseData) => ({
  model: toRootAssetPath(baseData.model, "model.moc"),
  physics: toRootAssetPath(baseData.physics, "physics.json"),
  textures: (baseData.textures || []).map((texture) => `${TEXTURES_FOLDER}/${toArchiveFileName(texture.fileName)}`),
  motions: (baseData.motions || []).reduce((accumulator, motion) => {
    const archiveFileName = toArchiveFileName(motion.fileName);
    const motionName = archiveFileName.split("/").pop()?.replace(/\.mtn$/i, "") || "motion";
    accumulator[motionName] = [{ file: `${MOTIONS_FOLDER}/${archiveFileName}` }];
    return accumulator;
  }, {}),
  expressions: (baseData.expressions || []).map((expression) => ({
    name: String(expression.fileName || "").replace(/\.exp\.json$/i, ""),
    file: `${EXPRESSIONS_FOLDER}/${toArchiveFileName(expression.fileName)}`,
  })),
});

const addOptionalAsset = async (zipFolder, path, assetUrl) => {
  try {
    const buffer = await fetchBinary(assetUrl);
    zipFolder.file(path, buffer, { date: FIXED_DATE });
  } catch (error) {
    console.error(`Failed to add ${path} from ${assetUrl}`, error);
  }
};

const buildDownloadPackage = async ({ model, isModified }) => {
  const baseUrl = getLive2DBaseUrl({ isModified, model });
  const response = await fetch(`${baseUrl}buildData.asset`);

  if (!response.ok) {
    throw createHttpError(response.status, `Failed to fetch data: ${response.status} ${response.statusText}`);
  }

  const buildData = await response.json();
  const baseData = buildData?.Base;
  if (!baseData) {
    throw createHttpError(500, "buildData.asset is missing Base");
  }

  const zip = new JSZip();
  const modelFolder = zip.folder(model);
  if (!modelFolder) {
    throw createHttpError(500, "Failed to initialize ZIP structure");
  }

  addDirectoryEntry(zip, model);
  addDirectoryEntry(zip, `${model}/${DATA_FOLDER}`);
  addDirectoryEntry(zip, `${model}/${TEXTURES_FOLDER}`);
  addDirectoryEntry(zip, `${model}/${MOTIONS_FOLDER}`);
  addDirectoryEntry(zip, `${model}/${EXPRESSIONS_FOLDER}`);

  const downloadTasks = [];
  const modelFilePath = toRootAssetPath(baseData.model, "model.moc");
  const physicsFilePath = toRootAssetPath(baseData.physics, "physics.json");

  if (baseData.model) {
    downloadTasks.push(
      addOptionalAsset(
        modelFolder,
        modelFilePath,
        toAssetUrl(baseData.model, "model", { model, isModified }),
      ),
    );
  }

  if (baseData.physics) {
    downloadTasks.push(
      addOptionalAsset(
        modelFolder,
        physicsFilePath,
        toAssetUrl(baseData.physics, "physics", { model, isModified }),
      ),
    );
  }

  (baseData.textures || []).forEach((texture) => {
    const fileName = toArchiveFileName(texture.fileName);
    downloadTasks.push(
      addOptionalAsset(
        modelFolder,
        `${TEXTURES_FOLDER}/${fileName}`,
        toAssetUrl(texture, "texture", { model, isModified }),
      ),
    );
  });

  (baseData.motions || []).forEach((motion) => {
    const fileName = toArchiveFileName(motion.fileName);
    downloadTasks.push(
      addOptionalAsset(
        modelFolder,
        `${MOTIONS_FOLDER}/${fileName}`,
        toAssetUrl(motion, "motion", { model, isModified }),
      ),
    );
  });

  (baseData.expressions || []).forEach((expression) => {
    downloadTasks.push(
      addOptionalAsset(
        modelFolder,
        `${EXPRESSIONS_FOLDER}/${toArchiveFileName(expression.fileName)}`,
        toAssetUrl(expression, "expression", { model, isModified }),
      ),
    );
  });

  await Promise.all(downloadTasks);

  modelFolder.file("model.json", JSON.stringify(toModelJson(baseData), null, 2), {
    date: FIXED_DATE,
  });

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
    mimeType: "application/zip",
    comment: ZIP_METADATA.comment,
    date: FIXED_DATE,
  });

  return {
    fileName: `${model}.zip`,
    zipBuffer,
    sizeBytes: zipBuffer.byteLength,
  };
};

export async function getDownloadPackage(options) {
  const key = getCacheKey(options);
  const now = Date.now();
  const cached = packageCache.get(key);

  if (cached?.value && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = buildDownloadPackage(options)
    .then((value) => {
      packageCache.set(key, {
        value,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      return value;
    })
    .catch((error) => {
      packageCache.delete(key);
      throw error;
    });

  packageCache.set(key, { promise });
  return promise;
}

export function getDownloadResponseHeaders(downloadPackage) {
  return {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${downloadPackage.fileName}"`,
    "Content-Length": String(downloadPackage.sizeBytes),
  };
}
