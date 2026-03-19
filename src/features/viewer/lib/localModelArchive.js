import JSZip from "jszip";
import { EXTERNAL_URLS, PUBLIC_ASSET_PATHS } from "../../../config/urls.js";
import { MODEL_TYPES } from "./modelState.js";
import { collectSpineCandidateEntries, findSpineAtlasEntry, isSpineBinaryPath } from "./spineArchiveUtils.js";
import { loadPublicScript } from "../../../lib/loadPublicScript.js";

const LIVE2D_MODEL_FILE_PATTERNS = ["model.json", "builddata.asset", ".model3.json"];
const FILE_PATH_KEYS = ["model", "physics", "pose", "userData", "sound", "file"];
const EXCLUDED_LOCAL_MODEL_SUFFIXES = ["exp.json", "physics.json", "transitiondata.asset"];
const LIBARCHIVE_FILE_TYPES = {
  32768: "File",
};

const isObject = (value) => value !== null && typeof value === "object";
const toLowerPath = (path) => path.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
const isExternalUrl = (value) => /^(https?:|blob:|data:|\/)/i.test(value);
const getBaseName = (path) => path.replace(/\\/g, "/").split("/").pop() || path;
const getDirName = (path) => {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
};

const joinAndNormalizePath = (baseDir, targetPath) => {
  const raw = targetPath.replace(/\\/g, "/");
  const stack = baseDir ? baseDir.split("/").filter(Boolean) : [];
  raw.split("/").forEach((segment) => {
    if (!segment || segment === ".") return;
    if (segment === "..") {
      if (stack.length > 0) stack.pop();
      return;
    }
    stack.push(segment);
  });
  return stack.join("/");
};

const getMimeType = (path) => {
  const extension = (path.split(".").pop() || "").toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  if (extension === "mp3") return "audio/mpeg";
  if (extension === "wav") return "audio/wav";
  if (extension === "ogg") return "audio/ogg";
  if (extension === "moc" || extension === "moc3") return "application/octet-stream";
  if (extension === "json" || extension === "asset") return "application/json";
  return "application/octet-stream";
};

const uint8ArrayToBase64 = (bytes) => {
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const toDataUrl = (bytes, mimeType) => `data:${mimeType};base64,${uint8ArrayToBase64(bytes)}`;

const decodeZipFileName = (bytes) => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    try {
      return new TextDecoder("gbk").decode(bytes);
    } catch {
      return new TextDecoder().decode(bytes);
    }
  }
};

const resolveArchiveEntryKeys = (archive, path) =>
  archive.pathToEntryKeys.get(toLowerPath(path.replace(/\\/g, "/").replace(/^\/+/, ""))) || [];

const loadArchiveFileContent = (archive, path, preferredEntryKey = null) => {
  if (preferredEntryKey && archive.filesMap.has(preferredEntryKey)) {
    return archive.filesMap.get(preferredEntryKey) || null;
  }

  const resolvedEntryKeys = resolveArchiveEntryKeys(archive, path);
  if (resolvedEntryKeys.length === 0) return null;
  return archive.filesMap.get(resolvedEntryKeys[0]) || null;
};

const parseJsonBytes = (bytes) => {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

const parseSpineAtlasPageNames = (atlasText) => {
  const lines = atlasText.split(/\r\n|\r|\n/);
  const pageNames = [];
  let expectingPageName = true;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      expectingPageName = true;
      return;
    }

    if (expectingPageName) {
      pageNames.push(line);
      expectingPageName = false;
    }
  });

  return pageNames;
};

