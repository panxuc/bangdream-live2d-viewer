"use client";

import { SimpleSlider } from "@/src/features/viewer/components/controls";
import { getTransformDisplayConfigForModel, toActualTransformValue } from "@/src/features/viewer/lib/modelState";
import { Move } from "lucide-react";

export function TransformSection({ activeModel, isBatching, handleTransformChange }) {
  const transformConfig = getTransformDisplayConfigForModel(activeModel);
  const handleDisplayTransformChange = (key, value) => {
    handleTransformChange(key, toActualTransformValue(activeModel, key, value));
  };

  return (
    <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Move className="w-4 h-4 text-[#E5004F]" />
        <span className="text-xs font-bold text-gray-400 uppercase">变换</span>
      </div>
      <SimpleSlider
        label="X 轴偏移"
        min={transformConfig.x.min}
        max={transformConfig.x.max}
        step={transformConfig.x.step}
        value={transformConfig.x.value}
        onChange={(value) => handleDisplayTransformChange("x", value)}
        disabled={isBatching}
        defaultValue={transformConfig.x.defaultValue}
      />
      <SimpleSlider
        label="Y 轴偏移"
        min={transformConfig.y.min}
        max={transformConfig.y.max}
        step={transformConfig.y.step}
        value={transformConfig.y.value}
        onChange={(value) => handleDisplayTransformChange("y", value)}
        disabled={isBatching}
        defaultValue={transformConfig.y.defaultValue}
      />
      <SimpleSlider
        label="缩放"
        min={transformConfig.scale.min}
        max={transformConfig.scale.max}
        step={transformConfig.scale.step}
        value={transformConfig.scale.value}
        onChange={(value) => handleDisplayTransformChange("scale", value)}
        disabled={isBatching}
        defaultValue={transformConfig.scale.defaultValue}
      />
    </div>
  );
}
