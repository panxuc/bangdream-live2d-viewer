"use client";

import { SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getModelsApiUrl } from "@/src/config/urls";
import { fetchJson } from "@/src/lib/fetchJson";
import { useMemo, memo } from "react";
import { Shirt, Loader2, RotateCw } from "lucide-react";
import useSWR from "swr";
import { SelectField, selectItemClass } from "./shared/SelectField";

const ModelSelect = memo(function ModelSelect({
  characterId,
  onSelect,
  isModified,
  value,
  onReload,
  disabled,
  showReload = true,
  isReloading = false,
}) {
  const paddedId = characterId ? characterId.padStart(3, '0') : null;
  const swrKey = paddedId ? getModelsApiUrl(paddedId, isModified) : null;

  const { data, isLoading } = useSWR(swrKey, fetchJson, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const modelList = useMemo(() => {
    if (!data || !data.models) return [];
    return Object.keys(data.models).filter(key => !key.includes('_general'));
  }, [data]);

  const isDisabled = !characterId || (modelList.length === 0 && !isLoading) || disabled;

  const handleReloadClick = () => {
    if (onReload) {
      onReload();
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 min-w-0">
        <SelectField
          value={value}
          onValueChange={onSelect}
          disabled={isDisabled}
          icon={isLoading && characterId ? Loader2 : Shirt}
          iconClassName={isLoading && characterId ? "animate-spin" : ""}
          placeholder={!characterId ? "请先选择角色" : isLoading ? "服装加载中..." : "请选择服装..."}
          emptyState={!isLoading && modelList.length === 0 && characterId ? <div className="p-2 text-center text-sm text-muted-foreground">未找到服装</div> : null}
        >
          {modelList.map((model) => (
            <SelectItem key={model} value={model} className={selectItemClass}>
              {model}
            </SelectItem>
          ))}
        </SelectField>
      </div>

      {showReload ? (
        <Button
          variant="outline"
          size="icon"
          onClick={handleReloadClick}
          disabled={isDisabled || !value || value === "none" || !onReload}
          className="h-11 w-11 shrink-0 rounded-xl border-[#E5004F]/20 dark:border-[#ff76a7]/25 bg-white/85 dark:bg-[#2a1d35]/70 hover:bg-[#E5004F]/10 hover:border-[#E5004F]/50 hover:text-[#E5004F] transition-all disabled:opacity-50"
          title="重置模型"
        >
          <RotateCw className={`w-5 h-5 ${isReloading ? "animate-spin" : ""}`} />
        </Button>
      ) : null}
    </div>
  );
});

export { ModelSelect };
