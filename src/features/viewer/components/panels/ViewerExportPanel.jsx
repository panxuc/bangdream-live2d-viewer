"use client";

import { SaveButton } from "@/src/features/viewer/components/export";
import { Download } from "lucide-react";
import { Live2DParameterPanel } from "./Live2DParameterPanel";

export function ViewerExportPanel({
  activeModel,
  isBatching,
  live2dParameterValues,
  canvasRef,
  backgroundColor,
  setBackgroundColor,
  handleModelReload,
  handleLive2DParameterChange,
  handleLive2DParameterReset,
  handleLive2DParameterResetAll,
  setIsBatching,
}) {
  return (
    <div className="viewer-export-panel space-y-4">
      <div className="panel-glass p-5 md:p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-black/5 dark:border-white/10">
          <Download className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">保存图片</h2>
        </div>
        <div className="space-y-4">
          <div className="pt-2">
            <SaveButton
              modelData={activeModel.modelData}
              selectedModel={activeModel.modelId || activeModel.localModelLabel || activeModel.localModelPath || "local-model"}
              selectedMotion={activeModel.motion}
              selectedExpression={activeModel.expression}
              canvasRef={canvasRef}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={setBackgroundColor}
              onReload={handleModelReload}
              onBatchStatusChange={setIsBatching}
            />
          </div>
        </div>
      </div>
      <Live2DParameterPanel
        activeModel={activeModel}
        isBatching={isBatching}
        live2dParameterValues={live2dParameterValues}
        onParameterChange={handleLive2DParameterChange}
        onParameterReset={handleLive2DParameterReset}
        onParameterResetAll={handleLive2DParameterResetAll}
      />
    </div>
  );
}
