"use client";

import { FolderOpen, Wifi } from "lucide-react";

export function ModelSourceSection({ modelSource, isBatching, handleModelSourceChange }) {
  return (
    <div className="control-group">
      <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">模型来源</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => !isBatching && handleModelSourceChange("remote")}
          disabled={isBatching}
          className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
            modelSource === "remote"
              ? "border-[#E5004F] bg-[#E5004F]/10 text-[#E5004F]"
              : "border-[#E5004F]/20 text-gray-500 dark:text-gray-300 hover:border-[#E5004F]/50"
          } ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            在线获取
          </span>
        </button>
        <button
          type="button"
          onClick={() => !isBatching && handleModelSourceChange("local")}
          disabled={isBatching}
          className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
            modelSource === "local"
              ? "border-[#E5004F] bg-[#E5004F]/10 text-[#E5004F]"
              : "border-[#E5004F]/20 text-gray-500 dark:text-gray-300 hover:border-[#E5004F]/50"
          } ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="inline-flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            本地上传
          </span>
        </button>
      </div>
    </div>
  );
}
