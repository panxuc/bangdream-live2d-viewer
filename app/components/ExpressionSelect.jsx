"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { memo } from "react";

const ExpressionSelect = memo(function ExpressionSelect({ modelData, onSelect, value }) {
  const expressions = modelData?.expressions || [];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground/90">表情选择</label>
      <Select onValueChange={onSelect} value={value}>
        <SelectTrigger className="w-full bg-background hover:bg-accent transition-colors">
          <SelectValue placeholder="请选择表情" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">请选择表情</SelectItem>
          {expressions.map((expression) => (
            <SelectItem key={expression.name} value={expression.name}>
              {expression.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

export { ExpressionSelect };
