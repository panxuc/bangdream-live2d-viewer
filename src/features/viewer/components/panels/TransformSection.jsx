"use client";

import { SimpleSlider } from "@/src/features/viewer/components/controls";
import { Move } from "lucide-react";

export function TransformSection({ activeModel, isBatching, handleTransformChange }) {
  return (
    <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Move className="w-4 h-4 text-[#E5004F]" />
        <span className="text-xs font-bold text-gray-400 uppercase">变换</span>
      </div>
      <SimpleSlider label="X 轴偏移" min={-400} max={400} step={5} value={activeModel.x} onChange={(value) => handleTransformChange("x", value)} disabled={isBatching} defaultValue={0} />
      <SimpleSlider label="Y 轴偏移" min={-400} max={400} step={5} value={activeModel.y} onChange={(value) => handleTransformChange("y", value)} disabled={isBatching} defaultValue={0} />
      <SimpleSlider label="缩放" min={0.1} max={0.7} step={0.05} value={activeModel.scale} onChange={(value) => handleTransformChange("scale", value)} disabled={isBatching} defaultValue={0.25} />
    </div>
  );
}
