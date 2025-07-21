"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { memo, useMemo } from "react";

const MotionSelect = memo(function MotionSelect({ modelData, onSelect, value }) {
  const motionList = useMemo(() => {
    const motions = modelData?.motions || {};
    return Object.entries(motions).flatMap(([group, arr]) =>
      arr.map((motion, idx) => ({ group, index: idx, name: group }))
    );
  }, [modelData?.motions]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground/90">💃 动作选择</label>
      <Select onValueChange={onSelect} value={value}>
        <SelectTrigger className="w-full bg-background hover:bg-accent transition-colors">
          <SelectValue placeholder="🎦 请选择动作" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">请选择动作</SelectItem>
          {motionList.map((motion) => (
            <SelectItem key={motion.name} value={`${motion.group}|${motion.index}`}>
              {motion.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

export { MotionSelect };
