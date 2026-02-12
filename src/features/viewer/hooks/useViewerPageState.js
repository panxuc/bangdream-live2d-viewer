"use client";

import * as PIXI from "pixi.js";
import JSZip from "jszip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const BRAND_PINK = "#E5004F";
export const MAX_MODELS = 16;

const DEFAULT_MODEL_ID = "default-1";
const EMPTY_MODEL = {
  modelSource: "remote",
  characterId: null,
  modelId: null,
  modelData: null,
  customModelData: null,
  localModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  x: 0,
  y: 0,
  scale: 0.25,
  isModified: false,
  isHeadless: false,
  isBodyless: false,
  isVisible: true,
  localModelFileName: null,
  localModelCandidates: [],
  localModelPath: null,
  localModelLabel: null,
  localModelError: null,
};

const RESET_ON_CHARACTER_CHANGE = {
  modelId: null,
  modelData: null,
  customModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  localModelError: null,
};

const RESET_ON_MODEL_CHANGE = {
  modelData: null,
  customModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  localModelError: null,
};

const RESET_ON_SOURCE_CHANGE = {
  characterId: null,
  modelId: null,
  modelData: null,
  customModelData: null,
  localModelData: null,
  motion: null,
  expression: null,
  borrowedModelId: null,
  borrowedCharId: null,
  isBorrowingMotion: false,
  isModified: false,
  isHeadless: false,
  isBodyless: false,
  localModelFileName: null,
  localModelCandidates: [],
  localModelPath: null,
  localModelLabel: null,
  localModelError: null,
  x: 0,
  y: 0,
  scale: 0.25,
};

const MODEL_FILE_PATTERNS = ["model.json", "builddata.asset", ".model3.json"];
const FILE_PATH_KEYS = ["model", "physics", "pose", "userData", "sound", "file"];
const EXCLUDED_LOCAL_MODEL_SUFFIXES = ["exp.json", "physics.json", "transitiondata.asset"];

const toNullableSelection = (value) => (value === "none" ? null : value);
const getModelApiBase = (modelId, isModified) => (isModified ? `/api/charam/${modelId}/` : `/api/chara/${modelId}/`);
const createModel = (id) => ({ id, ...EMPTY_MODEL });

const isObject = (value) => value !== null && typeof value === "object";
const toLowerPath = (path) => path.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
const isExternalUrl = (value) => /^(https?:|blob:|data:|\/)/i.test(value);
const getDirName = (path) => {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
};
const getBaseName = (path) => path.replace(/\\/g, "/").split("/").pop() || path;

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
const LIBARCHIVE_FILE_TYPES = {
  32768: "File",
};
const decodeZipFileName = (bytes) => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    try {
      return new TextDecoder("gb18030").decode(bytes);
    } catch {
      return new TextDecoder().decode(bytes);
    }
  }
};
let libarchiveRuntimePromise = null;

const loadBrowserScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

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

    await loadBrowserScript("/libarchive.js");
    if (typeof window.libarchive !== "function") {
      throw new Error("libarchive runtime failed to load");
    }

    const wasmModule = await window.libarchive({
      locateFile: (fileName) => (fileName.endsWith(".wasm") ? "/libarchive.wasm" : fileName),
    });

    return createLibarchiveApi(wasmModule);
  })();

  return libarchiveRuntimePromise;
};

const extractArchiveEntries = async (file) => {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".zip")) {
    const zip = await JSZip.loadAsync(file, { decodeFileName: decodeZipFileName });
    const filePathMap = new Map();
    const filesMap = new Map();
    const fileEntries = Object.keys(zip.files).filter((path) => !zip.files[path].dir);

    for (const path of fileEntries) {
      const zipEntry = zip.file(path);
      if (!zipEntry) continue;
      const normalizedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");
      const bytes = await zipEntry.async("uint8array");
      filePathMap.set(toLowerPath(normalizedPath), normalizedPath);
      filesMap.set(normalizedPath, bytes);
    }

    return {
      filePathMap,
      filesMap,
      filePaths: Array.from(filesMap.keys()),
    };
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

  const filePathMap = new Map();
  const filesMap = new Map();

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

      filePathMap.set(toLowerPath(normalizedPath), normalizedPath);
      filesMap.set(normalizedPath, bytes);
    }
  } finally {
    api.read_free(archive);
    api.module._free(ptr);
  }

  return {
    filePathMap,
    filesMap,
    filePaths: Array.from(filesMap.keys()),
  };
};

