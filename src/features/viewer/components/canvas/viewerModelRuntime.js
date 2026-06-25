"use client";

import * as PIXI from "pixi.js";
import { TextureAtlas } from "pixi-spine";
import { PUBLIC_ASSET_PATHS, getViewerModelApiBase, getViewerSpineApiBase } from "@/src/config/urls";
import { toControlModelData, toSpineControlModelData } from "@/src/features/viewer/lib/modelData";
import { MODEL_PROVIDERS, MODEL_TYPES } from "@/src/features/viewer/lib/modelState";
import { detectSpineBinaryVersion, normalizeSpineVersionKey } from "@/src/features/viewer/lib/spineVersion";
import { loadPublicScript } from "@/src/lib/loadPublicScript";

const DEFAULT_LIVE2D_SCALE = 0.25;
const LIVE2D_ON_FIT_PADDING = 0.9;
const DEFAULT_SPINE_BASE_OFFSET_Y = -40;
const MODEL_MASK_TEXTURE = PUBLIC_ASSET_PATHS.modelMaskTexture;
const SPINE_FIT_PADDING = 0.82;
const SPINE_RUNTIME_LOADERS = {
  "3.7": () => import("@pixi-spine/runtime-3.7"),
  "3.8": () => import("@pixi-spine/runtime-3.8"),
  "4.0": () => import("@pixi-spine/runtime-4.0"),
  "4.1": () => import("@pixi-spine/runtime-4.1"),
};

let live2dCoreLoadPromise = null;
let live2dModulePromise = null;
const spineRuntimePromiseMap = new Map();

const safeRun = (fn) => {
  try {
    fn();
  } catch {
    // Keep the viewer alive even if a model runtime throws.
  }
};

const toFiniteNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const normalizeParameterId = (id, index) => {
  if (typeof id === "string" || typeof id === "number") {
    const value = String(id);
    return value || null;
  }

  if (id && typeof id === "object") {
    for (const key of ["id", "_id", "name", "_name", "value"]) {
      if (typeof id[key] === "string" || typeof id[key] === "number") {
        const value = String(id[key]);
        if (value) return value;
      }
    }

    if (typeof id.toString === "function" && id.toString !== Object.prototype.toString) {
      const value = id.toString();
      if (value && value !== "[object Object]") return value;
    }
  }

  return typeof index === "number" ? `PARAM_${index}` : null;
};

const createLive2DParameterDefinition = ({ id, index, value, defaultValue, min, max }) => {
  const parameterId = normalizeParameterId(id, index);
  if (!parameterId) return null;

  const currentValue = toFiniteNumber(value, 0);
  let minimumValue = toFiniteNumber(min, currentValue - 1);
  let maximumValue = toFiniteNumber(max, currentValue + 1);
  const fallbackDefault = Number.isFinite(defaultValue) ? defaultValue : currentValue;

  if (minimumValue === maximumValue) {
    minimumValue = fallbackDefault - 1;
    maximumValue = fallbackDefault + 1;
  }

  if (minimumValue > maximumValue) {
    [minimumValue, maximumValue] = [maximumValue, minimumValue];
  }

  const range = Math.abs(maximumValue - minimumValue);
  const step = range <= 2 ? 0.01 : 0.1;

  return {
    id: parameterId,
    index,
    min: minimumValue,
    max: maximumValue,
    defaultValue: toFiniteNumber(fallbackDefault, currentValue),
    value: currentValue,
    step,
  };
};

const extractCubism4ParameterDefinitions = (coreModel) => {
  const parameters = coreModel?.getModel?.()?.parameters;
  if (!parameters) return [];

  const count = Number(parameters.count) || parameters.ids?.length || 0;
  return Array.from({ length: count }, (_, index) =>
    createLive2DParameterDefinition({
      id: parameters.ids?.[index],
      index,
      value: parameters.values?.[index],
      defaultValue: parameters.defaultValues?.[index],
      min: parameters.minimumValues?.[index],
      max: parameters.maximumValues?.[index],
    }),
  ).filter(Boolean);
};

