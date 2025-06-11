"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as PIXI from "pixi.js";

const loadLive2DCore = async () => {
  if (typeof window === 'undefined') return;

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

  try {
    await Promise.all(scripts.map(loadScript));
    console.log('Live2D core libraries loaded');
  } catch (error) {
    console.error('Error loading Live2D core libraries:', error);
  }
};

const Live2DCanvas = forwardRef(function Live2DCanvas({ selectedModel, onModelLoad, selectedExpression, selectedMotion, isDarkMode }, ref) {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);
  const coreLoadedRef = useRef(false);
  const live2dDisplayRef = useRef(null);
  const modelLoadingRef = useRef(false);

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

      const app = new PIXI.Application({
        view: canvasRef.current,
        width: 400,
        height: 400,
        backgroundAlpha: 0,
        antialias: true,
      });

      appRef.current = app;
    };

    init();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true);
      }
    };
  }, []);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !selectedModel ||
      !appRef.current ||
      !coreLoadedRef.current ||
      !live2dDisplayRef.current ||
      modelLoadingRef.current
    ) return;

    const loadModel = async () => {
      try {
        modelLoadingRef.current = true;

        if (modelRef.current) {
          appRef.current.stage.removeChild(modelRef.current);
          modelRef.current = null;
        }

        const modelPath = isDarkMode ? `/api/charam/${selectedModel}/buildData.asset` : `/api/chara/${selectedModel}/buildData.asset`;
        const response = await fetch(modelPath);
        const modelData = await response.json();

        modelData.url = isDarkMode ? `/api/charam/${selectedModel}/` : `/api/chara/${selectedModel}/`;

        const model = await live2dDisplayRef.current.Live2DModel.from(modelData, {
          autoInteract: false,
        });
        appRef.current.stage.addChild(model);
        model.scale.set(0.25);
        model.x = -50;
        model.y = -25;
        modelRef.current = model;

        if (onModelLoad) {
          onModelLoad(modelData);
        }

        console.log("Model loaded:", modelData);
      } catch (error) {
        console.error("Error loading model:", error);
      } finally {
        modelLoadingRef.current = false;
      }
    };

    loadModel();
  }, [selectedModel]);

  useEffect(() => {
    if (!modelRef.current || !selectedExpression) return;

    try {
      modelRef.current.expression(selectedExpression);
    } catch (error) {
      console.error("Error setting expression:", error);
    }
  }, [selectedExpression]);

  useEffect(() => {
    if (!modelRef.current || !selectedMotion) return;
    const [group, indexStr] = selectedMotion.split("|");
    const index = parseInt(indexStr, 10);
    try {
      modelRef.current.motion(group, index);
    } catch (error) {
      console.error("Error setting motion:", error);
    }
  }, [selectedMotion]);

  return (
    <div className="flex items-center justify-center">
      <canvas ref={canvasRef} width="400" height="400" className="border rounded" />
    </div>
  );
});

export { Live2DCanvas };
