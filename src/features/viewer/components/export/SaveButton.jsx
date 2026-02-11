"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useCallback, memo, useMemo, useRef } from "react";
import { Camera, Image as ImageIcon, Scaling, Check, Layers, Loader2, StopCircle, Pencil } from "lucide-react";
import * as PIXI from "pixi.js";

const BACKGROUND_OPTIONS = [
  { id: 'transparent', color: 'transparent', label: '透明', border: 'border-gray-200' },
  { id: 'white', color: '#ffffff', label: '白色', border: 'border-gray-200' },
  { id: 'black', color: '#1a101f', label: '黑色', border: 'border-gray-800' },
];

const SaveButton = memo(function SaveButton({
  modelData,
  selectedModel,
  selectedMotion,
  selectedExpression,
  borrowedModelId, // <--- 新增 Prop：借用的模型ID
  canvasRef,
  backgroundColor,
  onBackgroundColorChange,
  onReload,
  onBatchStatusChange
}) {
  const [imageSize, setImageSize] = useState('200');
  const [customName, setCustomName] = useState('');
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentName: '' });
  const abortControllerRef = useRef(null);

  const getFileName = useCallback((motionGroup, expression) => {
    const clean = (str) => str ? str.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '') : '';

    const baseName = customName.trim() ? customName.trim() : selectedModel;

    const parts = [clean(baseName)];

    // if (borrowedModelId) {
    //   parts.push(clean(borrowedModelId));
    // }

    if (motionGroup) parts.push(clean(motionGroup));
    if (expression) parts.push(clean(expression));

    return `${parts.join('_')}.png`;
  }, [customName, selectedModel, borrowedModelId]);

  // 当前预览的文件名
  const currentFileName = useMemo(() => {
    return getFileName(selectedMotion, selectedExpression);
  }, [getFileName, selectedMotion, selectedExpression]);

  const captureAndDownload = async (fileNameOverride) => {
    if (!canvasRef?.current) return;
    const app = canvasRef.current.getApp();
    if (!app || !app.renderer) return;

    const targetSize = parseInt(imageSize);
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetSize;
    finalCanvas.height = targetSize;
    const ctx = finalCanvas.getContext('2d');

    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetSize, targetSize);
    }

    // Snapshot exactly the currently visible canvas viewport.
    const viewportWidth = app.renderer.width || 400;
    const viewportHeight = app.renderer.height || 400;
    const renderTexture = PIXI.RenderTexture.create({
      width: viewportWidth,
      height: viewportHeight,
    });

    try {
      app.renderer.render(app.stage, { renderTexture, clear: true });
      const extractedCanvas = app.renderer.plugins.extract.canvas(renderTexture);
      ctx.drawImage(extractedCanvas, 0, 0, viewportWidth, viewportHeight, 0, 0, targetSize, targetSize);
    } finally {
      renderTexture.destroy(true);
    }

    return new Promise((resolve) => {
      finalCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = fileNameOverride;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        resolve();
      }, 'image/png');
    });
  };

  const handleSave = () => captureAndDownload(currentFileName);

  const handleBatchSave = async () => {
    if (!modelData || !modelData.motions || !canvasRef.current) return;

    setIsBatching(true);
    if (onBatchStatusChange) onBatchStatusChange(true);

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    const motionGroups = Object.keys(modelData.motions);

    const totalSteps = motionGroups.length + 1;
    setBatchProgress({ current: 0, total: totalSteps, currentName: "初始化中..." });

    try {
      if (onReload) onReload();
      await new Promise(r => setTimeout(r, 1000));

      if (signal.aborted) throw new Error("Cancelled");
      setBatchProgress({ current: 1, total: totalSteps, currentName: "标准待机" });

      const idleFileName = getFileName(null, null);
      await captureAndDownload(idleFileName);

      for (let i = 0; i < motionGroups.length; i++) {
        if (signal.aborted) throw new Error("Cancelled");
        const group = motionGroups[i];

        setBatchProgress({ current: i + 2, total: totalSteps, currentName: group });
        canvasRef.current.internalPlayMotion(group);
        await canvasRef.current.waitUntilStable(signal);

        if (signal.aborted) throw new Error("Cancelled");
        const batchFileName = getFileName(group, null);
        await captureAndDownload(batchFileName);
      }
    } catch (error) {
      if (error.message !== "Cancelled") console.error("Batch save error:", error);
    } finally {
      setIsBatching(false);
      if (onBatchStatusChange) onBatchStatusChange(false);
      abortControllerRef.current = null;
      if (canvasRef.current) canvasRef.current.internalReset();
    }
  };

  const cancelBatch = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const isDisabled = !modelData || !selectedModel;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className={`flex gap-2 p-1 transition-opacity ${isBatching ? 'opacity-50 pointer-events-none' : ''}`}>
          {BACKGROUND_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onBackgroundColorChange(option.color)}
              disabled={isBatching}
              className={`relative w-8 h-8 rounded-full border shadow-sm transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E5004F] ${option.border} ${backgroundColor === option.color ? 'ring-2 ring-offset-1 ring-[#E5004F] scale-105' : ''}`}
              style={{ backgroundColor: option.color === 'transparent' ? 'transparent' : option.color, backgroundImage: option.color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none', backgroundSize: option.color === 'transparent' ? '8px 8px' : 'auto', backgroundPosition: option.color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : '0 0' }}
              title={option.label}
            >
              {backgroundColor === option.color && (<span className="absolute inset-0 flex items-center justify-center"> <Check className={`w-4 h-4 ${option.color === '#E5004F' || option.color === '#1a101f' ? 'text-white' : 'text-[#E5004F]'}`} strokeWidth={3} /> </span>)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={selectedModel || "自定义文件名..."}
            disabled={isBatching || isDisabled}
            className="pl-9 h-11 rounded-xl bg-white/90 dark:bg-[#2a1d35]/70 border-[#E5004F]/20 dark:border-[#ff76a7]/25 focus:border-[#E5004F] transition-all"
          />
          <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <Select onValueChange={setImageSize} value={imageSize} disabled={isBatching}>
          <SelectTrigger className="w-full h-11 rounded-xl bg-white/90 dark:bg-[#2a1d35]/70 border-[#E5004F]/20 dark:border-[#ff76a7]/25 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F] transition-all duration-300">
            <div className="flex items-center gap-2.5">
              <Scaling className="w-4 h-4 text-[#E5004F]" />
              <SelectValue placeholder="分辨率" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-[#E5004F]/15 dark:border-[#ff76a7]/25 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
            <SelectItem value="200" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer"> <span className="font-medium">200px × 200px</span> <span className="ml-2 text-xs text-muted-foreground">(NGA)</span> </SelectItem>
            <SelectItem value="400" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer"> <span className="font-medium">400px × 400px</span> </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 pt-2">
        <Button
          className={`w-full h-12 rounded-full font-bold text-base tracking-wide shadow-lg transition-all duration-300 transform active:scale-95 ${isDisabled || isBatching ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-[#E5004F] via-[#ff4785] to-[#ff7a5c] hover:shadow-[#E5004F]/40 hover:-translate-y-0.5 text-white"}`}
          onClick={handleSave}
          disabled={isDisabled || isBatching}
        >
          {isDisabled ? (
            <span className="flex items-center gap-2"> <ImageIcon className="w-5 h-5 opacity-50" /> 选择模型 </span>
          ) : (
            <span className="flex items-center gap-2"> <Camera className="w-5 h-5" /> 保存图片 </span>
          )}
        </Button>

        {!isBatching ? (
          <Button
            variant="outline"
            className={`w-full h-11 rounded-full border-dashed border-2 font-medium transition-all ${isDisabled ? "opacity-50 cursor-not-allowed" : "border-[#E5004F]/30 text-[#E5004F] bg-white/55 dark:bg-[#24162f]/55 hover:bg-[#E5004F]/5 hover:border-[#E5004F]"}`}
            onClick={handleBatchSave}
            disabled={isDisabled}
          >
            <Layers className="w-4 h-4 mr-2" />
            自动生成差分
          </Button>
        ) : (
          <div className="bg-white/50 dark:bg-[#24162f]/60 rounded-xl p-3 border border-[#E5004F]/20 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#E5004F]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>处理中... {batchProgress.current} / {batchProgress.total}</span>
              </div>
              <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-[#E5004F] transition-all duration-500 ease-out" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
            </div>
            <div className="text-[10px] text-center text-muted-foreground truncate px-1">当前: {batchProgress.currentName}</div>
            <Button variant="destructive" size="sm" className="w-full h-8 rounded-lg text-xs" onClick={cancelBatch}> <StopCircle className="w-3 h-3 mr-1.5" /> 停止生成差分 </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export { SaveButton };
