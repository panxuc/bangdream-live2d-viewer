"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Loader2, Music } from "lucide-react";
import { PUBLIC_ASSET_PATHS, getViewerModelApiBase } from "@/src/config/urls";
import { loadPublicScript } from "@/src/lib/loadPublicScript";
import { getBackgroundCanvasStyle } from "@/src/features/viewer/lib/backgroundStyle";

let coreLoadPromise = null;
let audioUnlockPromise = null;
const CANVAS_SIZE = 400;
const DISPLAY_CANVAS_MAX_SIZE = 800;
const DEFAULT_MODEL_SCALE = 0.25;
const MODEL_MASK_TEXTURE = PUBLIC_ASSET_PATHS.modelMaskTexture;
const STABILITY_CHECK_INTERVAL = 50;
const STABILITY_DURATION = 1500;
const STABILITY_REQUIRED_CHECKS = STABILITY_DURATION / STABILITY_CHECK_INTERVAL;
const STABILITY_PIXEL_DIFF_TOLERANCE = 10;
const STABILITY_SCREEN_CHANGE_TOLERANCE = 0.001;
const STABILITY_WARMUP_MS = 500;
const STABILITY_TIMEOUT_MS = 20000;

const loadLive2DCore = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (coreLoadPromise) return coreLoadPromise;

  const scripts = PUBLIC_ASSET_PATHS.live2dScripts;
  coreLoadPromise = Promise.all(scripts.map(loadPublicScript)).catch((error) => {
    coreLoadPromise = null;
    throw error;
  });

  return coreLoadPromise;
};

const resumeAudioContexts = async () => {
  if (typeof window === "undefined") return;
  if (audioUnlockPromise) return audioUnlockPromise;

  audioUnlockPromise = (async () => {
    try {
      const pixiSound = await import("@pixi/sound");
      const context = pixiSound?.sound?.context?.audioContext;
      if (context?.state === "suspended") {
        await context.resume();
      }
    } catch {
      // Ignore audio unlock failures; browser may still block until explicit gesture.
    }

    try {
      const globalContext = window?.PIXI?.sound?.context?.audioContext;
      if (globalContext?.state === "suspended") {
        await globalContext.resume();
      }
    } catch {
      // Ignore global audio context unlock failures.
    }
  })();

  return audioUnlockPromise;
};

const safeRun = (fn) => {
  try {
    fn();
  } catch {
    // Ignore model-side runtime errors to keep canvas alive.
  }
};

const getModelTransform = (scale = DEFAULT_MODEL_SCALE, x = 0, y = 0) => {
  const currentScale = scale || DEFAULT_MODEL_SCALE;
  const dynamicOffset = ((currentScale - DEFAULT_MODEL_SCALE) / 0.05) * -50;
  const baseX = -50 + dynamicOffset;
  const baseY = -25 + dynamicOffset;

  return {
    scale: currentScale,
    x: baseX + x,
    y: baseY + y,
  };
};

const applyModelTransform = (instance, config) => {
  const transform = getModelTransform(config.scale, config.x || 0, config.y || 0);
  instance.scale.set(transform.scale);
  instance.x = transform.x;
  instance.y = transform.y;
};

const shouldReloadModel = (instance, prevConfig, nextConfig) =>
  !instance ||
  prevConfig?.modelSource !== nextConfig.modelSource ||
  prevConfig?.modelId !== nextConfig.modelId ||
  prevConfig?.isModified !== nextConfig.isModified ||
  prevConfig?.reloadKey !== nextConfig.reloadKey ||
  prevConfig?.customModelData !== nextConfig.customModelData ||
  prevConfig?.localModelData !== nextConfig.localModelData ||
  prevConfig?.isHeadless !== nextConfig.isHeadless ||
  prevConfig?.isBodyless !== nextConfig.isBodyless;

const removeModelInstance = (app, instance) => {
  if (!instance || !app) return;

  safeRun(() => {
    app.stage.removeChild(instance);
    instance.destroy({ children: true });
  });
};

const stopModelMotions = (model) => {
  if (!model) return;

  if (typeof model.stopMotions === "function") {
    model.stopMotions();
    return;
  }

  model?.internalModel?.motionManager?.stopAllMotions?.();
};

