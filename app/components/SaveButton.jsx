import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useCallback, memo, useMemo, useRef, useEffect } from "react";

const SaveButton = memo(function SaveButton({ modelData, selectedModel, selectedMotion, selectedExpression, canvasRef }) {
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
    if (!modelData) {
      return;
    }

    const app = canvasRef?.current?.getApp();
    if (!app) {
      return;
    }

    if (!tempCanvasRef.current || !finalCanvasRef.current) {
      return;
    }

    try {
      const base64 = app.renderer.plugins.extract.base64(app.stage);

      const img = new Image();
      img.onload = () => {
        const tempCanvas = tempCanvasRef.current;
        const ctx = tempCanvas.getContext('2d');
        ctx.clearRect(0, 0, 400, 400);

        const x = (img.width - 400) / 2;
        const y = (img.height - 576) / 2;

        ctx.drawImage(img, x, y, 400, 400, 0, 0, 400, 400);

        const finalSize = parseInt(imageSize);
        const finalCanvas = finalCanvasRef.current;
        finalCanvas.width = finalSize;
        finalCanvas.height = finalSize;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.clearRect(0, 0, finalSize, finalSize);

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
    }
  }, [modelData, canvasRef, fileName, imageSize]);

  // const handleDownloadModel = async () => {
  //   if (!selectedModel) {
  //     console.log("No model selected");
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`/api/download/${selectedModel}`);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = `${selectedModel}.zip`;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Error downloading model:", error);
  //   }
  // };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground/90">输出大小</label>
        <Select onValueChange={setImageSize} value={imageSize}>
          <SelectTrigger className="w-full bg-background hover:bg-accent transition-colors">
            <SelectValue placeholder="选择输出大小" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="200">200px × 200px</SelectItem>
            <SelectItem value="400">400px × 400px</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3">
        <Button
          className="w-full bg-[#db024d] hover:bg-[#c40243] text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!modelData || !selectedModel}
        >
          {!modelData || !selectedModel ? '请选择模型' : '保存图片'}
        </Button>
        
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>💡 若要用于NGA安科，推荐200px × 200px</p>
        </div>
      </div>
    </div>
  );
});

export { SaveButton };
