"use client";

import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { getOnModelsApiUrl } from "@/src/config/urls";
import { fetchJson } from "@/src/lib/fetchJson";
import { Loader2, RotateCw, Shirt } from "lucide-react";
import { memo, useMemo } from "react";
import useSWR from "swr";
import { SelectField, selectItemClass } from "./shared/SelectField";

const OnModelSelect = memo(function OnModelSelect({
  characterId,
  onSelect,
  value,
  onReload,
  disabled,
  isReloading = false,
}) {
  const swrKey = characterId ? getOnModelsApiUrl(characterId) : null;
  const { data, isLoading } = useSWR(swrKey, fetchJson, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const modelList = useMemo(() => (Array.isArray(data?.models) ? data.models : []), [data?.models]);
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
          placeholder={!characterId ? "请先选择角色" : isLoading ? "模型加载中..." : "请选择模型..."}
          emptyState={
            !isLoading && modelList.length === 0 && characterId ? (
              <div className="p-2 text-center text-sm text-muted-foreground">未找到 Our Notes 模型</div>
            ) : null
          }
        >
          {modelList.map((model) => (
            <SelectItem key={model.id} value={model.id} className={selectItemClass}>
              {model.label}
            </SelectItem>
          ))}
        </SelectField>
      </div>

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
    </div>
  );
});

export { OnModelSelect };