const disableModelBreathing = (model) => {
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

const waitCanvasStable = async (app, signal) =>
  new Promise((resolve) => {
    if (!app?.renderer) {
      resolve();
      return;
    }

    if (signal?.aborted) {
      resolve();
      return;
    }

    const gl = app.renderer.gl || app.renderer?.context?.gl;
    if (!gl) {
      // Fallback for non-WebGL renderers or unavailable context.
      const fallbackTimer = setTimeout(() => {
        signal?.removeEventListener?.("abort", onAbort);
        resolve();
      }, STABILITY_WARMUP_MS);
      const onAbort = () => {
        clearTimeout(fallbackTimer);
        resolve();
      };
      signal?.addEventListener?.("abort", onAbort, { once: true });
      return;
    }

    let lastPixels = null;
    let stableFramesCount = 0;
    let lastCheckTime = 0;
    let started = false;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const cleanup = () => {
      app.ticker?.remove(checkHandler);
      signal?.removeEventListener?.("abort", onAbort);
      clearTimeout(safetyTimeout);
      clearTimeout(warmupTimeout);
    };

    const onAbort = () => {
      finish();
    };

    const checkHandler = () => {
      if (!started || signal?.aborted) return;

      const now = performance.now();
      if (now - lastCheckTime < STABILITY_CHECK_INTERVAL) return;
      lastCheckTime = now;

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      if (width === 0 || height === 0) return;

      const currentPixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, currentPixels);

      if (lastPixels) {
        let diffCount = 0;
        const step = 32;

        for (let i = 0; i < currentPixels.length; i += step) {
          if (
            Math.abs(currentPixels[i] - lastPixels[i]) > STABILITY_PIXEL_DIFF_TOLERANCE ||
            Math.abs(currentPixels[i + 1] - lastPixels[i + 1]) > STABILITY_PIXEL_DIFF_TOLERANCE ||
            Math.abs(currentPixels[i + 2] - lastPixels[i + 2]) > STABILITY_PIXEL_DIFF_TOLERANCE
          ) {
            diffCount++;
          }
        }

        const changeRate = diffCount / (currentPixels.length / step);
        stableFramesCount = changeRate < STABILITY_SCREEN_CHANGE_TOLERANCE ? stableFramesCount + 1 : 0;

        if (stableFramesCount >= STABILITY_REQUIRED_CHECKS) {
          finish();
        }
      }

      lastPixels = new Uint8Array(currentPixels);
    };

    const warmupTimeout = setTimeout(() => {
      started = true;
    }, STABILITY_WARMUP_MS);

    const safetyTimeout = setTimeout(() => {
      finish();
    }, STABILITY_TIMEOUT_MS);

    signal?.addEventListener?.("abort", onAbort, { once: true });
    app.ticker?.add(checkHandler);
  });