const toControlModelData = (data) => {
  if (!data) {
    return { motions: null, expressions: [] };
  }

  if (data.FileReferences) {
    const expressions = Array.isArray(data.FileReferences.Expressions)
      ? data.FileReferences.Expressions.map((item) => ({
          name: item?.Name || getBaseName(item?.File || ""),
          file: item?.File || "",
        }))
      : [];

    return {
      motions: data.FileReferences.Motions || null,
      expressions,
    };
  }

  return {
    motions: data.motions || null,
    expressions: data.expressions || [],
  };
};

const collectModelCandidates = (filePaths) => {
  const candidates = filePaths
    .filter((path) => {
      const lower = path.toLowerCase();
      const isModelLike = lower.endsWith(".json") || lower.endsWith(".asset");
      const isExcluded = EXCLUDED_LOCAL_MODEL_SUFFIXES.some((suffix) => lower.endsWith(suffix));
      return isModelLike && !isExcluded;
    })
    .sort((a, b) => {
      const aName = a.toLowerCase();
      const bName = b.toLowerCase();
      const aPriority = MODEL_FILE_PATTERNS.findIndex((pattern) => aName.endsWith(pattern));
      const bPriority = MODEL_FILE_PATTERNS.findIndex((pattern) => bName.endsWith(pattern));
      const normA = aPriority === -1 ? MODEL_FILE_PATTERNS.length : aPriority;
      const normB = bPriority === -1 ? MODEL_FILE_PATTERNS.length : bPriority;
      if (normA !== normB) return normA - normB;
      return a.localeCompare(b);
    });

  return candidates.map((path) => ({ path, label: getBaseName(path) }));
};

