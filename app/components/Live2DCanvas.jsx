"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useState } from "react";
import * as PIXI from "pixi.js";
import { Loader2, Music } from "lucide-react";

// ... loadLive2DCore 保持不变 ...
let coreLoadPromise = null;
const loadLive2DCore = () => { if (typeof window === 'undefined') return Promise.resolve(); if (coreLoadPromise) return coreLoadPromise; const scripts = ['/live2d.min.js', '/live2dcubismcore.min.js']; const loadScript = (src) => { return new Promise((resolve, reject) => { if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; } const script = document.createElement('script'); script.src = src; script.async = true; script.onload = resolve; script.onerror = reject; document.head.appendChild(script); }); }; coreLoadPromise = Promise.all(scripts.map(loadScript)).then(() => {}).catch(error => { coreLoadPromise = null; throw error; }); return coreLoadPromise; };

const Live2DCanvas = forwardRef(function Live2DCanvas({ 
  selectedModel, 
  onModelLoad, 
  selectedExpression, 
  selectedMotion,
  isDarkMode,
  backgroundColor = 'transparent',
  reloadKey = 0
}, ref) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);
  const coreLoadedRef = useRef(false);
  const live2dDisplayRef = useRef(null);
  const modelLoadingRef = useRef(false);
  const [loadingProgress, setLoadingProgress] = useState('');

  useImperativeHandle(ref, () => ({
    getApp: () => appRef.current,
    getModel: () => modelRef.current,
    
    internalPlayMotion: (group) => {
      if (modelRef.current) {
        try {
          modelRef.current.internalModel.motionManager.stopAllMotions();
          modelRef.current.motion(group, 0, 3); 
        } catch (e) { console.error(e); }
      }
    },
    internalReset: () => {
      if (modelRef.current) {
        try {
          modelRef.current.internalModel.motionManager.stopAllMotions();
          modelRef.current.expression(null);
        } catch (e) { console.error(e); }
      }
    },
    
    // --- 升级版：智能画面检测 ---
    waitUntilStable: async (signal) => {
      return new Promise((resolve) => {
        if (!appRef.current || !appRef.current.renderer) { resolve(); return; }

        const app = appRef.current;
        const width = app.renderer.width;
        const height = app.renderer.height;
        const totalPixels = width * height;
        
        let lastPixels = null;
        let stableFramesCount = 0;
        
        // 配置参数
        const CHECK_INTERVAL = 100;     // 每 100ms 采样一次
        const STABLE_DURATION = 1500;   // 需要连续稳定 1.5秒 (等待头发完全停下)
        const REQUIRED_STABLE_CHECKS = STABLE_DURATION / CHECK_INTERVAL;
        
        // 阈值设置
        const PIXEL_DIFF_TOLERANCE = 15; // 单个像素颜色值差异 < 15 视为相同 (忽略渲染噪点)
        const SCREEN_CHANGE_TOLERANCE = 0.0001; // 允许 0.1% 的像素变化 (忽略呼吸动作/眨眼)

        // 强制延时：动作开始的前 0.5 秒不进行检测，确保动作已经开始播放
        const warmupTimeout = setTimeout(() => {
          
          const interval = setInterval(() => {
            if (signal && signal.aborted) {
              clearInterval(interval);
              clearTimeout(safetyTimeout);
              resolve();
              return;
            }

            // 1. 获取当前画面的像素数据 (Uint8Array)
            // extract.pixels 比 toDataURL 快得多，且是原始数据
            const currentPixels = app.renderer.plugins.extract.pixels(app.stage);

            if (lastPixels) {
              let diffCount = 0;
              // 为了性能，我们不需要检查每一个像素，每隔 4 个像素检查一次 (步长为4的倍数，因为RGBA是4字节)
              // 同时也作为一种降采样
              const step = 4 * 4; // Check every 4th pixel
              
              for (let i = 0; i < currentPixels.length; i += step) {
                // 比较 R, G, B (忽略 Alpha)
                const rDiff = Math.abs(currentPixels[i] - lastPixels[i]);
                const gDiff = Math.abs(currentPixels[i+1] - lastPixels[i+1]);
                const bDiff = Math.abs(currentPixels[i+2] - lastPixels[i+2]);
                
                // 如果任意通道差异超过容差，视为该像素发生了变化
                if (rDiff > PIXEL_DIFF_TOLERANCE || gDiff > PIXEL_DIFF_TOLERANCE || bDiff > PIXEL_DIFF_TOLERANCE) {
                  diffCount++;
                }
              }

              // 计算变化率 (因为我们降采样了，所以分母也要除以步长因子)
              const sampledTotalPixels = currentPixels.length / step;
              const changeRate = diffCount / sampledTotalPixels;

              // 调试日志 (可选，用于调整阈值)
              // console.log(`Change Rate: ${(changeRate * 100).toFixed(4)}%`);

              // 2. 判断是否稳定
              // 如果变化率低于阈值 (即只有呼吸/噪点)，则认为处于"静止"状态
              if (changeRate < SCREEN_CHANGE_TOLERANCE) {
                stableFramesCount++;
              } else {
                // 如果发现大幅度动作，重置计数器
                stableFramesCount = 0;
              }

              // 3. 连续 N 次检测都稳定，则结束
              if (stableFramesCount >= REQUIRED_STABLE_CHECKS) {
                clearInterval(interval);
                clearTimeout(safetyTimeout);
                resolve();
                return;
              }
            }

            // 保存当前帧用于下次对比
            // 注意：Uint8Array 是引用类型，需要拷贝，否则下次对比的是同一个数组
            lastPixels = new Uint8Array(currentPixels);

          }, CHECK_INTERVAL);

          // 安全超时：15秒后强制结束
          const safetyTimeout = setTimeout(() => {
            clearInterval(interval);
            resolve();
          }, 15000);

        }, 500); // 预热 500ms
      });
    }
    // ----------------------------
  }));

  // ... useEffect, loadModel 等后续代码保持不变 ...
  useEffect(() => { if (typeof window === 'undefined' || !canvasRef.current) return; const init = async () => { if (!coreLoadedRef.current) { await loadLive2DCore(); coreLoadedRef.current = true; } if (!live2dDisplayRef.current) { const { Live2DModel } = await import('pixi-live2d-display'); live2dDisplayRef.current = { Live2DModel }; } if (!appRef.current) { const app = new PIXI.Application({ view: canvasRef.current, width: 400, height: 400, backgroundAlpha: 0, antialias: true, resolution: 1, autoDensity: false, resizeTo: null, }); appRef.current = app; } }; init(); return () => { if (appRef.current) appRef.current.destroy(true, true); }; }, []);

  const modelPath = useMemo(() => { if (!selectedModel) return null; return isDarkMode ? `/api/charam/${selectedModel}/buildData.asset` : `/api/chara/${selectedModel}/buildData.asset`; }, [selectedModel, isDarkMode]);
  const modelUrl = useMemo(() => { if (!selectedModel) return null; return isDarkMode ? `/api/charam/${selectedModel}/` : `/api/chara/${selectedModel}/`; }, [selectedModel, isDarkMode]);

  const loadModel = useCallback(async () => {
    if (typeof window === 'undefined' || !selectedModel || !appRef.current || !coreLoadedRef.current || !live2dDisplayRef.current || modelLoadingRef.current || !modelPath || !modelUrl) return;
    try {
      modelLoadingRef.current = true;
      setLoadingProgress('Cleaning stage...');
      if (modelRef.current) { appRef.current.stage.removeChild(modelRef.current); modelRef.current = null; }
      setLoadingProgress('Downloading data...');
      const response = await fetch(modelPath);
      const modelData = await response.json();
      modelData.url = modelUrl;
      setLoadingProgress('Summoning character...');
      const model = await live2dDisplayRef.current.Live2DModel.from(modelData, { autoInteract: false });
      setLoadingProgress('Setting up...');
      appRef.current.stage.addChild(model);
      model.scale.set(0.25);
      model.x = -50;
      model.y = -25;
      modelRef.current = model;
      if (onModelLoad) onModelLoad(modelData);
      setLoadingProgress('');
    } catch (error) { console.error(error); setLoadingProgress('Load Failed'); setTimeout(() => setLoadingProgress(''), 3000); } finally { modelLoadingRef.current = false; }
  }, [selectedModel, modelPath, modelUrl, onModelLoad, reloadKey]);

  useEffect(() => { loadModel(); }, [loadModel]);

  const setExpression = useCallback((expression) => { if (!modelRef.current || !expression) return; try { modelRef.current.expression(expression); } catch (error) {} }, []);
  const setMotion = useCallback((motionGroup) => { if (!modelRef.current || !motionGroup || motionGroup === "none") return; try { modelRef.current.motion(motionGroup, 0, 3); } catch (error) { console.error(error); } }, []);

  useEffect(() => { setExpression(selectedExpression); }, [selectedExpression, setExpression]);
  useEffect(() => { setMotion(selectedMotion); }, [selectedMotion, setMotion]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative group">
        <canvas ref={canvasRef} width="400" height="400" style={{ width: '400px', height: '400px', backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor }} className="rounded-xl transition-all duration-300 cursor-grab active:cursor-grabbing" />
        {(modelLoadingRef.current || loadingProgress) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl animate-fade-in z-20">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-[#E5004F] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center"> <Music className="w-4 h-4 text-[#E5004F] animate-bounce" /> </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-[#E5004F] tracking-wider uppercase block">Now Loading</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block px-2 max-w-[150px] truncate">{loadingProgress}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { Live2DCanvas };
