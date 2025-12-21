"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useMemo, memo } from "react";
import { Shirt, Loader2, RotateCw } from "lucide-react";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

const ModelSelect = memo(function ModelSelect({ characterId, onSelect, isModified, value, onReload, disabled }) {
  const paddedId = characterId ? characterId.padStart(3, '0') : null;
  // 使用 isModified 参数来获取 chara 或 charam 列表
  const swrKey = paddedId
    ? `/api/models?characterId=${paddedId}&isModified=${isModified}`
    : null;

  const { data, isLoading } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const modelList = useMemo(() => {
    if (!data || !data.models) return [];
    return Object.keys(data.models).filter(key => !key.includes('_general'));
  }, [data]);

  const isDisabled = !characterId || (modelList.length === 0 && !isLoading) || disabled;

  const [isSpinning, setIsSpinning] = useState(false);

  const handleReloadClick = () => {
    if (onReload) {
      setIsSpinning(true);
      onReload();
      setTimeout(() => setIsSpinning(false), 500);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 min-w-0">
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
              {isLoading && characterId ? (
                <Loader2 className="w-4 h-4 text-[#E5004F] animate-spin" />
              ) : (
                <Shirt className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-[#E5004F]"}`} />
              )}

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

            {!isLoading && modelList.length === 0 && characterId && (
              <div className="p-2 text-center text-sm text-muted-foreground">No costumes found</div>
            )}

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

      <Button
        variant="outline"
        size="icon"
        onClick={handleReloadClick}
        disabled={isDisabled || !value || value === "none"}
        className="h-11 w-11 shrink-0 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-[#E5004F]/10 hover:border-[#E5004F]/50 hover:text-[#E5004F] transition-all disabled:opacity-50"
        title="重置模型"
      >
        <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
});

export { ModelSelect };
