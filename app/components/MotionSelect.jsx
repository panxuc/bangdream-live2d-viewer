"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clapperboard } from "lucide-react";
import { CharacterSelect } from "./CharacterSelect";
import { ModelSelect } from "./ModelSelect";

export const MotionSelect = ({
  modelData,
  onSelect,
  value,
  disabled,
  onMotionOverride,
  isBorrowing,
  borrowedCharId,
  borrowedModelId,
  onSourceCharChange
}) => {

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

      {/* 动作覆盖选择区域 (仅当开关开启时显示) */}
      {isBorrowing && (
        <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/50 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Motion Source</div>

          <CharacterSelect
            value={borrowedCharId}
            onSelect={onSourceCharChange}
            disabled={disabled}
          />

          <ModelSelect
            characterId={borrowedCharId}
            value={borrowedModelId}
            onSelect={(modelId) => onMotionOverride(borrowedCharId, modelId)}
            disabled={disabled || !borrowedCharId}
          />
        </div>
      )}
    </div>
  );
};