const extractCubism2ParameterDefinitions = (coreModel) => {
  const modelContext = coreModel?.getModelContext?.();
  const ids = modelContext?._$pb;
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const count = Number(modelContext._$qo) || ids.length;
  return ids
    .slice(0, count)
    .map((id, index) =>
      createLive2DParameterDefinition({
        id,
        index,
        value: modelContext._$_2?.[index] ?? coreModel.getParamFloat?.(index),
        defaultValue: modelContext._$vr?.[index] ?? modelContext._$fs?.[index],
        min: modelContext._$Rr?.[index] ?? modelContext.getParamMin?.(index),
        max: modelContext._$Or?.[index] ?? modelContext.getParamMax?.(index),
      }),
    )
    .filter(Boolean);
};

const extractLive2DParameterDefinitions = (instance) => {
  const coreModel = instance?.internalModel?.coreModel;
  const parameters = [
    ...extractCubism4ParameterDefinitions(coreModel),
    ...extractCubism2ParameterDefinitions(coreModel),
  ];
  const seen = new Set();
  const definitions = parameters.filter((parameter) => {
    if (seen.has(parameter.id)) return false;
    seen.add(parameter.id);
    return true;
  });

  instance.__viewerParameterDefinitions = definitions;
  instance.__viewerParameterIndexById = new Map(definitions.map((parameter) => [parameter.id, parameter.index]));
  instance.__viewerParameterDefaultById = new Map(
    definitions.map((parameter) => [parameter.id, parameter.defaultValue]),
  );
  instance.__viewerLastParameterValues = getLive2DParameterValueSnapshot(instance);

  return definitions;
};

