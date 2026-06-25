"use client";

import { Button } from "@/components/ui/button";
import { SimpleSlider } from "@/src/features/viewer/components/controls";
import { MODEL_TYPES } from "@/src/features/viewer/lib/modelState";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

const formatNumber = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Number.parseFloat(numericValue.toFixed(4));
};

export function Live2DParameterPanel({
  activeModel,
  isBatching,
  live2dParameterValues = {},
  onParameterChange,
  onParameterResetAll,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const parameters = useMemo(
    () => (Array.isArray(activeModel?.modelData?.parameters) ? activeModel.modelData.parameters : []),
    [activeModel?.modelData?.parameters],
  );
  const isLive2D = activeModel?.modelType === MODEL_TYPES.LIVE2D;
  const hasParameters = isLive2D && parameters.length > 0;
  const overrideValues = activeModel?.live2dParameterValues || {};
  const overrideCount = Object.keys(overrideValues).length;

  return (
    <div className="panel-glass p-5 md:p-6 relative overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 pb-1 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 shrink-0 text-[#E5004F]" />
          <span className="truncate text-lg font-bold text-gray-800 dark:text-gray-100">手动调整</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {hasParameters ? (
            <span className="rounded-full bg-[#E5004F]/10 px-2 py-0.5 text-[11px] font-bold text-[#E5004F]">
              {parameters.length}
            </span>
          ) : null}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-black/5 pt-4 dark:border-white/10">
          {hasParameters ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase text-gray-400">
                  {overrideCount > 0 ? `${overrideCount} 个已调整` : "实时值"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onParameterResetAll}
                  disabled={isBatching || overrideCount === 0}
                  className="h-8 rounded-lg border-[#E5004F]/20 bg-white/80 text-xs text-gray-500 hover:border-[#E5004F]/50 hover:bg-[#E5004F]/10 hover:text-[#E5004F] dark:bg-[#2a1d35]/70"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  重置
                </Button>
              </div>

              <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                {parameters.map((parameter) => {
                  const hasOverride = Object.prototype.hasOwnProperty.call(overrideValues, parameter.id);
                  const value = hasOverride
                    ? overrideValues[parameter.id]
                    : live2dParameterValues[parameter.id] ?? parameter.value ?? parameter.defaultValue;

                  return (
                    <SimpleSlider
                      key={parameter.id}
                      label={parameter.id}
                      min={formatNumber(parameter.min)}
                      max={formatNumber(parameter.max)}
                      step={formatNumber(parameter.step || 0.01)}
                      value={formatNumber(value)}
                      onChange={(nextValue) => onParameterChange(parameter.id, nextValue)}
                      disabled={isBatching}
                      defaultValue={formatNumber(parameter.defaultValue)}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[#E5004F]/20 bg-white/50 px-3 py-4 text-center text-sm text-gray-400 dark:bg-white/5">
              暂无可调参数
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
