import JSZip from "jszip";
import { ZIP_METADATA } from "@/src/config/urls";
import { getSpineModelDescriptor } from "./model-descriptor-cache";
import { readBangDreamR2ArrayBuffer } from "@/src/server/r2/bangdream-r2";

const FIXED_DATE = new Date(0);
const CACHE_TTL_MS = 10 * 60 * 1000;
const packageCache = new Map();

const createHttpError = (status, message) => Object.assign(new Error(message), { status });
const getCacheKey = ({ model }) => model;

const splitFileName = (fileName = "") => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return {
      baseName: fileName,
      extension: "",
    };
  }

  return {
    baseName: fileName.slice(0, dotIndex),
    extension: fileName.slice(dotIndex),
  };
};

const rewriteAtlasPageNames = (atlasText, renameMap) => {
  const lines = String(atlasText || "").split(/\r\n|\r|\n/);
  let expectingPageName = true;

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        expectingPageName = true;
        return line;
      }

      if (expectingPageName) {
        expectingPageName = false;
        return renameMap.get(trimmed) || line;
      }

      return line;
    })
    .join("\n");
};

const fetchBinary = async (key) => {
  try {
    return await readBangDreamR2ArrayBuffer(key);
  } catch (error) {
    throw createHttpError(error.status || 500, error.message);
  }
};

const buildSpineDownloadPackage = async ({ model }) => {
  const descriptorRecord = await getSpineModelDescriptor(model);
  const zip = new JSZip();
  const modelFolder = zip.folder(model);
  if (!modelFolder) {
    throw createHttpError(500, "Failed to initialize ZIP structure");
  }

  const pageEntries = Object.entries(descriptorRecord.pageKeyMap || {});
  const pageRenameMap = new Map();

  pageEntries.forEach(([pageName], index) => {
    const { extension } = splitFileName(pageName);
    const renamedPage = index === 0 ? `${model}${extension || ".png"}` : `${model}_${index + 1}${extension || ".png"}`;
    pageRenameMap.set(pageName, renamedPage);
  });

  const atlasFileName = `${model}.atlas`;
  const skeletonExtension = splitFileName(descriptorRecord.skeletonFileName).extension || ".skel";
  const skeletonFileName = `${model}${skeletonExtension}`;

  const downloadTasks = [
    fetchBinary(descriptorRecord.skeletonKey).then((buffer) => {
      modelFolder.file(skeletonFileName, buffer, { date: FIXED_DATE });
    }),
  ];

  pageEntries.forEach(([pageName, pageKey]) => {
    const renamedPage = pageRenameMap.get(pageName) || pageName;
    downloadTasks.push(
      fetchBinary(pageKey).then((buffer) => {
        modelFolder.file(renamedPage, buffer, { date: FIXED_DATE });
      }),
    );
  });

  await Promise.all(downloadTasks);

  modelFolder.file(atlasFileName, rewriteAtlasPageNames(descriptorRecord.atlasText, pageRenameMap), {
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

export async function getSpineDownloadPackage(options) {
  const key = getCacheKey(options);
  const now = Date.now();
  const cached = packageCache.get(key);

  if (cached?.value && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached?.promise) {
    return cached.promise;
  }

  const promise = buildSpineDownloadPackage(options)
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

export function getSpineDownloadResponseHeaders(downloadPackage) {
  return {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${downloadPackage.fileName}"`,
    "Content-Length": String(downloadPackage.sizeBytes),
  };
}
