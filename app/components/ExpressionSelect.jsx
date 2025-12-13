"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { memo } from "react";
import { Smile } from "lucide-react"; // 引入表情图标

const ExpressionSelect = memo(function ExpressionSelect({ modelData, onSelect, value }) {
  const expressions = modelData?.expressions || [];
  const isDisabled = !modelData || expressions.length === 0;

  return (
    <div className="w-full">
      <Select onValueChange={onSelect} value={value} disabled={isDisabled}>
        <SelectTrigger
          className={`w-full h-11 rounded-xl transition-all duration-300 border-gray-200 dark:border-gray-700
            ${isDisabled
              ? "bg-gray-100 dark:bg-gray-800/50 opacity-70 cursor-not-allowed"
              : "bg-white dark:bg-gray-800/50 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F]"
            }
          `}
        >
          <div className="flex items-center gap-2.5 truncate">
            {/* 图标：根据是否禁用改变颜色 */}
            <Smile className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-[#E5004F]"}`} />

            <span className={!value || value === "none" ? "text-muted-foreground" : "text-foreground font-medium"}>
              <SelectValue placeholder={isDisabled ? "No expressions available" : "Select an expression..."} />
            </span>
          </div>
        </SelectTrigger>

        <SelectContent className="max-h-[300px] rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
          <SelectItem value="none" className="text-muted-foreground focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1">
            <span className="italic">Default (Reset)</span>
          </SelectItem>

          {expressions.map((expression) => (
            <SelectItem
              key={expression.name}
              value={expression.name}
              className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1 cursor-pointer font-medium"
            >
              {expression.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

export { ExpressionSelect };
