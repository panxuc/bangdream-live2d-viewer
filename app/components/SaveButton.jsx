import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SaveButton({ modelData, selectedModel, selectedMotion, selectedExpression, canvasRef }) {
  const handleSave = () => {
    if (!modelData) {
      console.log("No model data available");
      return;
    }

    const app = canvasRef?.current?.getApp();
    if (!app) {
      console.log("No app instance available");
      return;
    }

    const modelName = selectedModel || 'default';
    const motionName = selectedMotion ? selectedMotion.split('|')[0] : 'default';
    const expressionName = selectedExpression || 'default';

    const fileNameParts = [modelName];
    if (selectedMotion) fileNameParts.push(motionName);
    if (selectedExpression) fileNameParts.push(expressionName);
    const fileName = `${fileNameParts.join('_')}.png`;

    try {
      const base64 = app.renderer.plugins.extract.base64(app.stage);

      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 400;
        const ctx = tempCanvas.getContext('2d');

        const x = (img.width - 400) / 2;
        const y = (img.height - 576) / 2;

        ctx.drawImage(img, x, y, 400, 400, 0, 0, 400, 400);

        const link = document.createElement('a');
        link.download = fileName;
        link.href = tempCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = base64;
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  };

  const handleDownloadModel = async () => {
    if (!selectedModel) {
      console.log("No model selected");
      return;
    }

    try {
      const response = await fetch(`/api/download/${selectedModel}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedModel}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading model:", error);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* <div className="space-y-2">
        <label className="text-sm font-medium">输出图片大小</label>
        <Input
          id="image-size"
          readOnly
          className="w-24"
          placeholder="400×400"
        />
      </div> */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleSave}
        disabled={!modelData || !selectedModel}
      >
        保存图片
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleDownloadModel}
        disabled={!selectedModel}
      >
        下载模型
      </Button>
    </div>
  );
}
