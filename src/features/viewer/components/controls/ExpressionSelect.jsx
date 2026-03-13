"use client";

import { SelectItem } from "@/components/ui/select";
import { memo } from "react";
import { Smile } from "lucide-react";
import { CharacterSelect } from "./CharacterSelect";
import { ModelSelect } from "./ModelSelect";
import { SelectField, selectItemClass } from "./shared/SelectField";

const ExpressionSelect = memo(function ExpressionSelect({
  modelData,
  onSelect,
  value,
  disabled,
  onExpressionOverride,
  isBorrowing,
  borrowedCharId,
  borrowedModelId,
  onSourceCharChange,
}) {
  const expressions = modelData?.expressions || [];
  const isDisabled = !modelData || expressions.length === 0 || disabled;

  return (
    <div className="w-full space-y-3">
      <SelectField
        value={value}
        onValueChange={onSelect}
        disabled={isDisabled}
        icon={Smile}
        placeholder={isDisabled ? "暂无可用表情" : "请选择表情..."}
      >
        {expressions.map((expression) => (
          <SelectItem key={expression.name} value={expression.name} className={selectItemClass}>
            {expression.name}
          </SelectItem>
        ))}
      </SelectField>

      {isBorrowing && (
        <div className="space-y-2 bg-white/65 dark:bg-[#2a1d35]/60 p-2.5 rounded-xl border border-[#E5004F]/15 dark:border-[#ff76a7]/20 animate-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">表情来源</div>

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
            onSelect={(modelId) => onExpressionOverride?.(borrowedCharId, modelId)}
            disabled={disabled || !borrowedCharId}
            showReload={false}
          />
        </div>
      )}
    </div>
  );
});

export { ExpressionSelect };
