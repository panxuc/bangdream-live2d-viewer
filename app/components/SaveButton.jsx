"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useCallback, memo, useMemo, useRef } from "react";
import { Camera, Info, Image as ImageIcon, Scaling, Palette, Check, Layers, Loader2, StopCircle } from "lucide-react";
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
  canvasRef,
  backgroundColor,       
  onBackgroundColorChange,
  onReload,
  onBatchStatusChange
}) {
  const [imageSize, setImageSize] = useState('200');
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentName: '' });
  const abortControllerRef = useRef(null);

  const getFileName = (modelName, motionGroup, expression) => {
    const clean = (str) => str ? str.replace(/[^a-zA-Z0-9_-]/g, '') : '';
    const parts = [clean(modelName)];
    if (motionGroup) parts.push(clean(motionGroup));
    if (expression) parts.push(clean(expression));
    return `${parts.join('_')}.png`;
  };

  const fileName = useMemo(() => {
    return getFileName(selectedModel, selectedMotion, selectedExpression);
  }, [selectedModel, selectedMotion, selectedExpression]);

  const captureAndDownload = async (customFileName) => {
    if (!canvasRef?.current) return;
    const app = canvasRef.current.getApp();
    if (!app || !app.renderer) return;

    const targetSize = parseInt(imageSize);
    const renderTexture = PIXI.RenderTexture.create({ width: 400, height: 400, resolution: 1 });
    app.renderer.render(app.stage, renderTexture);
    const rawCanvas = app.renderer.plugins.extract.canvas(renderTexture);
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetSize;
    finalCanvas.height = targetSize;
    const ctx = finalCanvas.getContext('2d');
    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, targetSize, targetSize);
    }
    ctx.drawImage(rawCanvas, 0, 0, 400, 400, 0, 0, targetSize, targetSize);
    renderTexture.destroy(true);

    return new Promise((resolve) => {
      finalCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = customFileName || fileName;
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

  const handleSave = () => captureAndDownload(fileName);

  const handleBatchSave = async () => {
    if (!modelData || !modelData.motions || !canvasRef.current) return;
    
    setIsBatching(true);
    if (onBatchStatusChange) onBatchStatusChange(true);

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    const motionGroups = Object.keys(modelData.motions);

    const totalSteps = motionGroups.length + 1;
    setBatchProgress({ current: 0, total: totalSteps, currentName: 'Initializing...' });

    try {
      if (onReload) onReload();
      await new Promise(r => setTimeout(r, 1000));

      // 1. 保存 Idle
      if (signal.aborted) throw new Error("Cancelled");
      setBatchProgress({ current: 1, total: totalSteps, currentName: 'null' });
      
      const idleFileName = getFileName(selectedModel, null, null);
      await captureAndDownload(idleFileName);

      // 2. 循环保存动作
      for (let i = 0; i < motionGroups.length; i++) {
        if (signal.aborted) throw new Error("Cancelled");

        const group = motionGroups[i];
        
        setBatchProgress({ 
          current: i + 2, 
          total: totalSteps, 
          currentName: group 
        });

        // 播放动作
        canvasRef.current.internalPlayMotion(group);

        // --- 核心修改：使用智能等待代替固定 10s ---
        await canvasRef.current.waitUntilStable(signal);
        // ----------------------------------------

        if (signal.aborted) throw new Error("Cancelled");

        const batchFileName = getFileName(selectedModel, group, null);
        await captureAndDownload(batchFileName);
      }
    } catch (error) {
      if (error.message !== "Cancelled") {
        console.error("Batch save error:", error);
      }
    } finally {
      setIsBatching(false);
      if (onBatchStatusChange) onBatchStatusChange(false);
      abortControllerRef.current = null;
      if (canvasRef.current) canvasRef.current.internalReset();
    }
  };

  const cancelBatch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const isDisabled = !modelData || !selectedModel;

  return (
    <div className="space-y-5">
      {/* 1. 背景颜色选择 */}
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
                {backgroundColor === option.color && ( <span className="absolute inset-0 flex items-center justify-center"> <Check className={`w-4 h-4 ${option.color === '#E5004F' || option.color === '#1a101f' ? 'text-white' : 'text-[#E5004F]'}`} strokeWidth={3} /> </span> )}
              </button>
            ))}
         </div>
      </div>

      {/* 2. 尺寸选择器 */}
      <div className="space-y-2">
        <Select onValueChange={setImageSize} value={imageSize} disabled={isBatching}>
          <SelectTrigger className="w-full h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F] transition-all duration-300">
            <div className="flex items-center gap-2.5">
              <Scaling className="w-4 h-4 text-[#E5004F]" />
              <SelectValue placeholder="Resolution" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
            <SelectItem value="200" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer"> <span className="font-medium">200px × 200px</span> <span className="ml-2 text-xs text-muted-foreground">(NGA)</span> </SelectItem>
            <SelectItem value="400" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer"> <span className="font-medium">400px × 400px</span> </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* 3. 操作按钮区 */}
      <div className="space-y-3 pt-2">
        <Button
          className={`w-full h-12 rounded-full font-bold text-base tracking-wide shadow-lg transition-all duration-300 transform active:scale-95 ${isDisabled || isBatching ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-[#E5004F] to-[#ff4785] hover:shadow-[#E5004F]/40 hover:-translate-y-0.5 text-white"}`}
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
            className={`w-full h-11 rounded-full border-dashed border-2 font-medium transition-all ${isDisabled ? "opacity-50 cursor-not-allowed" : "border-[#E5004F]/30 text-[#E5004F] hover:bg-[#E5004F]/5 hover:border-[#E5004F]"}`}
            onClick={handleBatchSave}
            disabled={isDisabled}
          >
             <Layers className="w-4 h-4 mr-2" />
             自动生成差分
          </Button>
        ) : (
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-[#E5004F]/20 space-y-3 animate-in fade-in slide-in-from-top-2">
             <div className="flex items-center justify-between text-xs font-bold text-[#E5004F]">
                <div className="flex items-center gap-2">
                   <Loader2 className="w-3 h-3 animate-spin" />
                   <span>Processing... {batchProgress.current} / {batchProgress.total}</span>
                </div>
                <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
             </div>
             <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#E5004F] transition-all duration-500 ease-out" 
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                ></div>
             </div>
             <div className="text-[10px] text-center text-muted-foreground truncate px-1">
                当前动作: {batchProgress.currentName}
             </div>
             
             <Button 
               variant="destructive" 
               size="sm" 
               className="w-full h-8 rounded-lg text-xs"
               onClick={cancelBatch}
             >
               <StopCircle className="w-3 h-3 mr-1.5" />
               停止生成差分
             </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export { SaveButton };