const readFiniteLive2DParameterValue = (readValue) => {
  try {
    const value = Number(readValue());
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const readLive2DParameterValue = (coreModel, parameter) => {
  if (!coreModel || !parameter) return null;

  const { id, index } = parameter;
  const hasIndex = Number.isInteger(index);
  const reads = [];

  if (hasIndex && typeof coreModel.getParameterValueByIndex === "function") {
    reads.push(() => coreModel.getParameterValueByIndex(index));
  }

  if (id && typeof coreModel.getParameterValueById === "function") {
    reads.push(() => coreModel.getParameterValueById(id));
  }

  if (hasIndex) {
    reads.push(() => coreModel.getModel?.()?.parameters?.values?.[index]);
    reads.push(() => coreModel.getModelContext?.()?._$_2?.[index]);
  }

  if (hasIndex && typeof coreModel.getParamFloat === "function") {
    reads.push(() => coreModel.getParamFloat(index));
  }

  if (id && typeof coreModel.getParamFloat === "function") {
    reads.push(() => coreModel.getParamFloat(id));
  }

  for (const read of reads) {
    const value = readFiniteLive2DParameterValue(read);
    if (value !== null) return value;
  }

  return null;
};

const getLive2DParameterValueSnapshot = (instance) => {
  const definitions = instance?.__viewerParameterDefinitions;
  const coreModel = instance?.internalModel?.coreModel;
  if (!Array.isArray(definitions) || definitions.length === 0 || !coreModel) return {};

  return Object.fromEntries(
    definitions.map((parameter) => [
      parameter.id,
      readLive2DParameterValue(coreModel, parameter) ?? parameter.defaultValue ?? parameter.value ?? 0,
    ]),
  );
};

const setLive2DParameterValue = (instance, parameterId, value) => {
  const coreModel = instance?.internalModel?.coreModel;
  if (!coreModel || !parameterId) return;

  const index = instance.__viewerParameterIndexById?.get(parameterId);
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return;

  if (typeof coreModel.setParameterValueByIndex === "function" && Number.isInteger(index)) {
    coreModel.setParameterValueByIndex(index, numericValue, 1);
    return;
  }

  if (typeof coreModel.setParameterValueById === "function") {
    coreModel.setParameterValueById(parameterId, numericValue, 1);
    return;
  }

  if (typeof coreModel.setParamFloat === "function") {
    coreModel.setParamFloat(Number.isInteger(index) ? index : parameterId, numericValue, 1);
  }
};

const applyLive2DParameterOverrides = (instance) => {
  const overrides = instance?.__viewerParameterOverrides;
  if (!overrides || typeof overrides !== "object") return;

  Object.entries(overrides).forEach(([parameterId, value]) => {
    setLive2DParameterValue(instance, parameterId, value);
  });
};

const installLive2DParameterOverrideHook = (instance) => {
  if (!instance?.internalModel || instance.__viewerParameterOverrideHandler) return;

  const handler = () => {
    applyLive2DParameterOverrides(instance);
    instance.__viewerLastParameterValues = getLive2DParameterValueSnapshot(instance);
  };
  instance.__viewerParameterOverrideHandler = handler;

  if (typeof instance.internalModel.on === "function") {
    instance.internalModel.on("beforeModelUpdate", handler);
  }
};

const removeLive2DParameterOverrideHook = (instance) => {
  const handler = instance?.__viewerParameterOverrideHandler;
  if (!handler) return;

  if (typeof instance.internalModel?.off === "function") {
    instance.internalModel.off("beforeModelUpdate", handler);
  } else if (typeof instance.internalModel?.removeListener === "function") {
    instance.internalModel.removeListener("beforeModelUpdate", handler);
  }

  instance.__viewerParameterOverrideHandler = null;
};

const setLive2DParameterOverrides = (instance, nextOverrides = {}) => {
  if (!instance || instance.__viewerType !== MODEL_TYPES.LIVE2D) return;

  const previousOverrides = instance.__viewerParameterOverrides || {};
  const normalizedOverrides = Object.fromEntries(
    Object.entries(nextOverrides || {}).filter(([, value]) => Number.isFinite(Number(value))),
  );

  Object.keys(previousOverrides).forEach((parameterId) => {
    if (Object.prototype.hasOwnProperty.call(normalizedOverrides, parameterId)) return;
    const defaultValue = instance.__viewerParameterDefaultById?.get(parameterId);
    if (Number.isFinite(defaultValue)) {
      setLive2DParameterValue(instance, parameterId, defaultValue);
    }
  });

  instance.__viewerParameterOverrides = normalizedOverrides;
  applyLive2DParameterOverrides(instance);
  instance.__viewerLastParameterValues = getLive2DParameterValueSnapshot(instance);
};

const getSpineRuntimeModule = async (versionKey) => {
  if (!spineRuntimePromiseMap.has(versionKey)) {
    const loadModule = SPINE_RUNTIME_LOADERS[versionKey] || SPINE_RUNTIME_LOADERS["4.1"];
    spineRuntimePromiseMap.set(versionKey, loadModule());
  }

  return spineRuntimePromiseMap.get(versionKey);
};

const loadLive2DCore = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (!live2dCoreLoadPromise) {
    live2dCoreLoadPromise = Promise.all(PUBLIC_ASSET_PATHS.live2dScripts.map(loadPublicScript)).catch((error) => {
      live2dCoreLoadPromise = null;
      throw error;
    });
  }

  return live2dCoreLoadPromise;
};

const loadLive2DModule = async () => {
  await loadLive2DCore();
  if (!live2dModulePromise) {
    live2dModulePromise = import("pixi-live2d-display-advanced").catch((error) => {
      live2dModulePromise = null;
      throw error;
    });
  }

  return live2dModulePromise;
};

const stopLive2DMotions = (model) => {
  if (!model) return;

  if (typeof model.stopMotions === "function") {
    model.stopMotions();
    return;
  }

  model?.internalModel?.motionManager?.stopAllMotions?.();
};

const disableLive2DBreathing = (model) => {
  if (!model?.internalModel) return;

  if ("eyeBlink" in model.internalModel) {
    model.internalModel.eyeBlink = null;
  }

  if ("breath" in model.internalModel) {
    model.internalModel.breath = null;
  }

  if (typeof model.internalModel.updateNaturalMovements === "function") {
    model.internalModel.updateNaturalMovements = () => {};
  }
};

const patchMaskedTextures = (data, isHeadless, isBodyless) => {
  if ((!isHeadless && !isBodyless) || !Array.isArray(data?.textures)) return;

  const hasTex00 = data.textures.some((texture) => texture.includes("texture_00.png"));
  const hasTex01 = data.textures.some((texture) => texture.includes("texture_01.png"));
  if (!hasTex00 || !hasTex01) return;

  data.textures = data.textures.map((texture) => {
    if (isHeadless && texture.includes("texture_00.png")) return MODEL_MASK_TEXTURE;
    if (isBodyless && texture.includes("texture_01.png")) return MODEL_MASK_TEXTURE;
    return texture;
  });
};

const getLive2DTransform = (scale = DEFAULT_LIVE2D_SCALE, x = 0, y = 0) => {
  const currentScale = scale || DEFAULT_LIVE2D_SCALE;
  const dynamicOffset = ((currentScale - DEFAULT_LIVE2D_SCALE) / 0.05) * -50;
  const baseX = -50 + dynamicOffset;
  const baseY = -25 + dynamicOffset;

  return {
    scale: currentScale,
    x: baseX + x,
    y: baseY + y,
  };
};

const applyLive2DTransform = (instance, config) => {
  const transform = getLive2DTransform(config.scale, config.x || 0, config.y || 0);
  instance.scale.set(transform.scale);
  instance.x = transform.x;
  instance.y = transform.y;
};

const getLive2DModelSize = (instance) => ({
  width: Math.max(instance?.internalModel?.width || instance?.internalModel?.originalWidth || instance?.width || 1, 1),
  height: Math.max(instance?.internalModel?.height || instance?.internalModel?.originalHeight || instance?.height || 1, 1),
});

const applyOnLive2DTransform = (instance, config, canvasSize) => {
  const { width, height } = getLive2DModelSize(instance);
  const fitScale = Math.min((canvasSize * LIVE2D_ON_FIT_PADDING) / width, (canvasSize * LIVE2D_ON_FIT_PADDING) / height);
  const userScale = (config.scale || DEFAULT_LIVE2D_SCALE) / DEFAULT_LIVE2D_SCALE;
  const scale = fitScale * userScale;

  instance.scale.set(scale);
  instance.x = (canvasSize - width * scale) / 2 + (config.x || 0);
  instance.y = (canvasSize - height * scale) / 2 + (config.y || 0);
};

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to decode spine texture"));
    image.src = src;
  });