const collectLive2DCandidates = (entries) => {
  const candidates = entries
    .filter((entry) => {
      const lower = entry.path.toLowerCase();
      const isModelLike = lower.endsWith(".json") || lower.endsWith(".asset");
      const isExcluded = EXCLUDED_LOCAL_MODEL_SUFFIXES.some((suffix) => lower.endsWith(suffix));
      return isModelLike && !isExcluded;
    })
    .sort((a, b) => {
      const aName = a.path.toLowerCase();
      const bName = b.path.toLowerCase();
      const aPriority = LIVE2D_MODEL_FILE_PATTERNS.findIndex((pattern) => aName.endsWith(pattern));
      const bPriority = LIVE2D_MODEL_FILE_PATTERNS.findIndex((pattern) => bName.endsWith(pattern));
      const normA = aPriority === -1 ? LIVE2D_MODEL_FILE_PATTERNS.length : aPriority;
      const normB = bPriority === -1 ? LIVE2D_MODEL_FILE_PATTERNS.length : bPriority;
      if (normA !== normB) return normA - normB;
      return a.path.localeCompare(b.path);
    });

  const totalByPath = new Map();
  candidates.forEach((entry) => {
    totalByPath.set(entry.path, (totalByPath.get(entry.path) || 0) + 1);
  });

  const seenByPath = new Map();
  return candidates.map((entry, index) => {
    const seen = (seenByPath.get(entry.path) || 0) + 1;
    seenByPath.set(entry.path, seen);
    const total = totalByPath.get(entry.path) || 1;
    const suffix = total > 1 ? ` [${seen}/${total}]` : "";
    return {
      id: `candidate-${index}`,
      path: entry.path,
      entryKey: entry.key,
      label: `${entry.path}${suffix}`,
    };
  });
};

const collectSpineCandidates = (archive) => {
  const candidates = collectSpineCandidateEntries({
    entries: archive.entries,
    loadFileContent: (path, preferredEntryKey) => loadArchiveFileContent(archive, path, preferredEntryKey),
    parseJsonBytes,
  });

  return candidates.map((item, index) => ({
    id: `candidate-${index}`,
    path: item.entry.path,
    entryKey: item.entry.key,
    label: `${item.entry.path} (${getBaseName(item.atlasEntry.path)})`,
    atlasPath: item.atlasEntry.path,
    skeletonJson: item.skeletonJson,
  }));
};

let libarchiveRuntimePromise = null;
let sevenZipRuntimePromise = null;

const createLibarchiveApi = (module) => {
  const cwrap = module.cwrap.bind(module);
  return {
    module,
    read_new_memory: cwrap("archive_read_new_memory", "number", ["number", "number", "string"]),
    read_next_entry: cwrap("archive_read_next_entry", "number", ["number"]),
    read_data: cwrap("archive_read_data", "number", ["number", "number", "number"]),
    read_data_skip: cwrap("archive_read_data_skip", "number", ["number"]),
    read_free: cwrap("archive_read_free", "number", ["number"]),
    entry_filetype: cwrap("archive_entry_filetype", "number", ["number"]),
    entry_pathname: cwrap("archive_entry_pathname_utf8", "string", ["number"]),
  };
};

const loadLibarchiveRuntime = async () => {
  if (libarchiveRuntimePromise) {
    return libarchiveRuntimePromise;
  }

  libarchiveRuntimePromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error("Archive parser is only available in browser");
    }

    await loadPublicScript(PUBLIC_ASSET_PATHS.libarchiveScript);
    if (typeof window.libarchive !== "function") {
      throw new Error("libarchive runtime failed to load");
    }

    const wasmModule = await window.libarchive({
      locateFile: (fileName) => (fileName.endsWith(".wasm") ? PUBLIC_ASSET_PATHS.libarchiveWasm : fileName),
    });

    return createLibarchiveApi(wasmModule);
  })();

  return libarchiveRuntimePromise;
};

const loadSevenZipRuntime = async () => {
  if (sevenZipRuntimePromise) {
    return sevenZipRuntimePromise;
  }

  sevenZipRuntimePromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error("7z parser is only available in browser");
    }

    await loadPublicScript(PUBLIC_ASSET_PATHS.sevenZipScript);
    const sevenZipFactory = window.SevenZip;
    if (typeof sevenZipFactory !== "function") {
      throw new Error("7z-wasm runtime failed to load");
    }

    const baseOptions = {
      noInitialRun: true,
      noExitRuntime: true,
      print: () => {},
      printErr: () => {},
    };

    try {
      return await sevenZipFactory({
        ...baseOptions,
        locateFile: (fileName) => (fileName.endsWith(".wasm") ? PUBLIC_ASSET_PATHS.sevenZipWasm : fileName),
      });
    } catch {
      return sevenZipFactory({
        ...baseOptions,
        locateFile: (fileName) => (fileName.endsWith(".wasm") ? EXTERNAL_URLS.sevenZipWasmCdn : fileName),
      });
    }
  })();

  return sevenZipRuntimePromise;
};

