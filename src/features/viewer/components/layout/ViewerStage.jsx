"use client";

import { ViewerCanvas } from "@/src/features/viewer/components/canvas";

export function ViewerStage({
  models,
  canvasRef,
  backgroundColor,
  onModelLoad,
  onModelError,
  onSyncComplete,
  onLive2DParameterSnapshot,
}) {
  const activeCount = models.filter((model) => {
    if (model.modelSource === "local") {
      return !!model.localModelData;
    }
    return !!model.modelId || !!model.customModelData;
  }).length;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full">
        <div className="relative panel-glass overflow-hidden">
          <div className="h-9 bg-white/70 dark:bg-[#26222d] flex items-center px-4 justify-between border-b border-black/5 dark:border-white/10">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E5004F]/75" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/75" />
              <div className="w-2 h-2 rounded-full bg-blue-400/75" />
            </div>
            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-300">
              当前激活 {activeCount} 个模型
            </div>
          </div>
          <div className="relative aspect-square bg-white/40 dark:bg-[#1b1821]">
            <ViewerCanvas
              ref={canvasRef}
              models={models}
              onModelLoad={onModelLoad}
              onModelError={onModelError}
              onSyncComplete={onSyncComplete}
              onLive2DParameterSnapshot={onLive2DParameterSnapshot}
              backgroundColor={backgroundColor}
            />
            {!activeCount && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-300 pointer-events-none">
                <p className="text-sm font-bold tracking-wide">选择一个资源开始舞台预览</p>
                <p className="text-xs opacity-70 mt-1">在左侧面板添加你的第一个 Live2D 或 Spine 图层。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
