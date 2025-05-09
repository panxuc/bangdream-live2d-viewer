"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ExpressionSelect({ modelData, onSelect }) {
  const expressions = modelData?.expressions || [];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">表情</label>
      <Select onValueChange={onSelect}>
        <SelectTrigger className="w-[200px]">
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
}