const removeFsTree = (fs, path) => {
  if (!fs.analyzePath(path).exists) return;
  const entries = fs.readdir(path).filter((name) => name !== "." && name !== "..");
  for (const entry of entries) {
    const child = `${path}/${entry}`;
    const stat = fs.stat(child);
    if (fs.isDir(stat.mode)) {
      removeFsTree(fs, child);
    } else {
      fs.unlink(child);
    }
  }
  fs.rmdir(path);
};

const collect7zExtractedFiles = (fs, rootDir) => {
  const output = [];
  const walk = (currentDir) => {
    const entries = fs.readdir(currentDir).filter((name) => name !== "." && name !== "..");
    for (const entry of entries) {
      const fullPath = `${currentDir}/${entry}`;
      const stat = fs.stat(fullPath);
      if (fs.isDir(stat.mode)) {
        walk(fullPath);
        continue;
      }

      const relativePath = fullPath.slice(rootDir.length + 1).replace(/\\/g, "/");
      const data = fs.readFile(fullPath, { encoding: "binary" });
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      output.push({ path: relativePath, bytes });
    }
  };
  walk(rootDir);
  return output;
};

const createArchivePayload = () => ({
  pathToEntryKeys: new Map(),
  filesMap: new Map(),
  entries: [],
});

const appendArchiveEntry = (payload, path, bytes, index) => {
  const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const lowerPath = toLowerPath(normalizedPath);
  const entryKey = `entry-${index}`;
  const keys = payload.pathToEntryKeys.get(lowerPath) || [];
  keys.push(entryKey);
  payload.pathToEntryKeys.set(lowerPath, keys);
  payload.filesMap.set(entryKey, bytes);
  payload.entries.push({
    key: entryKey,
    path: normalizedPath,
    lowerPath,
  });
};

const extract7zEntries = async (file) => {
  const sevenZip = await loadSevenZipRuntime();
  const fs = sevenZip.FS;
  const archiveBytes = new Uint8Array(await file.arrayBuffer());
  const sessionId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const workDir = `/tmp-${sessionId}`;
  const outDir = `${workDir}/out`;
  const archiveName = `${workDir}/archive.7z`;
  const payload = createArchivePayload();
  let index = 0;

  try {
    fs.mkdir(workDir);
    fs.mkdir(outDir);
    fs.writeFile(archiveName, archiveBytes);

    let exitCode = 0;
    try {
      const result = sevenZip.callMain(["x", archiveName, `-o${outDir}`, "-y", "-bd"]);
      if (typeof result === "number") exitCode = result;
    } catch (error) {
      const status = error?.status;
      if (typeof status === "number") {
        exitCode = status;
      } else {
        throw error;
      }
    }

    if (exitCode !== 0) {
      throw new Error(`7z extraction failed (exit code: ${exitCode})`);
    }

    const extractedFiles = collect7zExtractedFiles(fs, outDir);
    extractedFiles.forEach((entry) => {
      appendArchiveEntry(payload, entry.path, entry.bytes, index);
      index += 1;
    });
  } finally {
    try {
      removeFsTree(fs, workDir);
    } catch {
      // Best-effort cleanup.
    }
  }

  return {
    ...payload,
    filePaths: payload.entries.map((entry) => entry.path),
  };
};

