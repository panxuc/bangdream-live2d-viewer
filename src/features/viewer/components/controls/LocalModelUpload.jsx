"use client";

import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { MODEL_TYPES } from "@/src/features/viewer/lib/modelState";
import { FileJson, RotateCw, Upload } from "lucide-react";
import { useRef } from "react";
import { SelectField, selectItemClass } from "./shared/SelectField";

export function LocalModelUpload({
  modelType = MODEL_TYPES.LIVE2D,
  disabled,
  isUploading,
  isReloading = false,
  localModelFileName,
  localArchiveToken,
  localModelCandidates = [],
  localModelPath,
  localModelError,
  onUploadArchive,
  onSelectModelPath,
  onApplyModel,
  onReload,
}) {
  const fileInputRef = useRef(null);
  const isSpine = modelType === MODEL_TYPES.SPINE;
  const sectionLabel = isSpine ? "本地 Spine" : "本地 Live2D";
  const uploadLabel = isSpine ? "上传 Spine 压缩包" : "上传 Live2D 压缩包";

  const handlePickFile = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await onUploadArchive(file);
    }
    event.target.value = "";
  };

  const localSelectDisabled = disabled || isUploading || localModelCandidates.length === 0;
  const refreshDisabled = localSelectDisabled || !localModelPath || !onReload;

  const handleRefreshClick = () => {
    if (onReload) {
      onReload();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
          {sectionLabel}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePickFile}
          disabled={disabled || isUploading}
          className="h-11 w-full px-3.5 rounded-xl text-sm font-medium border border-[#E5004F]/20 dark:border-[#ff76a7]/25 bg-white/85 dark:bg-[#2a1d35]/70 text-[#E5004F] hover:bg-[#E5004F]/10 hover:border-[#E5004F]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center justify-between w-full">
            <Upload className="w-4 h-4" />
            <span className="text-center flex-1">{isUploading ? "读取中..." : uploadLabel}</span>
            <Upload className="w-4 h-4 opacity-0" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.7z,.rar,.tar,.tgz,.tbz,.tbz2,.txz"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {localModelFileName ? <div className="text-xs text-gray-500 px-1 truncate">当前压缩包: {localModelFileName}</div> : null}

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <SelectField
            key={`${localArchiveToken || "local-archive-empty"}:${localModelPath || "none"}`}
            value={localModelPath ?? undefined}
            onValueChange={async (value) => {
              onSelectModelPath(value);
              await onApplyModel(value);
            }}
            disabled={localSelectDisabled}
            icon={FileJson}
            placeholder={isSpine ? "请选择 skeleton 文件" : "请选择模型入口文件"}
            showNone={false}
            emptyState={null}
          >
            {localModelCandidates.map((item) => (
              <SelectItem key={item.id || item.path} value={item.id || item.path} className={selectItemClass}>
                {item.label || item.path}
              </SelectItem>
            ))}
          </SelectField>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefreshClick}
          disabled={refreshDisabled}
          className="h-11 w-11 shrink-0 rounded-xl border-[#E5004F]/20 dark:border-[#ff76a7]/25 bg-white/85 dark:bg-[#2a1d35]/70 hover:bg-[#E5004F]/10 hover:border-[#E5004F]/50 hover:text-[#E5004F] transition-all disabled:opacity-50"
          title="刷新本地模型"
        >
          <RotateCw className={`w-5 h-5 ${isReloading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {localModelError ? <p className="text-xs text-red-500 px-1">{localModelError}</p> : null}
    </div>
  );
}
