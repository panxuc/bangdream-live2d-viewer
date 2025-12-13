"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, memo } from "react";
import { Shirt } from "lucide-react"; // 引入衣服图标

const ModelSelect = memo(function ModelSelect({ characterId, onSelect, isDarkMode, value }) {
  const [modelList, setModelList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!characterId) {
      setModelList([]);
      return;
    }

    setIsLoading(true);
    const paddedId = characterId.padStart(3, '0');

    // 保留原有逻辑：isDarkMode 似乎对应后端 API 的 isModified 参数
    fetch(`/api/models?characterId=${paddedId}&isModified=${isDarkMode}`)
      .then(res => res.json())
      .then(data => {
        const models = Object.keys(data.models || {})
          .filter(key => !key.includes('_general'));
        setModelList(models);
      })
      .catch(() => {
        setModelList([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [characterId, isDarkMode]);

  // 当没有选择角色，或者正在加载，或者列表为空时，禁用选择器
  const isDisabled = !characterId || (modelList.length === 0 && !isLoading);

  return (
    <div className="w-full">
      {/* 移除 Label，由外部容器控制 */}
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
            {/* 图标：禁用时灰色，启用时粉色 */}
            <Shirt className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-[#E5004F]"}`} />

            <span className={!value || value === "none" ? "text-muted-foreground" : "text-foreground font-medium"}>
              <SelectValue placeholder={
                !characterId
                  ? "Select a character first"
                  : isLoading
                    ? "Loading costumes..."
                    : "Select a costume..."
              } />
            </span>
          </div>
        </SelectTrigger>

        <SelectContent className="max-h-[300px] rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
          <SelectItem value="none" className="text-muted-foreground focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1">
            <span className="italic">---</span>
          </SelectItem>

          {modelList.map((model) => (
            <SelectItem
              key={model}
              value={model}
              className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1 cursor-pointer font-medium"
            >
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

export { ModelSelect };
