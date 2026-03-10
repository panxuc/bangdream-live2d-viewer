"use client";

import { CharacterSelect, ModelDownloadButton, ModelSelect } from "@/src/features/viewer/components/controls";
import { getBestdoriAssetUrl } from "@/src/config/urls";
import { ExternalLink, Shirt, Skull, Sparkles } from "lucide-react";
import { useMemo } from "react";

export function RemoteModelSection({
  activeModel,
  isBatching,
  isReloading,
  handleCharacterSelect,
  handleModelSelect,
  handleModelReload,
  handleBodylessChange,
  handleHeadlessChange,
  handleModifiedChange,
}) {
  const bestdoriAssetId = useMemo(() => {
    const raw = activeModel?.modelId;
    if (!raw || typeof raw !== "string") return null;
    const normalized = raw.trim();
    return normalized || null;
  }, [activeModel.modelId]);
  const bestdoriJpUrl = bestdoriAssetId ? getBestdoriAssetUrl("jp", bestdoriAssetId) : null;
  const bestdoriCnUrl = bestdoriAssetId ? getBestdoriAssetUrl("cn", bestdoriAssetId) : null;

  const handleOpenBestdori = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="control-group">
        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">角色</label>
        <CharacterSelect onSelect={handleCharacterSelect} value={activeModel.characterId} disabled={isBatching} />
      </div>

      <div className="control-group">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase">服装</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenBestdori(bestdoriJpUrl)}
              disabled={isBatching || !bestdoriJpUrl}
              className={`transition-all duration-300 transform active:scale-95 inline-flex items-center gap-1 ${bestdoriJpUrl ? "text-gray-300 dark:text-gray-600 hover:text-[#E5004F]" : "text-gray-200 dark:text-gray-700"} ${isBatching || !bestdoriJpUrl ? "opacity-50 cursor-not-allowed" : ""}`}
              title={bestdoriJpUrl ? "在 Bestdori (JP) 中打开" : "请先选择一个在线服装模型"}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">JP</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBestdori(bestdoriCnUrl)}
              disabled={isBatching || !bestdoriCnUrl}
              className={`transition-all duration-300 transform active:scale-95 inline-flex items-center gap-1 ${bestdoriCnUrl ? "text-gray-300 dark:text-gray-600 hover:text-[#E5004F]" : "text-gray-200 dark:text-gray-700"} ${isBatching || !bestdoriCnUrl ? "opacity-50 cursor-not-allowed" : ""}`}
              title={bestdoriCnUrl ? "在 Bestdori (CN) 中打开" : "请先选择一个在线服装模型"}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">CN</span>
            </button>

            <span className="text-gray-200 dark:text-gray-700">|</span>

            <button
              onClick={() => !isBatching && handleBodylessChange()}
              disabled={isBatching}
              className={`transition-all duration-300 transform active:scale-95 flex items-center gap-1 ${activeModel.isBodyless ? "text-purple-500 drop-shadow-sm" : "text-gray-300 dark:text-gray-600 hover:text-gray-400"} ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
              title={activeModel.isBodyless ? "显示身体" : "隐藏身体"}
            >
              <Skull className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            <button
              onClick={() => !isBatching && handleHeadlessChange()}
              disabled={isBatching}
              className={`transition-all duration-300 transform active:scale-95 flex items-center gap-1 ${activeModel.isHeadless ? "text-blue-500 drop-shadow-sm" : "text-gray-300 dark:text-gray-600 hover:text-gray-400"} ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
              title={activeModel.isHeadless ? "显示头部" : "隐藏头部"}
            >
              <Shirt className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>

            <span className="text-gray-200 dark:text-gray-700">|</span>

            <button
              onClick={() => !isBatching && handleModifiedChange(!activeModel.isModified)}
              disabled={isBatching}
              className={`transition-all duration-300 transform active:scale-95 ${activeModel.isModified ? "text-[#E5004F] drop-shadow-sm" : "text-gray-300 dark:text-gray-600 hover:text-gray-400"} ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
              title={activeModel.isModified ? "禁用改模" : "启用改模"}
            >
              <Sparkles className="w-3.5 h-3.5" fill={activeModel.isModified ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <ModelSelect
          characterId={activeModel.characterId}
          onSelect={handleModelSelect}
          isModified={activeModel.isModified}
          value={activeModel.modelId}
          onReload={handleModelReload}
          disabled={isBatching}
          isReloading={isReloading}
          trailingActions={
            <ModelDownloadButton
              modelId={bestdoriAssetId}
              isModified={activeModel.isModified}
              disabled={isBatching}
            />
          }
        />
      </div>
    </>
  );
}
