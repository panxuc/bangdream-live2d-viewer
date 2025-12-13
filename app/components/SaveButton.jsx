"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";
import { Camera, Download, Info, Image as ImageIcon, Scaling, Palette, Check } from "lucide-react";

const BACKGROUND_OPTIONS = [
  { id: 'transparent', color: 'transparent', label: '透', border: 'border-gray-200' },
  { id: 'white', color: '#ffffff', label: '白', border: 'border-gray-200' },
  // { id: 'pink', color: '#fff0f5', label: '粉', border: 'border-pink-200' }, // 淡粉
  // { id: 'brand', color: '#E5004F', label: '邦', border: 'border-[#E5004F]' }, // 邦邦粉
  { id: 'black', color: '#1a101f', label: '黑', border: 'border-gray-800' }, // 深色
];

const SaveButton = memo(function SaveButton({ modelData, selectedModel, selectedMotion, selectedExpression, canvasRef, backgroundColor, onBackgroundColorChange }) {
  const [imageSize, setImageSize] = useState('200');
  const tempCanvasRef = useRef(null);
  const finalCanvasRef = useRef(null);

  const fileName = useMemo(() => {
    if (!selectedModel) return 'default.png';
    const modelName = selectedModel;
    const motionName = selectedMotion ? selectedMotion.split('|')[0] : '';
    const expressionName = selectedExpression || '';
    const fileNameParts = [modelName];
    if (selectedMotion) fileNameParts.push(motionName);
    if (selectedExpression) fileNameParts.push(expressionName);
    return `${fileNameParts.join('_')}.png`;
  }, [selectedModel, selectedMotion, selectedExpression]);

  useEffect(() => {
    if (!tempCanvasRef.current) {
      tempCanvasRef.current = document.createElement('canvas');
      tempCanvasRef.current.width = 400;
      tempCanvasRef.current.height = 400;
    }
    if (!finalCanvasRef.current) {
      finalCanvasRef.current = document.createElement('canvas');
    }

    return () => {
      tempCanvasRef.current = null;
      finalCanvasRef.current = null;
    };
  }, []);

  const handleSave = useCallback(() => {
    if (!modelData) return;

    const app = canvasRef?.current?.getApp();
    if (!app) return;

    if (!tempCanvasRef.current || !finalCanvasRef.current) return;

    try {
      const base64 = app.renderer.plugins.extract.base64(app.stage);

      const img = new Image();
      img.onload = () => {
        const tempCanvas = tempCanvasRef.current;
        const ctx = tempCanvas.getContext('2d');
        ctx.clearRect(0, 0, 400, 400);

        const finalSize = parseInt(imageSize);
        const finalCanvas = finalCanvasRef.current;
        finalCanvas.width = finalSize;
        finalCanvas.height = finalSize;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.clearRect(0, 0, finalSize, finalSize);

        if (backgroundColor && backgroundColor !== 'transparent') {
          finalCtx.fillStyle = backgroundColor;
          finalCtx.fillRect(0, 0, finalSize, finalSize);
        }

        const x = (img.width - 400) / 2;
        const y = (img.height - 576) / 2;

        ctx.drawImage(img, x, y, 400, 400, 0, 0, 400, 400);

        finalCtx.drawImage(tempCanvas, 0, 0, 400, 400, 0, 0, finalSize, finalSize);

        const link = document.createElement('a');
        link.download = fileName;
        link.href = finalCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = base64;
    } catch (error) {
      console.error("Save failed:", error);
    }
  }, [modelData, canvasRef, fileName, imageSize, backgroundColor]);

  const isDisabled = !modelData || !selectedModel;

  return (
    <div className="space-y-6">
      {/* 1. 背景颜色选择 (新功能) */}
      <div className="space-y-2">
        {/* <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
            <Palette className="w-4 h-4 text-[#E5004F]" />
            <span>背景颜色</span>
         </div> */}
        <div className="flex gap-2 p-1">
          {BACKGROUND_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onBackgroundColorChange(option.color)}
              className={`
                  relative w-8 h-8 rounded-full border shadow-sm transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E5004F]
                  ${option.border}
                  ${backgroundColor === option.color ? 'ring-2 ring-offset-1 ring-[#E5004F] scale-105' : ''}
                `}
              style={{
                backgroundColor: option.color === 'transparent' ? 'transparent' : option.color,
                // 如果是透明，给一个棋盘格背景以便识别
                backgroundImage: option.color === 'transparent' ?
                  'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                backgroundSize: option.color === 'transparent' ? '8px 8px' : 'auto',
                backgroundPosition: option.color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : '0 0'
              }}
              title={option.label}
            >
              {/* 选中时的对钩图标 */}
              {backgroundColor === option.color && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className={`w-4 h-4 ${option.color === '#E5004F' || option.color === '#1a101f' ? 'text-white' : 'text-[#E5004F]'}`} strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 尺寸选择器 (UI微调) */}
      <div className="space-y-2">
        <Select onValueChange={setImageSize} value={imageSize}>
          <SelectTrigger
            className="w-full h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F] transition-all duration-300"
          >
            <div className="flex items-center gap-2.5">
              <Scaling className="w-4 h-4 text-[#E5004F]" />
              <SelectValue placeholder="Resolution" />
            </div>
          </SelectTrigger>

          <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
            <SelectItem value="200" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">
              <span className="font-medium">200px × 200px</span>
              {/* <span className="ml-2 text-xs text-muted-foreground">(Avatar/NGA)</span> */}
            </SelectItem>
            <SelectItem value="400" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">
              <span className="font-medium">400px × 400px</span>
              {/* <span className="ml-2 text-xs text-muted-foreground">(High Res)</span> */}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. 保存按钮 */}
      <div className="space-y-4 pt-2">
        <Button
          className={`
            w-full h-12 rounded-full font-bold text-base tracking-wide shadow-lg transition-all duration-300 transform active:scale-95
            ${isDisabled
              ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-[#E5004F] to-[#ff4785] hover:shadow-[#E5004F]/40 hover:-translate-y-0.5 text-white"
            }
          `}
          onClick={handleSave}
          disabled={isDisabled}
        >
          {isDisabled ? (
            <span className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 opacity-50" />
              等待设置
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              保存图片
            </span>
          )}
        </Button>

        {/* NGA 提示卡片 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-lg p-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            {/* <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">Tip</p> */}
            <p className="text-xs text-yellow-700/80 dark:text-yellow-500/80 leading-relaxed">
              若要用于 NGA 安科，推荐选择 <strong>200px</strong> 尺寸以获得最佳显示效果。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export { SaveButton };