const Live2DCanvas = forwardRef(function Live2DCanvas({
  models = [],
  onModelLoad,
  onSyncComplete,
  backgroundColor = 'transparent',
}, ref) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const coreLoadedRef = useRef(false);
  const live2dDisplayRef = useRef(null);
  const modelInstancesRef = useRef({});
  const prevModelsRef = useRef([]);
  const [appReady, setAppReady] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});

  const setModelLoading = (id, state) => {
    setLoadingStates((prev) => {
      if (!state) {
        const next = { ...prev };
        delete next[id];
        return next;
      }

      return { ...prev, [id]: state };
    });
  };

  useImperativeHandle(ref, () => ({
    getApp: () => appRef.current,
    getModels: () => Object.values(modelInstancesRef.current),
    getModel: () => Object.values(modelInstancesRef.current)[0],
    internalPlayMotion: (group) => {
      void resumeAudioContexts();
      Object.values(modelInstancesRef.current).forEach((model) =>
        safeRun(() => {
          stopModelMotions(model);
          model?.motion(group, 0, 3);
        }),
      );
    },
    internalReset: () => {
      Object.values(modelInstancesRef.current).forEach((model) =>
        safeRun(() => {
          stopModelMotions(model);
          model?.expression(null);
        }),
      );
    },
    waitUntilStable: async (signal) => waitCanvasStable(appRef.current, signal),
  }));

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;

    let cancelled = false;
    const unlockAudio = () => {
      void resumeAudioContexts();
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    const init = async () => {
      if (!coreLoadedRef.current) {
        await loadLive2DCore();
        if (cancelled) return;
        coreLoadedRef.current = true;
      }

      if (!live2dDisplayRef.current) {
        const { Live2DModel } = await import("pixi-live2d-display-advanced");
        if (cancelled) return;

        live2dDisplayRef.current = { Live2DModel };
      }

      if (!appRef.current) {
        const app = new PIXI.Application({
          view: canvasRef.current,
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: false,
          preserveDrawingBuffer: true,
        });
        if (cancelled) {
          app.destroy(true, true);
          return;
        }
        // app.ticker.maxFPS = 30;
        app.stage.sortableChildren = true;
        appRef.current = app;
        setAppReady(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      if (appRef.current) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
      setAppReady(false);
      modelInstancesRef.current = {};
      prevModelsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!appReady || !appRef.current || !coreLoadedRef.current || !live2dDisplayRef.current) return;

    const prevModels = prevModelsRef.current;
    prevModelsRef.current = models;
    let isCancelled = false;

    const syncModels = async () => {
      const loadedModelPayloads = [];
      const reloadedModelIds = [];
      const currentIds = new Set(models.map((model) => model.id));

      Object.keys(modelInstancesRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          removeModelInstance(appRef.current, modelInstancesRef.current[id]);
          delete modelInstancesRef.current[id];
          setModelLoading(id, null);
        }
      });

      for (let i = 0; i < models.length; i++) {
        if (isCancelled) break;

        const currentConfig = models[i];
        const { id, modelId, motion, expression } = currentConfig;
        const prevConfig = prevModels.find((model) => model.id === id);
        const usingLocalSource = currentConfig.modelSource === "local";
        const preferredData = currentConfig.customModelData || (usingLocalSource ? currentConfig.localModelData : null);
        const hasRenderableSource = usingLocalSource ? !!preferredData : !!preferredData || !!modelId;
        let instance = modelInstancesRef.current[id];
        if (!hasRenderableSource) {
          if (instance) {
            removeModelInstance(appRef.current, instance);
            delete modelInstancesRef.current[id];
            setModelLoading(id, null);
          }
          continue;
        }

        const needsReload = shouldReloadModel(instance, prevConfig, currentConfig);

        if (needsReload) {
          try {
            reloadedModelIds.push(id);

            if (instance) {
              removeModelInstance(appRef.current, instance);
              delete modelInstancesRef.current[id];
              instance = null;
            }

            setModelLoading(id, "Loading...");

            const ModelClass = live2dDisplayRef.current.Live2DModel;
            let data;

            if (preferredData) {
              data = JSON.parse(JSON.stringify(preferredData));
            } else {
              const modelUrl = getViewerModelApiBase(currentConfig.modelId, currentConfig.isModified);
              const modelPath = `${modelUrl}buildData.asset`;

              const response = await fetch(modelPath);
              if (!response.ok) throw new Error("Fetch failed");
              data = await response.json();
              data.url = modelUrl;
            }

            if (isCancelled) return;

            patchMaskedTextures(data, currentConfig.isHeadless, currentConfig.isBodyless);

            const newModel = await ModelClass.from(data, {
              autoHitTest: false,
              autoFocus: false,
              breathDepth: 0,
            });
            if (isCancelled) {
              newModel.destroy();
              return;
            }

            safeRun(() => disableModelBreathing(newModel));

            appRef.current.stage.addChild(newModel);
            modelInstancesRef.current[id] = newModel;
            instance = newModel;
            applyModelTransform(instance, currentConfig);

            if (!isCancelled && onModelLoad) {
              loadedModelPayloads.push({ id, data });
            }

            setModelLoading(id, null);
          } catch (error) {
            if (!isCancelled) {
              console.error(`Failed to load model ${id}`, error);
              setModelLoading(id, "Error");
            }
          }
        } else if (instance) {
          if (
            currentConfig.scale !== prevConfig?.scale ||
            currentConfig.x !== prevConfig?.x ||
            currentConfig.y !== prevConfig?.y
          ) {
            applyModelTransform(instance, currentConfig);
          }
        }

        if (instance) instance.zIndex = i;

        if (!isCancelled && instance) {
          if (motion && motion !== prevConfig?.motion && motion !== "none") {
            safeRun(() => instance.motion(motion, 0, 3));
          }

          if (expression !== prevConfig?.expression) {
            safeRun(() => instance.expression(expression === "none" ? null : expression));
          }
        }
      }

      if (!isCancelled && onModelLoad && loadedModelPayloads.length > 0) {
        loadedModelPayloads.forEach(({ id, data }) => {
          onModelLoad(id, data);
        });
      }

      if (!isCancelled && onSyncComplete) {
        onSyncComplete({ reloadedModelIds });
      }
    };
    syncModels();
    return () => { isCancelled = true; };
  }, [appReady, models, onModelLoad, onSyncComplete]);

  const hasLoading = Object.values(loadingStates).some(v => v);
  const canvasBackgroundStyle = getBackgroundCanvasStyle(backgroundColor);

  return (
    <div className="flex items-center justify-center w-full">
      <div className="relative group w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            width: "100%",
            maxWidth: `${DISPLAY_CANVAS_MAX_SIZE}px`,
            height: "auto",
            ...canvasBackgroundStyle,
          }}
          className="rounded-xl transition-all duration-300 cursor-grab active:cursor-grabbing"
        />
        {hasLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl animate-fade-in z-20 pointer-events-none">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-[#E5004F] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-4 h-4 text-[#E5004F] animate-bounce" />
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-[#E5004F] tracking-wider uppercase block">Now Loading</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { Live2DCanvas };
