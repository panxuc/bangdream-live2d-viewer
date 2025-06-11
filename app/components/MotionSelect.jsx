"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MotionSelect({ modelData, onSelect, value }) {
  const motions = modelData?.motions || {};
  const motionList = Object.entries(motions).flatMap(([group, arr]) =>
    arr.map((motion, idx) => ({ group, index: idx, name: group }))
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">动作</label>
      <Select onValueChange={onSelect} value={value}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="请选择动作" />
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
}