const fetchJsonAsset = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON asset: ${response.status}`);
  }
  return response.json();
};

const fetchBinaryAsset = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch binary asset: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};

const loadRemoteSpineDescriptor = async (modelId) => {
  const apiBase = getViewerSpineApiBase(modelId);
  return fetchJsonAsset(`${apiBase}buildData.asset`);
};

const createSpineAtlas = async (localModelData) => {
  const imageResources = [];
  const baseTextures = [];

  const atlas = await new Promise((resolve, reject) => {
    const atlasInstance = new TextureAtlas(
      localModelData.atlasText,
      async (pageName, done) => {
        try {
          const imageAsset = localModelData.images?.[pageName];
          const sourceUrl = imageAsset?.dataUrl || imageAsset?.url;
          if (!sourceUrl) {
            done(null);
            return;
          }

          const image = await loadImageElement(sourceUrl);
          imageResources.push(image);
          const baseTexture = PIXI.BaseTexture.from(image);
          baseTextures.push(baseTexture);
          done(baseTexture);
        } catch {
          done(null);
        }
      },
      (loadedAtlas) => {
        if (!loadedAtlas) {
          reject(new Error("Spine atlas or texture load failed"));
          return;
        }
        resolve(loadedAtlas);
      },
    );

    return atlasInstance;
  });

  return {
    atlas,
    cleanup: () => {
      baseTextures.forEach((baseTexture) => {
        safeRun(() => baseTexture.destroy());
      });
      imageResources.length = 0;
    },
  };
};

const createSpineSkeletonData = async (localModelData) => {
  const atlasResult = await createSpineAtlas(localModelData);
  try {
    const skeletonJson =
      localModelData.skeletonJson ||
      (localModelData.skeletonFileType === "json" && localModelData.skeletonUrl
        ? await fetchJsonAsset(localModelData.skeletonUrl)
        : null);
    const skeletonBinary =
      localModelData.skeletonBinary ||
      (localModelData.skeletonFileType === "binary" && localModelData.skeletonUrl
        ? await fetchBinaryAsset(localModelData.skeletonUrl)
        : null);
    const versionKey =
      localModelData.skeletonFileType === "binary"
        ? detectSpineBinaryVersion(skeletonBinary)
        : normalizeSpineVersionKey(skeletonJson?.skeleton?.spine || "");
    const runtimeModule = await getSpineRuntimeModule(versionKey);
    const atlasLoader = new runtimeModule.AtlasAttachmentLoader(atlasResult.atlas);

    if (localModelData.skeletonFileType === "binary") {
      const parser = new runtimeModule.SkeletonBinary(atlasLoader);
      return {
        skeletonData: parser.readSkeletonData(skeletonBinary),
        cleanup: atlasResult.cleanup,
        runtimeModule,
      };
    }

    const parser = new runtimeModule.SkeletonJson(atlasLoader);
    return {
      skeletonData: parser.readSkeletonData(skeletonJson),
      cleanup: atlasResult.cleanup,
      runtimeModule,
    };
  } catch (error) {
    atlasResult.cleanup();
    throw error;
  }
};

const applySpineTransform = (instance, config, canvasSize) => {
  const bounds = instance.__spineBounds;
  if (!bounds) return;

  const userScale = config.scale || 1;
  const effectiveScale = (instance.__spineFitScale || 1) * userScale;
  instance.scale.set(effectiveScale);

  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  instance.x = centerX - (bounds.x + bounds.width / 2) * effectiveScale + (config.x || 0);
  instance.y =
    centerY -
    (bounds.y + bounds.height / 2) * effectiveScale +
    DEFAULT_SPINE_BASE_OFFSET_Y +
    (config.y || 0);
};

const resetSpineModel = (instance) => {
  if (!instance?.state || !instance?.skeleton) return;
  instance.state.clearTracks();
  instance.skeleton.setToSetupPose();
  instance.skeleton.updateWorldTransform();
  instance.update(0);
};

const playSpineAnimation = (instance, animationName, { loop = true } = {}) => {
  if (!instance?.state || !animationName || animationName === "none") {
    resetSpineModel(instance);
    return;
  }

  instance.state.setAnimation(0, animationName, loop);
  instance.update(0);
};

const createSpineInstance = async (config, canvasSize) => {
  const spineModelData =
    config.modelSource === "remote" ? await loadRemoteSpineDescriptor(config.modelId) : config.localModelData;
  const { skeletonData, cleanup, runtimeModule } = await createSpineSkeletonData(spineModelData);
  const instance = new runtimeModule.Spine(skeletonData);
  instance.__viewerType = MODEL_TYPES.SPINE;
  instance.__viewerCleanup = cleanup;
  instance.autoUpdate = true;
  if (spineModelData?.skinName && typeof instance.skeleton?.setSkinByName === "function") {
    instance.skeleton.setSkinByName(spineModelData.skinName);
    instance.skeleton.setSlotsToSetupPose?.();
  }
  instance.update(0);
  const measuredBounds = instance.getLocalBounds();
  const fallbackWidth = Math.max(skeletonData.width || 0, 1);
  const fallbackHeight = Math.max(skeletonData.height || 0, 1);
  instance.__spineBounds =
    measuredBounds.width > 0 && measuredBounds.height > 0
      ? measuredBounds
      : new PIXI.Rectangle(
          skeletonData.x || -(fallbackWidth / 2),
          skeletonData.y || -(fallbackHeight / 2),
          fallbackWidth,
          fallbackHeight,
        );
  const boundWidth = Math.max(instance.__spineBounds.width, 1);
  const boundHeight = Math.max(instance.__spineBounds.height, 1);
  instance.__spineFitScale = Math.min(
    (canvasSize * SPINE_FIT_PADDING) / boundWidth,
    (canvasSize * SPINE_FIT_PADDING) / boundHeight,
  );
  applySpineTransform(instance, config, canvasSize);
  resetSpineModel(instance);

  return {
    instance,
    controlData: toSpineControlModelData(skeletonData),
  };
};

const createLive2DInstance = async (config) => {
  const { Live2DModel } = await loadLive2DModule();
  let data;
  if (config.customModelData || (config.modelSource === "local" && config.localModelData)) {
    data = JSON.parse(JSON.stringify(config.customModelData || config.localModelData));
  } else {
    const modelUrl = getViewerModelApiBase(config.modelId, config.isModified, config.modelProvider);
    const modelPath = `${modelUrl}buildData.asset`;
    const response = await fetch(modelPath);
    if (!response.ok) throw new Error("Fetch failed");
    data = await response.json();
    data.url = modelUrl;
  }

  patchMaskedTextures(data, config.isHeadless, config.isBodyless);

  const instance = await Live2DModel.from(data, {
    autoHitTest: false,
    autoFocus: false,
    breathDepth: 0,
  });
  disableLive2DBreathing(instance);
  instance.__viewerType = MODEL_TYPES.LIVE2D;
  const parameterDefinitions = extractLive2DParameterDefinitions(instance);
  installLive2DParameterOverrideHook(instance);

  return {
    instance,
    controlData: {
      ...toControlModelData(data),
      parameters: parameterDefinitions,
    },
    rawData: data,
  };
};

export const hasRenderableModelSource = (model) => {
  if (!model) return false;
  if (model.modelType === MODEL_TYPES.SPINE) {
    return model.modelSource === "remote" ? Boolean(model.modelId) : Boolean(model.localModelData);
  }

  if (model.modelSource === "local") {
    return Boolean(model.customModelData || model.localModelData);
  }

  return Boolean(model.customModelData || model.modelId);
};

export const shouldReloadViewerModel = (instance, prevConfig, nextConfig) =>
  !instance ||
  prevConfig?.modelType !== nextConfig.modelType ||
  prevConfig?.modelProvider !== nextConfig.modelProvider ||
  prevConfig?.modelSource !== nextConfig.modelSource ||
  prevConfig?.modelId !== nextConfig.modelId ||
  prevConfig?.isModified !== nextConfig.isModified ||
  prevConfig?.reloadKey !== nextConfig.reloadKey ||
  prevConfig?.customModelData !== nextConfig.customModelData ||
  prevConfig?.localModelData !== nextConfig.localModelData ||
  prevConfig?.isHeadless !== nextConfig.isHeadless ||
  prevConfig?.isBodyless !== nextConfig.isBodyless;

export const loadViewerModelInstance = async (config, canvasSize) => {
  if (config.modelType === MODEL_TYPES.SPINE) {
    return createSpineInstance(config, canvasSize);
  }

  return createLive2DInstance(config);
};

export const getViewerModelLive2DParameterValues = (instance) => {
  if (!instance || instance.__viewerType !== MODEL_TYPES.LIVE2D) return null;

  const snapshot = instance.__viewerLastParameterValues || getLive2DParameterValueSnapshot(instance);
  return snapshot && Object.keys(snapshot).length > 0 ? { ...snapshot } : null;
};

export const applyViewerModelTransform = (instance, config, canvasSize) => {
  if (!instance) return;

  if (config.modelType === MODEL_TYPES.SPINE) {
    applySpineTransform(instance, config, canvasSize);
    return;
  }

  if (config.modelProvider === MODEL_PROVIDERS.ON) {
    applyOnLive2DTransform(instance, config, canvasSize);
    return;
  }

  applyLive2DTransform(instance, config);
};

export const applyViewerModelState = (instance, currentConfig, prevConfig) => {
  if (!instance) return;

  if (currentConfig.modelType === MODEL_TYPES.LIVE2D) {
    setLive2DParameterOverrides(instance, currentConfig.live2dParameterValues);
  }

  const motionChanged =
    currentConfig.motion !== prevConfig?.motion ||
    (currentConfig.modelType === MODEL_TYPES.SPINE && currentConfig.motionLoop !== prevConfig?.motionLoop);
  if (motionChanged) {
    safeRun(() => {
      if (currentConfig.modelType === MODEL_TYPES.SPINE) {
        playSpineAnimation(instance, currentConfig.motion, { loop: Boolean(currentConfig.motionLoop) });
        return;
      }

      stopLive2DMotions(instance);
      if (currentConfig.motion && currentConfig.motion !== "none") {
        instance.motion(currentConfig.motion, 0, 3);
      }
    });
  }

  if (currentConfig.modelType === MODEL_TYPES.LIVE2D && currentConfig.expression !== prevConfig?.expression) {
    safeRun(() => instance.expression(currentConfig.expression === "none" ? null : currentConfig.expression));
  }
};

export const playViewerMotion = (instance, motionName, options = {}) => {
  if (!instance) return;

  safeRun(() => {
    if (instance.__viewerType === MODEL_TYPES.SPINE) {
      playSpineAnimation(instance, motionName, { loop: false, ...options });
      return;
    }

    stopLive2DMotions(instance);
    if (motionName && motionName !== "none") {
      instance.motion(motionName, 0, 3);
    }
  });
};

export const resetViewerModel = (instance) => {
  if (!instance) return;

  safeRun(() => {
    if (instance.__viewerType === MODEL_TYPES.SPINE) {
      resetSpineModel(instance);
      return;
    }

    stopLive2DMotions(instance);
    instance.expression?.(null);
  });
};

export const removeViewerModelInstance = (app, instance) => {
  if (!instance || !app) return;

  removeLive2DParameterOverrideHook(instance);

  safeRun(() => {
    app.stage.removeChild(instance);
    instance.destroy({ children: true });
  });

  safeRun(() => {
    instance.__viewerCleanup?.();
  });
};
