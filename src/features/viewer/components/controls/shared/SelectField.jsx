"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const baseTriggerClass =
  "w-full h-11 rounded-xl transition-all duration-300 border border-[#E5004F]/15 dark:border-[#ff76a7]/25";

export function SelectField({
  value,
  onValueChange,
  disabled,
  icon,
  placeholder,
  showNone = true,
  noneLabel = "---",
  children,
  emptyState,
  iconClassName = "",
  selectProps = {},
}) {
  const Icon = icon;

  return (
    <Select onValueChange={onValueChange} value={value} disabled={disabled} {...selectProps}>
      <SelectTrigger
        className={`${baseTriggerClass} ${
          disabled
            ? "bg-gray-100 dark:bg-gray-800/50 opacity-70 cursor-not-allowed"
            : "bg-white/90 dark:bg-[#2a1d35]/70 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F]"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {Icon ? <Icon className={`w-4 h-4 ${disabled ? "text-gray-400" : "text-[#E5004F]"} ${iconClassName}`} /> : null}
          <span className={!value || value === "none" ? "text-muted-foreground" : "text-foreground font-medium"}>
            <SelectValue placeholder={placeholder} />
          </span>
        </div>
      </SelectTrigger>

      <SelectContent className="max-h-[300px] rounded-xl border border-[#E5004F]/15 dark:border-[#ff76a7]/25 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
        {showNone ? (
          <SelectItem value="none" className="text-muted-foreground focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1">
            <span className="italic">{noneLabel}</span>
          </SelectItem>
        ) : null}
        {emptyState}
        {children}
      </SelectContent>
    </Select>
  );
}

export const selectItemClass = "focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1 cursor-pointer font-medium";