export function useViewerPageState() {
  const [models, setModels] = useState([createModel(DEFAULT_MODEL_ID)]);
  const [activeModelId, setActiveModelId] = useState(DEFAULT_MODEL_ID);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [isBatching, setIsBatching] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isUploadingLocalModel, setIsUploadingLocalModel] = useState(false);
  const canvasRef = useRef();
  const reloadPendingRef = useRef(false);
  const reloadTimeoutRef = useRef(null);
  const localArchivesRef = useRef(new Map());
  const localBlobUrlsRef = useRef(new Map());

  const activeModel = useMemo(() => models.find((m) => m.id === activeModelId) || models[0], [models, activeModelId]);
  const activeModelIndex = useMemo(() => models.findIndex((m) => m.id === activeModelId), [models, activeModelId]);

  const revokeBlobUrlsForModel = useCallback((modelId) => {
    const urlSet = localBlobUrlsRef.current.get(modelId);
    if (urlSet) {
      urlSet.forEach((url) => URL.revokeObjectURL(url));
      localBlobUrlsRef.current.delete(modelId);
    }
  }, []);

  const setBlobUrlsForModel = useCallback(
    (modelId, urlSet) => {
      revokeBlobUrlsForModel(modelId);
      if (urlSet && urlSet.size > 0) {
        localBlobUrlsRef.current.set(modelId, urlSet);
      }
    },
    [revokeBlobUrlsForModel],
  );

  useEffect(() => {
    if (typeof window !== "undefined") window.PIXI = PIXI;
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }

      localBlobUrlsRef.current.forEach((urlSet) => {
        urlSet.forEach((url) => URL.revokeObjectURL(url));
      });
      localBlobUrlsRef.current.clear();
      localArchivesRef.current.clear();
    };
  }, []);

  const updateActiveModel = useCallback(
    (updates) => {
      setModels((prev) => prev.map((m) => (m.id === activeModelId ? { ...m, ...updates } : m)));
    },
    [activeModelId],
  );

  const handleAddModel = useCallback(() => {
    if (models.length >= MAX_MODELS) return;

    const newId = `model-${Date.now()}`;
    setModels((prev) => [...prev, createModel(newId)]);
    setActiveModelId(newId);
  }, [models.length]);

  const handleRemoveModel = useCallback(
    (idToRemove) => {
      if (models.length <= 1) return;

      revokeBlobUrlsForModel(idToRemove);
      localArchivesRef.current.delete(idToRemove);

      setModels((prev) => {
        const filtered = prev.filter((m) => m.id !== idToRemove);
        if (idToRemove === activeModelId) {
          setActiveModelId(filtered[filtered.length - 1].id);
        }
        return filtered;
      });
    },
    [models.length, activeModelId, revokeBlobUrlsForModel],
  );

  const handleMoveModel = useCallback(
    (id, direction) => {
      if (direction !== "up" && direction !== "down") return;

      setModels((prev) => {
        const index = prev.findIndex((model) => model.id === id);
        if (index === -1) return prev;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;

        const next = [...prev];
        const [moved] = next.splice(index, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
    },
    [],
  );

  const handleCharacterSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelSource: "remote",
        characterId: toNullableSelection(value),
        ...RESET_ON_CHARACTER_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleModelSelect = useCallback(
    (value) => {
      updateActiveModel({
        modelSource: "remote",
        modelId: toNullableSelection(value),
        ...RESET_ON_MODEL_CHANGE,
      });
    },
    [updateActiveModel],
  );

  const handleModelSourceChange = useCallback(
    (source) => {
      if (source !== "remote" && source !== "local") return;
      revokeBlobUrlsForModel(activeModelId);
      localArchivesRef.current.delete(activeModelId);

      updateActiveModel({
        ...RESET_ON_SOURCE_CHANGE,
        modelSource: source,
      });
    },
    [activeModelId, revokeBlobUrlsForModel, updateActiveModel],
  );

  const handleModelLoad = useCallback((modelId, data) => {
    const controlData = toControlModelData(data);
    setModels((prev) => prev.map((m) => (m.id === modelId ? { ...m, modelData: controlData } : m)));
  }, []);

  const handleMotionSelect = useCallback(
    (value) => {
      updateActiveModel({ motion: toNullableSelection(value) });
    },
    [updateActiveModel],
  );

  const handleMotionOverride = useCallback(
    async (sourceCharId, sourceModelId) => {
      if (!sourceCharId || !sourceModelId) {
        updateActiveModel({
          customModelData: null,
          modelData: activeModel.modelSource === "local" ? toControlModelData(activeModel.localModelData) : activeModel.modelData,
          motion: null,
          borrowedModelId: null,
          borrowedCharId: null,
        });
        return;
      }

      try {
        const currentModelId = activeModel.modelId;
        const isLocalTarget = activeModel.modelSource === "local" && !!activeModel.localModelData;
        if (!isLocalTarget && !currentModelId) return;

        const sourceBaseUrl = getModelApiBase(sourceModelId, false);
        const sourceDataUrl = `${sourceBaseUrl}buildData.asset`;
        let targetJson;
        let targetBaseUrl = "";

        if (isLocalTarget) {
          targetJson = JSON.parse(JSON.stringify(activeModel.localModelData));
        } else {
          targetBaseUrl = getModelApiBase(currentModelId, activeModel.isModified);
          const targetDataUrl = `${targetBaseUrl}buildData.asset`;
          const targetRes = await fetch(targetDataUrl);
          if (!targetRes.ok) throw new Error("Failed to fetch target model data");
          targetJson = await targetRes.json();
        }

        const sourceRes = await fetch(sourceDataUrl);
        if (!sourceRes.ok) throw new Error("Failed to fetch source model data");
        const sourceJson = await sourceRes.json();

        const sourceMotionData = sourceJson?.FileReferences?.Motions || sourceJson?.motions || {};
        const processedMotions = {};
        Object.keys(sourceMotionData).forEach((groupName) => {
          const motionList = sourceMotionData[groupName];
          if (!Array.isArray(motionList)) return;

          processedMotions[groupName] = motionList.map((motion) => {
            const nextMotion = { ...motion };

            if (nextMotion.file) {
              nextMotion.file = new URL(nextMotion.file, window.location.origin + sourceBaseUrl).href;
            }
            if (nextMotion.File) {
              nextMotion.File = new URL(nextMotion.File, window.location.origin + sourceBaseUrl).href;
            }
            if (nextMotion.sound) {
              nextMotion.sound = new URL(nextMotion.sound, window.location.origin + sourceBaseUrl).href;
            }
            if (nextMotion.Sound) {
              nextMotion.Sound = new URL(nextMotion.Sound, window.location.origin + sourceBaseUrl).href;
            }

            return nextMotion;
          });
        });

        const hybridModelData = {
          ...targetJson,
          url: targetBaseUrl,
        };
        if (hybridModelData.FileReferences && hybridModelData.FileReferences.Motions !== undefined) {
          hybridModelData.FileReferences = {
            ...hybridModelData.FileReferences,
            Motions: processedMotions,
          };
        } else {
          hybridModelData.motions = processedMotions;
        }

        updateActiveModel({
          customModelData: hybridModelData,
          modelData: toControlModelData(hybridModelData),
          motion: null,
          borrowedModelId: sourceModelId,
          borrowedCharId: sourceCharId,
        });
      } catch (error) {
        console.error("Motion override failed:", error);
      }
    },
    [activeModel, updateActiveModel],
  );

  const handleBorrowingToggle = useCallback(() => {
    const nextState = !activeModel.isBorrowingMotion;
    updateActiveModel({ isBorrowingMotion: nextState });
    if (!nextState) {
      handleMotionOverride(null, null);
    }
  }, [activeModel.isBorrowingMotion, updateActiveModel, handleMotionOverride]);

  const handleSourceCharChange = useCallback(
    (charId) => {
      updateActiveModel({ borrowedCharId: charId, borrowedModelId: null });
    },
    [updateActiveModel],
  );

  const handleExpressionSelect = useCallback(
    (value) => {
      updateActiveModel({ expression: toNullableSelection(value) });
    },
    [updateActiveModel],
  );

  const handleModelReload = useCallback(() => {
    reloadPendingRef.current = true;
    setIsReloading(true);
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }
    reloadTimeoutRef.current = setTimeout(() => {
      reloadPendingRef.current = false;
      setIsReloading(false);
      reloadTimeoutRef.current = null;
    }, 15000);

    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        motion: null,
        expression: null,
        reloadKey: (m.reloadKey || 0) + 1,
      })),
    );
  }, []);

  const handleCanvasSyncComplete = useCallback(({ reloadedModelIds }) => {
    if (!reloadPendingRef.current) return;

    if (Array.isArray(reloadedModelIds) && reloadedModelIds.length > 0) {
      reloadPendingRef.current = false;
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
      setIsReloading(false);
    }
  }, []);

  const handleTransformChange = useCallback(
    (key, value) => {
      updateActiveModel({ [key]: value });
    },
    [updateActiveModel],
  );

  const handleModifiedChange = useCallback(
    (checked) => {
      updateActiveModel({
        modelSource: "remote",
        isModified: checked,
        modelId: null,
        modelData: null,
        motion: null,
        expression: null,
        borrowedModelId: null,
        borrowedCharId: null,
        isBorrowingMotion: false,
        customModelData: null,
        localModelError: null,
      });
    },
    [updateActiveModel],
  );

  const handleHeadlessChange = useCallback(() => {
    updateActiveModel({ isHeadless: !activeModel.isHeadless });
  }, [activeModel.isHeadless, updateActiveModel]);

  const handleBodylessChange = useCallback(() => {
    updateActiveModel({ isBodyless: !activeModel.isBodyless });
  }, [activeModel.isBodyless, updateActiveModel]);

  const handleLocalArchiveUpload = useCallback(
    async (file) => {
      if (!file) return;

      setIsUploadingLocalModel(true);
      try {
        const archivePayload = await extractArchiveEntries(file);
        const filePaths = archivePayload.filePaths;

        const candidates = collectModelCandidates(filePaths);
        if (candidates.length === 0) {
          throw new Error("压缩包中没有可选的 model.json / buildData.asset / *.model3.json 文件");
        }

        localArchivesRef.current.set(activeModelId, archivePayload);

        updateActiveModel({
          localModelFileName: file.name,
          localModelCandidates: candidates,
          localModelPath: null,
          localModelData: null,
          localModelLabel: null,
          localModelError: null,
          modelData: null,
          motion: null,
          expression: null,
          borrowedModelId: null,
          borrowedCharId: null,
          isBorrowingMotion: false,
        });
      } catch (error) {
        updateActiveModel({
          localModelError: error instanceof Error ? error.message : "读取压缩包失败",
        });
      } finally {
        setIsUploadingLocalModel(false);
      }
    },
    [activeModelId, updateActiveModel],
  );

  const handleLocalModelPathSelect = useCallback(
    (path) => {
      updateActiveModel({
        localModelPath: path,
        localModelError: null,
      });
    },
    [updateActiveModel],
  );

  const handleApplyLocalModel = useCallback(async (pathOverride) => {
    const archive = localArchivesRef.current.get(activeModelId);
    if (!archive) {
      updateActiveModel({ localModelError: "请先上传一个压缩包" });
      return;
    }

    const targetModelPath = pathOverride || activeModel.localModelPath;
    if (!targetModelPath) {
      updateActiveModel({ localModelError: "请选择 model.json 或 buildData.asset" });
      return;
    }

    try {
      const modelPath = targetModelPath;
      const resolveArchivePath = (path) => archive.filePathMap.get(toLowerPath(path.replace(/\\/g, "/").replace(/^\/+/, "")));
      const loadArchiveFileContent = async (path) => {
        const resolvedPath = resolveArchivePath(path);
        if (!resolvedPath) return null;
        return archive.filesMap.get(resolvedPath) || null;
      };

      const modelContent = await loadArchiveFileContent(modelPath);
      if (!modelContent) {
        throw new Error(`未找到文件: ${modelPath}`);
      }

      const modelText = new TextDecoder().decode(modelContent);
      const modelData = JSON.parse(modelText);
      const baseDir = getDirName(modelPath);
      const blobUrls = new Set();

      const toBlobUrl = async (relativePath, currentDir) => {
        if (!relativePath || typeof relativePath !== "string" || isExternalUrl(relativePath)) {
          return relativePath;
        }

        const normalized = joinAndNormalizePath(currentDir, relativePath);
        const content = await loadArchiveFileContent(normalized);
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

          const rewrittenList = await Promise.all(
            list.map(async (motionItem) => {
              if (!isObject(motionItem)) return motionItem;
              const nextMotion = { ...motionItem };
              nextMotion.file = await toBlobUrl(nextMotion.file, currentDir);
              nextMotion.sound = await toBlobUrl(nextMotion.sound, currentDir);
              return nextMotion;
            }),
          );

          motions[groupName] = rewrittenList;
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

      setBlobUrlsForModel(activeModelId, blobUrls);
      const zipAndPathLabel = activeModel.localModelFileName
        ? `${activeModel.localModelFileName}/${modelPath}`
        : modelPath;
      updateActiveModel({
        modelSource: "local",
        localModelData: rewrittenData,
        modelData: toControlModelData(rewrittenData),
        motion: null,
        expression: null,
        borrowedModelId: null,
        borrowedCharId: null,
        isBorrowingMotion: false,
        localModelLabel: zipAndPathLabel,
        localModelError: null,
      });
    } catch (error) {
      updateActiveModel({
        localModelError: error instanceof Error ? error.message : "加载本地模型失败",
      });
    }
  }, [activeModel, activeModelId, setBlobUrlsForModel, updateActiveModel]);

  const handleClearLocalModel = useCallback(() => {
    revokeBlobUrlsForModel(activeModelId);
    updateActiveModel({
      modelSource: "remote",
      localModelData: null,
      modelData: null,
      localModelLabel: null,
      localModelError: null,
    });
  }, [activeModelId, revokeBlobUrlsForModel, updateActiveModel]);

  return {
    models,
    activeModel,
    activeModelId,
    activeModelIndex,
    isDarkMode,
    backgroundColor,
    isBatching,
    isReloading,
    isUploadingLocalModel,
    canvasRef,
    setActiveModelId,
    setIsDarkMode,
    setBackgroundColor,
    setIsBatching,
    handleAddModel,
    handleRemoveModel,
    handleMoveModel,
    handleCharacterSelect,
    handleModelSelect,
    handleModelSourceChange,
    handleModelLoad,
    handleMotionSelect,
    handleMotionOverride,
    handleBorrowingToggle,
    handleSourceCharChange,
    handleExpressionSelect,
    handleModelReload,
    handleCanvasSyncComplete,
    handleTransformChange,
    handleModifiedChange,
    handleHeadlessChange,
    handleBodylessChange,
    handleLocalArchiveUpload,
    handleLocalModelPathSelect,
    handleApplyLocalModel,
    handleClearLocalModel,
  };
}
