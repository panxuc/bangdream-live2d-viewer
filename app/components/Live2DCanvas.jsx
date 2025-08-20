"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useState } from "react";
import * as PIXI from "pixi.js";

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

const Live2DCanvas = forwardRef(function Live2DCanvas({ selectedModel, onModelLoad, selectedExpression, selectedMotion, isDarkMode }, ref) {
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
        const app = new PIXI.Application({
          view: canvasRef.current,
          width: 400,
          height: 400,
          backgroundAlpha: 0,
          antialias: true,
          resolution: 1,
          autoDensity: false,
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
      setLoadingProgress('正在清理上一个模型...');

      if (modelRef.current) {
        appRef.current.stage.removeChild(modelRef.current);
        modelRef.current = null;
      }

      setLoadingProgress('正在获取模型数据...');
      const response = await fetch(modelPath);
      const modelData = await response.json();

      modelData.url = modelUrl;

      setLoadingProgress('正在加载Live2D模型...');
      const model = await live2dDisplayRef.current.Live2DModel.from(modelData, {
        autoInteract: false,
      });
      
      setLoadingProgress('正在配置模型显示...');
      appRef.current.stage.addChild(model);
      model.scale.set(0.25);
      model.x = -50;
      model.y = -25;
      modelRef.current = model;

      if (onModelLoad) {
        onModelLoad(modelData);
      }

      setLoadingProgress('');
    } catch (error) {
      setLoadingProgress('加载失败，请重试');
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
    <div className="flex items-center justify-center">
      <div className="relative group">
        <canvas 
          ref={canvasRef} 
          width="400" 
          height="400" 
          style={{ width: '300px', height: '300px' }}
          className="rounded-xl shadow-inner transition-all duration-300 group-hover:shadow-lg" 
        />
        {(modelLoadingRef.current || loadingProgress) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl animate-fade-in">
            <div className="flex flex-col items-center space-y-3 text-muted-foreground">
              <div className="relative">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-3 border-primary/20 rounded-full"></div>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium block">{loadingProgress || '加载模型中...'}</span>
                <span className="text-xs text-muted-foreground/70 mt-1 block">请稍候</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { Live2DCanvas };
