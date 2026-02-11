"use client";

import { SelectItem } from "@/components/ui/select";
import { Clapperboard } from "lucide-react";
import { CharacterSelect } from "./CharacterSelect";
import { ModelSelect } from "./ModelSelect";
import { SelectField, selectItemClass } from "./shared/SelectField";

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
      <SelectField
        value={value || "none"}
        onValueChange={onSelect}
        disabled={isDisabled}
        icon={Clapperboard}
        placeholder={modelData ? "暂无可用动作" : "请选择动作..."}
        noneLabel=""
      >
        {motionGroups.map((group) => (
          <SelectItem key={group} value={group} className={selectItemClass}>
            {group}
          </SelectItem>
        ))}
      </SelectField>

      {/* 动作覆盖选择区域 (仅当开关开启时显示) */}
      {isBorrowing && (
        <div className="space-y-2 bg-white/65 dark:bg-[#2a1d35]/60 p-2.5 rounded-xl border border-[#E5004F]/15 dark:border-[#ff76a7]/20 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">动作来源</div>

          <CharacterSelect
            value={borrowedCharId}
            onSelect={onSourceCharChange}
            disabled={disabled}
            showFilter={false}
          />

          <ModelSelect
            characterId={borrowedCharId}
            value={borrowedModelId}
            onSelect={(modelId) => onMotionOverride(borrowedCharId, modelId)}
            disabled={disabled || !borrowedCharId}
            showReload={false}
          />
        </div>
      )}
    </div>
  );
};