export const extractArchiveEntries = async (file) => {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".zip")) {
    const zip = await JSZip.loadAsync(file, { decodeFileName: decodeZipFileName });
    const payload = createArchivePayload();
    const fileEntries = Object.keys(zip.files).filter((path) => !zip.files[path].dir);

    let index = 0;
    for (const path of fileEntries) {
      const zipEntry = zip.file(path);
      if (!zipEntry) continue;
      const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
      const bytes = await zipEntry.async("uint8array");
      appendArchiveEntry(payload, normalizedPath, bytes, index);
      index += 1;
    }

    return {
      ...payload,
      filePaths: payload.entries.map((entry) => entry.path),
    };
  }

  if (lowerName.endsWith(".7z")) {
    return extract7zEntries(file);
  }

  const api = await loadLibarchiveRuntime();
  const data = new Uint8Array(await file.arrayBuffer());
  const ptr = api.module._malloc(data.length);
  api.module.HEAP8.set(data, ptr);

  const archive = api.read_new_memory(ptr, data.length, undefined);
  if (!archive) {
    api.module._free(ptr);
    throw new Error("不支持或损坏的压缩包格式");
  }

  const payload = createArchivePayload();
  let index = 0;

  try {
    for (;;) {
      const entryPtr = api.read_next_entry(archive);
      if (!entryPtr) break;

      const pathname = api.entry_pathname(entryPtr);
      const normalizedPath = pathname?.replace(/\\/g, "/").replace(/^\/+/, "");
      const fileType = LIBARCHIVE_FILE_TYPES[api.entry_filetype(entryPtr)];

      if (!normalizedPath || fileType !== "File") {
        api.read_data_skip(archive);
        continue;
      }

      const chunkSize = 64 * 1024;
      const entryPtrBuffer = api.module._malloc(chunkSize);
      const chunks = [];
      let totalLength = 0;

      try {
        for (;;) {
          const readSize = api.read_data(archive, entryPtrBuffer, chunkSize);
          if (!readSize) break;
          const chunk = new Uint8Array(api.module.HEAP8.buffer, entryPtrBuffer, readSize).slice();
          chunks.push(chunk);
          totalLength += readSize;
        }
      } finally {
        api.module._free(entryPtrBuffer);
      }

      const bytes = new Uint8Array(totalLength);
      let offset = 0;
      chunks.forEach((chunk) => {
        bytes.set(chunk, offset);
        offset += chunk.length;
      });

      appendArchiveEntry(payload, normalizedPath, bytes, index);
      index += 1;
    }
  } finally {
    api.read_free(archive);
    api.module._free(ptr);
  }

  return {
    ...payload,
    filePaths: payload.entries.map((entry) => entry.path),
  };
};

export const collectModelCandidates = (archiveOrEntries, modelType = MODEL_TYPES.LIVE2D) => {
  if (modelType === MODEL_TYPES.SPINE) {
    return collectSpineCandidates(archiveOrEntries);
  }

  const entries = Array.isArray(archiveOrEntries) ? archiveOrEntries : archiveOrEntries.entries;
  return collectLive2DCandidates(entries);
};

