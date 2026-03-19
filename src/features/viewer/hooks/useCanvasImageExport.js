import { useCallback, useRef } from "react";
import { drawBackgroundToCanvas } from "../lib/backgroundStyle.js";

export function useCanvasImageExport({ canvasRef, backgroundColor, imageSize }) {
  const exportCanvasRef = useRef(null);
  const scaleCanvasRef = useRef(null);
  const downloadLinkRef = useRef(null);

  const captureAndDownload = useCallback(
    async (fileNameOverride) => {
      if (!canvasRef?.current) return;

      const app = canvasRef.current.getApp();
      if (!app || !app.renderer) return;

      const targetSize = Number.parseInt(imageSize, 10);
      if (!Number.isFinite(targetSize) || targetSize <= 0) return;

      const rawCanvas = app.view || app.canvas;
      if (!rawCanvas) return;

      const finalCanvas = exportCanvasRef.current || document.createElement("canvas");
      exportCanvasRef.current = finalCanvas;
      finalCanvas.width = targetSize;
      finalCanvas.height = targetSize;

      const ctx = finalCanvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, targetSize, targetSize);
      drawBackgroundToCanvas(ctx, targetSize, targetSize, backgroundColor);

      const srcW = rawCanvas.width || app.renderer.width || 400;
      const srcH = rawCanvas.height || app.renderer.height || 400;
      if (srcW <= 0 || srcH <= 0) return;

      const drawScaledImage = () => {
        if (targetSize >= srcW || targetSize >= srcH) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(rawCanvas, 0, 0, srcW, srcH, 0, 0, targetSize, targetSize);
          return;
        }

        let scaleCanvas = scaleCanvasRef.current || document.createElement("canvas");
        scaleCanvasRef.current = scaleCanvas;
        let scaleCtx = scaleCanvas.getContext("2d");
        if (!scaleCtx) return;

        scaleCanvas.width = srcW;
        scaleCanvas.height = srcH;
        scaleCtx.imageSmoothingEnabled = true;
        scaleCtx.imageSmoothingQuality = "high";
        scaleCtx.clearRect(0, 0, srcW, srcH);
        scaleCtx.drawImage(rawCanvas, 0, 0);

        let currentW = srcW;
        let currentH = srcH;
        while (currentW * 0.5 > targetSize && currentH * 0.5 > targetSize) {
          const nextW = Math.max(targetSize, Math.floor(currentW * 0.5));
          const nextH = Math.max(targetSize, Math.floor(currentH * 0.5));
          const nextCanvas = document.createElement("canvas");
          nextCanvas.width = nextW;
          nextCanvas.height = nextH;
          const nextCtx = nextCanvas.getContext("2d");
          if (!nextCtx) break;

          nextCtx.imageSmoothingEnabled = true;
          nextCtx.imageSmoothingQuality = "high";
          nextCtx.clearRect(0, 0, nextW, nextH);
          nextCtx.drawImage(scaleCanvas, 0, 0, currentW, currentH, 0, 0, nextW, nextH);

          scaleCanvas = nextCanvas;
          currentW = nextW;
          currentH = nextH;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(scaleCanvas, 0, 0, currentW, currentH, 0, 0, targetSize, targetSize);
      };

      drawScaledImage();

      return new Promise((resolve) => {
        finalCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = downloadLinkRef.current || document.createElement("a");
            downloadLinkRef.current = link;
            link.download = fileNameOverride;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          resolve();
        }, "image/png");
      });
    },
    [backgroundColor, canvasRef, imageSize],
  );

  return {
    captureAndDownload,
  };
}
