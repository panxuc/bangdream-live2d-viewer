import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { Loader2, Music } from "lucide-react";
import { getBackgroundCanvasStyle } from "../../lib/backgroundStyle.js";
import {
  applyViewerModelState,
  applyViewerModelTransform,
  hasRenderableModelSource,
  loadViewerModelInstance,
  playViewerMotion,
  removeViewerModelInstance,
  resetViewerModel,
  shouldReloadViewerModel,
} from "./viewerModelRuntime.js";

let audioUnlockPromise = null;
const CANVAS_SIZE = 400;
const DISPLAY_CANVAS_MAX_SIZE = 600;
const STABILITY_CHECK_INTERVAL = 50;
const STABILITY_DURATION = 1500;
const STABILITY_REQUIRED_CHECKS = STABILITY_DURATION / STABILITY_CHECK_INTERVAL;
const STABILITY_PIXEL_DIFF_TOLERANCE = 10;
const STABILITY_SCREEN_CHANGE_TOLERANCE = 0.001;
const STABILITY_WARMUP_MS = 500;
const STABILITY_TIMEOUT_MS = 20000;

const resumeAudioContexts = async () => {
  if (typeof window === "undefined") return;
  if (audioUnlockPromise) return audioUnlockPromise;

  audioUnlockPromise = (async () => {
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

const ViewerCanvas = forwardRef(function ViewerCanvas(
  {
    models = [],
    onModelLoad,
    onModelError,
    onSyncComplete,
    backgroundColor = "transparent",
  },
  ref,
) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
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
      Object.values(modelInstancesRef.current).forEach((model) => {
        playViewerMotion(model, group);
      });
    },
    internalReset: () => {
      Object.values(modelInstancesRef.current).forEach((model) => {
        resetViewerModel(model);
      });
    },
    waitUntilStable: async (signal) => waitCanvasStable(appRef.current, signal),
  }));

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current) return;

    window.PIXI = PIXI;

    let cancelled = false;
    const unlockAudio = () => {
      void resumeAudioContexts();
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    const init = async () => {
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

      app.stage.sortableChildren = true;
      appRef.current = app;
      setAppReady(true);
    };

    init();

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      Object.values(modelInstancesRef.current).forEach((instance) => {
        removeViewerModelInstance(appRef.current, instance);
      });
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
    if (!appReady || !appRef.current) return;

    const prevModels = prevModelsRef.current;
    prevModelsRef.current = models;
    let isCancelled = false;

    const syncModels = async () => {
      const loadedModelPayloads = [];
      const reloadedModelIds = [];
      const currentIds = new Set(models.map((model) => model.id));

      Object.keys(modelInstancesRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          removeViewerModelInstance(appRef.current, modelInstancesRef.current[id]);
          delete modelInstancesRef.current[id];
          setModelLoading(id, null);
        }
      });

      for (let i = 0; i < models.length; i++) {
        if (isCancelled) break;

        const currentConfig = models[i];
        const prevConfig = prevModels.find((model) => model.id === currentConfig.id);
        let instance = modelInstancesRef.current[currentConfig.id];

        if (!hasRenderableModelSource(currentConfig)) {
          if (instance) {
            removeViewerModelInstance(appRef.current, instance);
            delete modelInstancesRef.current[currentConfig.id];
            setModelLoading(currentConfig.id, null);
          }
          continue;
        }

        const needsReload = shouldReloadViewerModel(instance, prevConfig, currentConfig);
        if (needsReload) {
          try {
            reloadedModelIds.push(currentConfig.id);
            if (instance) {
              removeViewerModelInstance(appRef.current, instance);
              delete modelInstancesRef.current[currentConfig.id];
              instance = null;
            }

            setModelLoading(currentConfig.id, "Loading...");
            const loadResult = await loadViewerModelInstance(currentConfig, CANVAS_SIZE);
            if (isCancelled) {
              removeViewerModelInstance(appRef.current, loadResult.instance);
              return;
            }

            appRef.current.stage.addChild(loadResult.instance);
            modelInstancesRef.current[currentConfig.id] = loadResult.instance;
            instance = loadResult.instance;
            applyViewerModelTransform(instance, currentConfig, CANVAS_SIZE);

            const payload = loadResult.controlData ? { controlData: loadResult.controlData } : loadResult.rawData;
            if (payload && onModelLoad) {
              loadedModelPayloads.push({ id: currentConfig.id, payload });
            }

            setModelLoading(currentConfig.id, null);
          } catch (error) {
            if (!isCancelled) {
              console.error(`Failed to load model ${currentConfig.id}`, error);
              setModelLoading(currentConfig.id, "Error");
              onModelError?.(currentConfig.id, error);
            }
          }
        } else if (instance) {
          if (
            currentConfig.scale !== prevConfig?.scale ||
            currentConfig.x !== prevConfig?.x ||
            currentConfig.y !== prevConfig?.y
          ) {
            applyViewerModelTransform(instance, currentConfig, CANVAS_SIZE);
          }
        }

        if (instance) {
          instance.zIndex = i;
          applyViewerModelState(instance, currentConfig, needsReload ? null : prevConfig);
        }
      }

      if (!isCancelled && onModelLoad && loadedModelPayloads.length > 0) {
        loadedModelPayloads.forEach(({ id, payload }) => {
          onModelLoad(id, payload);
        });
      }

      if (!isCancelled && onSyncComplete) {
        onSyncComplete({ reloadedModelIds });
      }
    };

    syncModels();
    return () => {
      isCancelled = true;
    };
  }, [appReady, models, onModelError, onModelLoad, onSyncComplete]);

  const hasLoading = Object.values(loadingStates).some((state) => state === "Loading...");
  const canvasBackgroundStyle = getBackgroundCanvasStyle(backgroundColor);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative group w-full h-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: `${DISPLAY_CANVAS_MAX_SIZE}px`,
            ...canvasBackgroundStyle,
          }}
          className="w-full h-full rounded-xl transition-all duration-300 cursor-grab active:cursor-grabbing"
        />
        {hasLoading ? (
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
        ) : null}
      </div>
    </div>
  );
});

export { ViewerCanvas };
