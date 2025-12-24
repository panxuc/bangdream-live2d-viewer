"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Clapperboard, Shuffle } from "lucide-react";
import { CharacterSelect } from "./CharacterSelect";
import { ModelSelect } from "./ModelSelect";

export const MotionSelect = ({ modelData, onSelect, value, disabled, onMotionOverride }) => {
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [sourceCharId, setSourceCharId] = useState(null);
  const [sourceModelId, setSourceModelId] = useState(null);

  // 当开关关闭时，通知父组件重置
  useEffect(() => {
    if (!overrideEnabled) {
      if (onMotionOverride) onMotionOverride(null, null);
      setSourceCharId(null);
      setSourceModelId(null);
    }
  }, [overrideEnabled, onMotionOverride]);

  // 当源模型选择改变时，通知父组件
  useEffect(() => {
    if (overrideEnabled && sourceModelId && onMotionOverride) {
      onMotionOverride(sourceCharId, sourceModelId);
    }
  }, [sourceModelId, overrideEnabled, sourceCharId, onMotionOverride]);

  // 提取动作列表
  const motionGroups = modelData?.motions ? Object.keys(modelData.motions) : [];

  const isDisabled = !modelData || motionGroups.length === 0 || disabled;

  return (
    <div className="space-y-3">
      {/* 原有的动作选择下拉框 */}
      <Select
        value={value || "none"}
        onValueChange={onSelect}
        disabled={isDisabled}
      >
        <SelectTrigger
          className={`w-full h-11 rounded-xl transition-all duration-300 border-gray-200 dark:border-gray-700
            ${isDisabled
              ? "bg-gray-100 dark:bg-gray-800/50 opacity-70 cursor-not-allowed"
              : "bg-white dark:bg-gray-800/50 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F]"
            }
          `}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Clapperboard className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-[#E5004F]"}`} />
            <span className={!value || value === "none" ? "text-muted-foreground" : "text-foreground font-medium"}>
              <SelectValue placeholder={modelData ? "No motions available" : "Select a motion..."} />
            </span>
          </div>
        </SelectTrigger>

        <SelectContent className="max-h-[300px] rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
          <SelectItem value="none" className="text-muted-foreground focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1">
          </SelectItem>
          {motionGroups.map((group) => (
            <SelectItem key={group} value={group} className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1 cursor-pointer font-medium">
              {group}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 分隔线 */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-[#111] px-2 text-gray-300">Advanced</span>
        </div>
      </div>

      {/* 动作覆盖开关区域 */}
      <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <Shuffle className="w-3.5 h-3.5" />
            <span>Borrow Motions</span>
          </div>

          {/* 简单的 Toggle Switch */}
          <button
            onClick={() => !disabled && setOverrideEnabled(!overrideEnabled)}
            disabled={disabled}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5004F] focus:ring-offset-2 ${overrideEnabled ? 'bg-[#E5004F]' : 'bg-gray-200 dark:bg-gray-600'
              }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${overrideEnabled ? 'translate-x-4' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {overrideEnabled && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 pt-1">
            <CharacterSelect
              value={sourceCharId}
              onSelect={setSourceCharId}
              disabled={isDisabled}
            />

            <ModelSelect
              characterId={sourceCharId}
              value={sourceModelId}
              onSelect={setSourceModelId}
              disabled={isDisabled || !sourceCharId}
            />

            <div className="text-[10px] text-gray-400 italic text-center pt-1">
              Select a model to use its motion library
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
