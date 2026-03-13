"use client";

import { SelectItem } from "@/components/ui/select";
import { Clapperboard, Layers } from "lucide-react";
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
  onSourceCharChange,
  onApplyToAllLayers,
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
            modelType="live2d"
            hideWithoutModels
          />

          <ModelSelect
            characterId={borrowedCharId}
            value={borrowedModelId}
            onSelect={(modelId) => onMotionOverride(borrowedCharId, modelId)}
            disabled={disabled || !borrowedCharId}
            showReload={false}
          />

          <button
            type="button"
            onClick={() => onApplyToAllLayers?.()}
            disabled={disabled || !borrowedCharId || !borrowedModelId}
            className={`w-full h-11 rounded-xl border px-3 transition-all ${
              disabled || !borrowedCharId || !borrowedModelId
                ? "border-[#E5004F]/20 text-gray-400 cursor-not-allowed opacity-60"
                : "border-[#E5004F]/35 bg-[#E5004F]/5 text-[#E5004F] hover:bg-[#E5004F]/12"
            }`}
            title="将当前动作借用设置应用到所有图层"
          >
            <span className="relative flex items-center justify-center w-full">
              <Layers className="absolute left-0 w-4 h-4 opacity-80" />
              <span className="text-sm font-semibold text-center">应用到所有图层</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
