import { Button } from "../../../../../components/ui/button.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../components/ui/popover.jsx";
import { Checkbox } from "../../../../../components/ui/checkbox.jsx";
import { RadioGroup, RadioGroupItem } from "../../../../../components/ui/radio-group.jsx";
import { Filter, SlidersHorizontal } from "lucide-react";
import { useId } from "react";

export function CharacterFilterPopover({ disabled, allCategories, selectedCategories, filterMode, onModeChange, onCategoryToggle }) {
  const idPrefix = useId();
  const whiteId = `${idPrefix}-whitelist`;
  const blackId = `${idPrefix}-blacklist`;
  const toCategoryId = (category) =>
    `${idPrefix}-cat-${category.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="h-11 w-11 shrink-0 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-[#E5004F]/10 hover:border-[#E5004F]/50 hover:text-[#E5004F] transition-all"
          title="过滤角色"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(340px,calc(100vw-1rem))] max-h-[calc(100vh-1.5rem)] overflow-auto p-5 rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md"
        align="end"
        sideOffset={10}
        collisionPadding={8}
      >
        <div className="grid gap-5">
          <div className="space-y-1.5 border-b border-gray-100 dark:border-gray-800 pb-3">
            <h4 className="font-bold text-[#E5004F] flex items-center gap-2">
              <Filter className="w-4 h-4" />
              过滤设置
            </h4>
            <p className="text-xs text-muted-foreground">自定义列表显示的角色</p>
          </div>

          <RadioGroup value={filterMode} onValueChange={onModeChange} className="grid grid-cols-2 gap-3">
            <div className="relative">
              <RadioGroupItem value="whitelist" id={whiteId} className="peer sr-only" />
              <label
                htmlFor={whiteId}
                className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#E5004F] peer-data-[state=checked]:text-[#E5004F] peer-data-[state=checked]:bg-[#E5004F]/5 cursor-pointer transition-all"
              >
                <span className="text-xs font-bold">包含选中</span>
                <span className="text-[10px] opacity-70">白名单模式</span>
              </label>
            </div>

            <div className="relative">
              <RadioGroupItem value="blacklist" id={blackId} className="peer sr-only" />
              <label
                htmlFor={blackId}
                className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#E5004F] peer-data-[state=checked]:text-[#E5004F] peer-data-[state=checked]:bg-[#E5004F]/5 cursor-pointer transition-all"
              >
                <span className="text-xs font-bold">排除选中</span>
                <span className="text-[10px] opacity-70">黑名单模式</span>
              </label>
            </div>
          </RadioGroup>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {allCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2 group">
                {/*
                  Category names can contain spaces and punctuation; sanitize to keep id/htmlFor valid.
                */}
                <Checkbox
                  id={toCategoryId(category)}
                  checked={selectedCategories[category]}
                  onCheckedChange={() => onCategoryToggle(category)}
                  className="data-[state=checked]:bg-[#E5004F] data-[state=checked]:border-[#E5004F] rounded-md border-gray-300 dark:border-gray-600"
                />
                <label
                  htmlFor={toCategoryId(category)}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-[#E5004F] transition-colors cursor-pointer"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
