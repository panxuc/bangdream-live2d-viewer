"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useState } from "react";
import * as PIXI from "pixi.js";
import { Loader2, Music } from "lucide-react"; // 引入图标库

let coreLoadPromise = null;

const loadLive2DCore = () => {
  if (typeof window === 'undefined') return Promise.resolve();

  if (coreLoadPromise) return coreLoadPromise;

  const scripts = [
    '/live2d.min.js',
    '/live2dcubismcore.min.js'
  ];

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  coreLoadPromise = Promise.all(scripts.map(loadScript))
    .then(() => {
    })
    .catch(error => {
      coreLoadPromise = null;
      throw error;
    });

  return coreLoadPromise;
};

const Live2DCanvas = forwardRef(function Live2DCanvas({ selectedModel, onModelLoad, selectedExpression, selectedMotion, isDarkMode, backgroundColor = 'transparent' }, ref) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);
  const coreLoadedRef = useRef(false);
  const live2dDisplayRef = useRef(null);
  const modelLoadingRef = useRef(false);
  const [loadingProgress, setLoadingProgress] = useState('');

  useImperativeHandle(ref, () => ({
    getApp: () => appRef.current
  }));

  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return;

    const init = async () => {
      if (!coreLoadedRef.current) {
        await loadLive2DCore();
        coreLoadedRef.current = true;
      }

      if (!live2dDisplayRef.current) {
        const { Live2DModel } = await import('pixi-live2d-display');
        live2dDisplayRef.current = { Live2DModel };
      }

      if (!appRef.current) {
        // 严格保持原有的初始化参数
        const app = new PIXI.Application({
          view: canvasRef.current,
          width: 400,
          height: 400,
          backgroundAlpha: 0, // 保持透明
          antialias: true,
          resolution: 1,      // 保持原有分辨率
          autoDensity: false, // 保持关闭
          resizeTo: null,
        });

        appRef.current = app;
      }
    };

    init();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true);
      }
    };
  }, []);

  const modelPath = useMemo(() => {
    if (!selectedModel) return null;
    return isDarkMode ? `/api/charam/${selectedModel}/buildData.asset` : `/api/chara/${selectedModel}/buildData.asset`;
  }, [selectedModel, isDarkMode]);

  const modelUrl = useMemo(() => {
    if (!selectedModel) return null;
    return isDarkMode ? `/api/charam/${selectedModel}/` : `/api/chara/${selectedModel}/`;
  }, [selectedModel, isDarkMode]);

  const loadModel = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !selectedModel ||
      !appRef.current ||
      !coreLoadedRef.current ||
      !live2dDisplayRef.current ||
      modelLoadingRef.current ||
      !modelPath ||
      !modelUrl
    ) return;

    try {
      modelLoadingRef.current = true;
      setLoadingProgress('Cleaning stage...');

      if (modelRef.current) {
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current = null;
      }

      setLoadingProgress('Downloading data...');
      const response = await fetch(modelPath);
      const modelData = await response.json();

      modelData.url = modelUrl;

      setLoadingProgress('Summoning character...');
      const model = await live2dDisplayRef.current.Live2DModel.from(modelData, {
        autoInteract: false,
      });

      setLoadingProgress('Setting up...');
      appRef.current.stage.addChild(model);

      // 严格保持原有的缩放和位置参数
      model.scale.set(0.25);
      model.x = -50;
      model.y = -25;

      modelRef.current = model;

      if (onModelLoad) {
        onModelLoad(modelData);
      }

      setLoadingProgress('');
    } catch (error) {
      console.error(error);
      setLoadingProgress('Load Failed');
      setTimeout(() => setLoadingProgress(''), 3000);
    } finally {
      modelLoadingRef.current = false;
    }
  }, [selectedModel, modelPath, modelUrl, onModelLoad]);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  const setExpression = useCallback((expression) => {
    if (!modelRef.current || !expression) return;
    try {
      modelRef.current.expression(expression);
    } catch (error) {
    }
  }, []);

  const setMotion = useCallback((motion) => {
    if (!modelRef.current || !motion) return;
    const [group, indexStr] = motion.split("|");
    const index = parseInt(indexStr, 10);
    try {
      modelRef.current.motion(group, index);
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    setExpression(selectedExpression);
  }, [selectedExpression, setExpression]);

  useEffect(() => {
    setMotion(selectedMotion);
  }, [selectedMotion, setMotion]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative group">
        {/* 画布：保持原始尺寸设置，仅添加 cursor-grab 样式 */}
        <canvas
          ref={canvasRef}
          width="400"
          height="400"
          style={{
            width: '300px',
            height: '300px',
            backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor
          }}
          className="rounded-xl transition-all duration-300 cursor-grab active:cursor-grabbing"
        />

        {/* 邦邦风格的加载遮罩 */}
        {(modelLoadingRef.current || loadingProgress) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl animate-fade-in z-20">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {/* 旋转的外圈 - 邦邦粉 */}
                <Loader2 className="w-10 h-10 text-[#E5004F] animate-spin" />
                {/* 中心的音符 - 跳动效果 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-4 h-4 text-[#E5004F] animate-bounce" />
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-[#E5004F] tracking-wider uppercase block">
                  Now Loading
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block px-2 max-w-[150px] truncate">
                  {loadingProgress}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { Live2DCanvas };
