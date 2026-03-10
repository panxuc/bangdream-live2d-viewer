"use client";

import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon, Layers, Loader2, StopCircle } from "lucide-react";

export function BatchExportSection({
  isDisabled,
  isBatchDisabled,
  isBatching,
  batchProgress,
  onSave,
  onBatchSave,
  onCancelBatch,
}) {
  return (
    <div className="space-y-3 pt-2">
      <Button
        className={`w-full h-12 rounded-full font-bold text-base tracking-wide shadow-lg transition-all duration-300 transform active:scale-95 ${
          isDisabled || isBatching
            ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none"
            : "bg-gradient-to-r from-[#E5004F] via-[#ff4785] to-[#ff7a5c] hover:shadow-[#E5004F]/40 hover:-translate-y-0.5 text-white"
        }`}
        onClick={onSave}
        disabled={isDisabled || isBatching}
      >
        {isDisabled ? (
          <span className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 opacity-50" />
            选择模型
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            保存图片
          </span>
        )}
      </Button>

      {!isBatching ? (
        <Button
          variant="outline"
          className={`w-full h-11 rounded-full border-dashed border-2 font-medium transition-all ${isBatchDisabled ? "opacity-50 cursor-not-allowed" : "border-[#E5004F]/30 text-[#E5004F] bg-white/55 dark:bg-[#24162f]/55 hover:bg-[#E5004F]/5 hover:border-[#E5004F]"}`}
          onClick={onBatchSave}
          disabled={isBatchDisabled}
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
            <span>{batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0}%</span>
          </div>

          <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E5004F] transition-all duration-500 ease-out"
              style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
            />
          </div>

          <div className="text-[10px] text-center text-muted-foreground truncate px-1">当前: {batchProgress.currentName}</div>

          <Button variant="destructive" size="sm" className="w-full h-8 rounded-lg text-xs" onClick={onCancelBatch}>
            <StopCircle className="w-3 h-3 mr-1.5" />
            停止生成差分
          </Button>
        </div>
      )}
    </div>
  );
}
