"use client";

import { SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getSpineModelsApiUrl } from "@/src/config/urls";
import { fetchJson } from "@/src/lib/fetchJson";
import { Loader2, Repeat2, RotateCw } from "lucide-react";
import { memo, useMemo } from "react";
import useSWR from "swr";
import { SelectField, selectItemClass } from "./shared/SelectField";

const SpineModelSelect = memo(function SpineModelSelect({
  characterId,
  onSelect,
  value,
  onReload,
  disabled,
  showReload = true,
  isReloading = false,
  trailingActions = null,
}) {
  const paddedId = characterId ? characterId.padStart(5, "0") : null;
  const swrKey = paddedId ? getSpineModelsApiUrl(paddedId) : null;

  const { data, isLoading } = useSWR(swrKey, fetchJson, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  const modelList = useMemo(() => {
    if (!Array.isArray(data?.models)) return [];
    return data.models;
  }, [data]);

  const isDisabled = !characterId || (modelList.length === 0 && !isLoading) || disabled;

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 min-w-0">
        <SelectField
          value={value}
          onValueChange={onSelect}
          disabled={isDisabled}
          icon={isLoading && characterId ? Loader2 : Repeat2}
          iconClassName={isLoading && characterId ? "animate-spin" : ""}
          placeholder={!characterId ? "请先选择角色" : isLoading ? "模型加载中..." : "请选择 Spine 模型..."}
          emptyState={!isLoading && modelList.length === 0 && characterId ? <div className="p-2 text-center text-sm text-muted-foreground">未找到 Spine 模型</div> : null}
        >
          {modelList.map((model) => (
            <SelectItem key={model} value={model} className={selectItemClass}>
              {model}
            </SelectItem>
          ))}
        </SelectField>
      </div>

      {trailingActions}

      {showReload ? (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onReload?.()}
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

export { SpineModelSelect };
