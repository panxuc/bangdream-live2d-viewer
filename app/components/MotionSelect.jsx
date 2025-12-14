"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { memo, useMemo } from "react";
import { Clapperboard } from "lucide-react";

const MotionSelect = memo(function MotionSelect({ modelData, onSelect, value, disabled }) {
  const motionList = useMemo(() => {
    const motions = modelData?.motions || {};
    // 既然每个组只有一个动作，直接取 Key 即可
    return Object.keys(motions);
  }, [modelData?.motions]);

  const isDisabled = !modelData || motionList.length === 0 || disabled;

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
            <Clapperboard className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-[#E5004F]"}`} />
            <span className={!value || value === "none" ? "text-muted-foreground" : "text-foreground font-medium"}>
              <SelectValue placeholder={isDisabled ? "No motions available" : "Select a motion..."} />
            </span>
          </div>
        </SelectTrigger>
        
        <SelectContent className="max-h-[300px] rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
          <SelectItem value="none" className="text-muted-foreground focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1">
            <span className="italic">---</span>
          </SelectItem>
          
          {motionList.map((motionGroup) => (
            <SelectItem 
              key={motionGroup} 
              value={motionGroup}
              className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1 cursor-pointer font-medium"
            >
              {motionGroup}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

export { MotionSelect };