export const buildLocalModelFromArchive = async ({
  archive,
  selectedCandidateId,
  candidates,
  localModelFileName,
  modelType = MODEL_TYPES.LIVE2D,
}) => {
  const selectedCandidate = candidates.find((item) => item.id === selectedCandidateId);
  const modelPath = selectedCandidate?.path || selectedCandidateId;
  if (modelType === MODEL_TYPES.SPINE) {
    const skeletonContent = loadArchiveFileContent(archive, modelPath, selectedCandidate?.entryKey || null);
    if (!skeletonContent) {
      throw new Error(`未找到 Spine 骨骼文件: ${modelPath}`);
    }

    const atlasPath = selectedCandidate?.atlasPath || findSpineAtlasEntry(archive.entries, modelPath)?.path;
    if (!atlasPath) {
      throw new Error(`未找到与 ${getBaseName(modelPath)} 对应的 atlas 文件`);
    }

    const atlasContent = loadArchiveFileContent(archive, atlasPath);
    if (!atlasContent) {
      throw new Error(`未找到 Spine atlas 文件: ${atlasPath}`);
    }

    const atlasText = new TextDecoder().decode(atlasContent);
    const atlasDir = getDirName(atlasPath);
    const pageNames = parseSpineAtlasPageNames(atlasText);
    const images = {};

    for (const pageName of pageNames) {
      const normalizedPagePath = joinAndNormalizePath(atlasDir, pageName);
      const imageContent = loadArchiveFileContent(archive, normalizedPagePath);
      if (!imageContent) {
        throw new Error(`未找到 Spine 贴图: ${normalizedPagePath}`);
      }

      images[pageName] = {
        path: normalizedPagePath,
        dataUrl: toDataUrl(imageContent, getMimeType(normalizedPagePath)),
      };
    }

    const lowerModelPath = modelPath.toLowerCase();
    const skeletonJson = lowerModelPath.endsWith(".json")
      ? selectedCandidate?.skeletonJson || parseJsonBytes(skeletonContent)
      : null;
    const localModelLabel = localModelFileName ? `${localModelFileName}/${modelPath}` : modelPath;

    return {
      localModelData: {
        kind: MODEL_TYPES.SPINE,
        skeletonPath: modelPath,
        skeletonFileType: isSpineBinaryPath(lowerModelPath) ? "binary" : "json",
        skeletonJson,
        skeletonBinary: isSpineBinaryPath(lowerModelPath) ? skeletonContent.slice() : null,
        atlasPath,
        atlasText,
        images,
      },
      localModelLabel,
    };
  }

  const modelContent = loadArchiveFileContent(archive, modelPath, selectedCandidate?.entryKey || null);
  if (!modelContent) {
    throw new Error(`未找到文件: ${modelPath}`);
  }

  const modelText = new TextDecoder().decode(modelContent);
  const modelData = JSON.parse(modelText);
  const baseDir = getDirName(modelPath);
  const toBlobUrl = async (relativePath, currentDir) => {
    if (!relativePath || typeof relativePath !== "string" || isExternalUrl(relativePath)) {
      return relativePath;
    }

    const normalized = joinAndNormalizePath(currentDir, relativePath);
    const content = loadArchiveFileContent(archive, normalized);
    if (!content) {
      return relativePath;
    }

    return toDataUrl(content, getMimeType(normalized));
  };

  const rewriteMotionGroups = async (motions, currentDir) => {
    if (!isObject(motions)) return motions;

    const groups = Object.keys(motions);
    for (const groupName of groups) {
      const list = motions[groupName];
      if (!Array.isArray(list)) continue;

      motions[groupName] = await Promise.all(
        list.map(async (motionItem) => {
          if (!isObject(motionItem)) return motionItem;
          const nextMotion = { ...motionItem };
          nextMotion.file = await toBlobUrl(nextMotion.file, currentDir);
          nextMotion.File = await toBlobUrl(nextMotion.File, currentDir);
          nextMotion.sound = await toBlobUrl(nextMotion.sound, currentDir);
          nextMotion.Sound = await toBlobUrl(nextMotion.Sound, currentDir);
          return nextMotion;
        }),
      );
    }

    return motions;
  };

  const rewriteExpressions = async (expressions, currentDir) => {
    if (!Array.isArray(expressions)) return expressions;

    return Promise.all(
      expressions.map(async (item) => {
        if (!isObject(item)) return item;
        const nextItem = { ...item };
        if (typeof nextItem.file === "string") {
          nextItem.file = await toBlobUrl(nextItem.file, currentDir);
        }
        if (typeof nextItem.File === "string") {
          nextItem.File = await toBlobUrl(nextItem.File, currentDir);
        }
        return nextItem;
      }),
    );
  };

  const rewriteTopLevelModel = async (data, currentDir) => {
    const next = { ...data };

    for (const key of FILE_PATH_KEYS) {
      if (typeof next[key] === "string") {
        next[key] = await toBlobUrl(next[key], currentDir);
      }
    }

    if (Array.isArray(next.textures)) {
      next.textures = await Promise.all(next.textures.map((item) => toBlobUrl(item, currentDir)));
    }

    next.expressions = await rewriteExpressions(next.expressions, currentDir);
    next.motions = await rewriteMotionGroups(next.motions, currentDir);

    if (isObject(next.FileReferences)) {
      const references = { ...next.FileReferences };

      for (const key of FILE_PATH_KEYS) {
        if (typeof references[key] === "string") {
          references[key] = await toBlobUrl(references[key], currentDir);
        }
      }

      if (Array.isArray(references.Textures)) {
        references.Textures = await Promise.all(references.Textures.map((item) => toBlobUrl(item, currentDir)));
      }

      references.Expressions = await rewriteExpressions(references.Expressions, currentDir);
      references.Motions = await rewriteMotionGroups(references.Motions, currentDir);
      next.FileReferences = references;
    }

    next.url = "";
    return next;
  };

  const rewrittenData = await rewriteTopLevelModel(modelData, baseDir);
  const localModelLabel = localModelFileName ? `${localModelFileName}/${modelPath}` : modelPath;

  return {
    localModelData: rewrittenData,
    localModelLabel,
  };
};
