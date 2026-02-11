"use client";

import { SelectItem } from "@/components/ui/select";
import { memo } from "react";
import { Smile } from "lucide-react";
import { SelectField, selectItemClass } from "./shared/SelectField";

const ExpressionSelect = memo(function ExpressionSelect({ modelData, onSelect, value, disabled }) {
  const expressions = modelData?.expressions || [];
  const isDisabled = !modelData || expressions.length === 0 || disabled;

  return (
    <div className="w-full">
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
    </div>
  );
});

export { ExpressionSelect };
