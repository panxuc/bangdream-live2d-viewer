"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useState } from "react";
import * as PIXI from "pixi.js";
import { Loader2, Music } from "lucide-react";

let coreLoadPromise = null;
const loadLive2DCore = () => { if (typeof window === 'undefined') return Promise.resolve(); if (coreLoadPromise) return coreLoadPromise; const scripts = ['/live2d.min.js', '/live2dcubismcore.min.js']; const loadScript = (src) => { return new Promise((resolve, reject) => { if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; } const script = document.createElement('script'); script.src = src; script.async = true; script.onload = resolve; script.onerror = reject; document.head.appendChild(script); }); }; coreLoadPromise = Promise.all(scripts.map(loadScript)).then(() => { }).catch(error => { coreLoadPromise = null; throw error; }); return coreLoadPromise; };

const Live2DCanvas = forwardRef(function Live2DCanvas({
  models = [],
  onModelLoad,
  backgroundColor = 'transparent',
}, ref) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const coreLoadedRef = useRef(false);
  const live2dDisplayRef = useRef(null);
  const modelInstancesRef = useRef({});
  const prevModelsRef = useRef([]);
  const [loadingStates, setLoadingStates] = useState({});

  useImperativeHandle(ref, () => ({
    getApp: () => appRef.current,
    getModels: () => Object.values(modelInstancesRef.current),
    getModel: () => Object.values(modelInstancesRef.current)[0],

    internalPlayMotion: (group) => {
      Object.values(modelInstancesRef.current).forEach(model => {
        if (model) {
          try {
            if (model.internalModel && model.internalModel.motionManager) {
              model.internalModel.motionManager.stopAllMotions();
            }
            model.motion(group, 0, 3);
          } catch (e) {
            console.warn(`Model failed to play motion ${group}:`, e);
          }
        }
      });
    },

    internalReset: () => {
      Object.values(modelInstancesRef.current).forEach(model => {
        if (model) {
          try {
            if (model.internalModel && model.internalModel.motionManager) {
              model.internalModel.motionManager.stopAllMotions();
            }
            model.expression(null);
          } catch (e) { console.error(e); }
        }
      });
    },

    // --- 核心修改：使用 postrender 事件驱动检测 ---
    waitUntilStable: async (signal) => {
      return new Promise((resolve) => {
        if (!appRef.current || !appRef.current.renderer) { resolve(); return; }
        const app = appRef.current;
        const gl = app.renderer.gl;

        let lastPixels = null;
        let stableFramesCount = 0;
        let lastCheckTime = 0;

        // 参数配置
        const CHECK_INTERVAL = 50;      // 每 50ms 采样一次（渲染循环中）
        const STABLE_DURATION = 1500;   // 需要连续稳定 1.5 秒
        const REQUIRED_STABLE_CHECKS = STABLE_DURATION / CHECK_INTERVAL;
        const PIXEL_DIFF_TOLERANCE = 10;
        const SCREEN_CHANGE_TOLERANCE = 0.001; // 0.1% 的像素变化视为静止

        // 检测函数：在渲染循环的 postrender 阶段调用
        const checkHandler = () => {
          if (signal && signal.aborted) {
            cleanup();
            resolve();
            return;
          }

          const now = performance.now();
          if (now - lastCheckTime < CHECK_INTERVAL) return;
          lastCheckTime = now;

          // 此时 Drawing Buffer 是最新的，且包含内容
          const width = gl.drawingBufferWidth;
          const height = gl.drawingBufferHeight;

          // 如果 Buffer 尺寸异常，跳过
          if (width === 0 || height === 0) return;

          const pixelCount = width * height;
          // 注意：readPixels 比较耗时，但在 postrender 中读取是唯一准确且不闪烁的方法
          const currentPixels = new Uint8Array(pixelCount * 4);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, currentPixels);

          if (lastPixels) {
            let diffCount = 0;
            // 降采样步长，提高性能
            const step = 32;

            for (let i = 0; i < currentPixels.length; i += step) {
              // 比较 R, G, B (忽略 Alpha，避免透明背景干扰)
              if (Math.abs(currentPixels[i] - lastPixels[i]) > PIXEL_DIFF_TOLERANCE ||
                Math.abs(currentPixels[i + 1] - lastPixels[i + 1]) > PIXEL_DIFF_TOLERANCE ||
                Math.abs(currentPixels[i + 2] - lastPixels[i + 2]) > PIXEL_DIFF_TOLERANCE) {
                diffCount++;
              }
            }

            // 计算变化率 (注意要除以实际采样的点数)
            const changeRate = diffCount / (currentPixels.length / step);

            if (changeRate < SCREEN_CHANGE_TOLERANCE) {
              stableFramesCount++;
            } else {
              stableFramesCount = 0; // 一旦动了，重置计数
            }

            if (stableFramesCount >= REQUIRED_STABLE_CHECKS) {
              cleanup();
              resolve();
            }
          }

          // 保存当前帧（拷贝是必须的，因为 Uint8Array 是引用）
          lastPixels = new Uint8Array(currentPixels);
        };

        const cleanup = () => {
          app.renderer.off('postrender', checkHandler);
          clearTimeout(safetyTimeout);
          clearTimeout(warmupTimeout);
        };

        // 1. 预热：动作刚触发时，先等待 500ms 确保动作已经开始渲染
        const warmupTimeout = setTimeout(() => {
          // 2. 开始挂载检测钩子
          app.renderer.on('postrender', checkHandler);
        }, 500);

        // 3. 安全兜底：如果 20 秒还没停，强制结束
        const safetyTimeout = setTimeout(() => {
          cleanup();
          resolve();
        }, 20000);
      });
    }
  }));

  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return;
    const init = async () => {
      if (!coreLoadedRef.current) { await loadLive2DCore(); coreLoadedRef.current = true; }
      if (!live2dDisplayRef.current) { const { Live2DModel } = await import('pixi-live2d-display'); live2dDisplayRef.current = { Live2DModel }; }
      if (!appRef.current) {
        const app = new PIXI.Application({
          view: canvasRef.current,
          width: 400,
          height: 400,
          backgroundAlpha: 0,
          antialias: true,
          resolution: 1,
          autoDensity: false,
          resizeTo: null,
          // 必须开启，否则 postrender 后 buffer 可能会被浏览器清空
          preserveDrawingBuffer: true
        });

        app.stage.sortableChildren = true;
        appRef.current = app;
      }
    };
    init();
    return () => { if (appRef.current) appRef.current.destroy(true, true); };
  }, []);

  useEffect(() => {
    if (!appRef.current || !coreLoadedRef.current || !live2dDisplayRef.current) return;

    const prevModels = prevModelsRef.current;
    prevModelsRef.current = models;
    let isCancelled = false;

    const syncModels = async () => {
      const currentIds = new Set(models.map(m => m.id));

      Object.keys(modelInstancesRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          const modelToRemove = modelInstancesRef.current[id];
          if (modelToRemove) {
            try {
              appRef.current.stage.removeChild(modelToRemove);
              modelToRemove.destroy({ children: true });
            } catch (e) { console.error("Error removing model:", e); }
          }
          delete modelInstancesRef.current[id];
          setLoadingStates(prev => { const n = { ...prev }; delete n[id]; return n; });
        }
      });

      for (let i = 0; i < models.length; i++) {
        if (isCancelled) break;

        const config = models[i];
        const { id, modelId, motion, expression, x, y, scale, reloadKey, isModified } = config;

        if (!modelId) continue;

        const prevConfig = prevModels.find(m => m.id === id);
        let instance = modelInstancesRef.current[id];

        const modelPath = isModified ? `/api/charam/${modelId}/buildData.asset` : `/api/chara/${modelId}/buildData.asset`;
        const modelUrl = isModified ? `/api/charam/${modelId}/` : `/api/chara/${modelId}/`;

        const needsReload = !instance ||
          (prevConfig?.modelId !== modelId) ||
          (prevConfig?.isModified !== isModified) ||
          (prevConfig?.reloadKey !== reloadKey);

        // --- 计算基于缩放的动态基准偏移 ---
        const currentScale = scale || 0.25;
        // 规则：0.25为基准，每增加0.05，baseOffset增加-50
        // 公式：(当前缩放 - 0.25) / 0.05 * -50
        const dynamicOffset = ((currentScale - 0.25) / 0.05) * -50;
        const baseX = -50 + dynamicOffset;
        const baseY = -25 + dynamicOffset;

        if (needsReload) {
          try {
            if (instance) {
              appRef.current.stage.removeChild(instance);
              instance.destroy({ children: true });
              delete modelInstancesRef.current[id];
              instance = null;
            }

            setLoadingStates(prev => ({ ...prev, [id]: 'Loading...' }));

            const response = await fetch(modelPath);
            if (!response.ok) throw new Error("Fetch failed");
            const data = await response.json();
            data.url = modelUrl;

            if (isCancelled) return;

            if (modelInstancesRef.current[id]) {
              const existing = modelInstancesRef.current[id];
              appRef.current.stage.removeChild(existing);
              existing.destroy({ children: true });
            }

            const ModelClass = live2dDisplayRef.current.Live2DModel;
            const newModel = await ModelClass.from(data, { autoInteract: false });

            if (isCancelled) {
              newModel.destroy();
              return;
            }

            appRef.current.stage.addChild(newModel);
            modelInstancesRef.current[id] = newModel;
            instance = newModel;

            // 初始化位置和缩放
            instance.scale.set(currentScale);
            instance.x = baseX + (x || 0);
            instance.y = baseY + (y || 0);

            if (onModelLoad) onModelLoad(data);

            setLoadingStates(prev => { const n = { ...prev }; delete n[id]; return n; });
          } catch (e) {
            if (!isCancelled) {
              console.error(`Failed to load model ${id}`, e);
              setLoadingStates(prev => ({ ...prev, [id]: 'Error' }));
            }
          }
        } else {
          if (instance) {
            // 如果缩放发生变化，或者 x/y 发生变化
            // 缩放变化会影响基准坐标 (baseX, baseY)，因此必须更新位置
            if (scale !== prevConfig?.scale) {
              instance.scale.set(currentScale);
              instance.x = baseX + (x || 0);
              instance.y = baseY + (y || 0);
            } else {
              // 如果缩放没变，仅更新偏移
              if (x !== prevConfig?.x) instance.x = baseX + x;
              if (y !== prevConfig?.y) instance.y = baseY + y;
            }
          }
        }

        if (instance) {
          instance.zIndex = i;
        }

        if (!isCancelled && instance) {
          if (motion && motion !== prevConfig?.motion && motion !== "none") {
            try { instance.motion(motion, 0, 3); } catch (e) { console.error(e); }
          }
          if (expression !== prevConfig?.expression) {
            try { instance.expression(expression === "none" ? null : expression); } catch (e) { }
          }
        }
      }
    };

    syncModels();

    return () => { isCancelled = true; };

  }, [models, onModelLoad]);

  const hasLoading = Object.values(loadingStates).some(v => v);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width="400"
          height="400"
          style={{ width: '400px', height: '400px', backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor }}
          className="rounded-xl transition-all duration-300 cursor-grab active:cursor-grabbing"
        />
        {hasLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl animate-fade-in z-20 pointer-events-none">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-[#E5004F] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center"> <Music className="w-4 h-4 text-[#E5004F] animate-bounce" /> </div>
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
