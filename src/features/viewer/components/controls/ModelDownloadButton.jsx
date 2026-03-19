import { Button } from "../../../../../components/ui/button.jsx";
import { saveAs } from "file-saver";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getDownloadApiUrl,
  getDownloadInfoApiUrl,
  getSpineDownloadApiUrl,
  getSpineDownloadInfoApiUrl,
} from "../../../../config/urls.js";
import { fetchJson } from "../../../../lib/fetchJson.js";

const formatZipSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "ZIP";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 100 * 1024 ? 1 : 0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 2 : 1)}MB`;
};

export function ModelDownloadButton({ modelId, isModified, disabled = false, modelType = "live2d" }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSizeLabel, setDownloadSizeLabel] = useState(null);
  const isSpine = modelType === "spine";
  const downloadUrl = useMemo(
    () => (modelId ? (isSpine ? getSpineDownloadApiUrl(modelId) : getDownloadApiUrl(modelId, isModified)) : null),
    [isSpine, modelId, isModified],
  );
  const downloadInfoUrl = useMemo(
    () => (modelId ? (isSpine ? getSpineDownloadInfoApiUrl(modelId) : getDownloadInfoApiUrl(modelId, isModified)) : null),
    [isSpine, modelId, isModified],
  );
  const buttonTitle = downloadUrl
    ? (isSpine ? "下载当前 Spine ZIP" : "下载当前模型 ZIP")
    : (isSpine ? "请先选择一个在线 Spine 模型" : "请先选择一个在线服装模型");

  useEffect(() => {
    if (!downloadInfoUrl) {
      setDownloadSizeLabel(null);
      return;
    }

    const controller = new AbortController();
    setDownloadSizeLabel("...");

    const loadZipInfo = async () => {
      try {
        const payload = await fetchJson(downloadInfoUrl, { signal: controller.signal });
        setDownloadSizeLabel(formatZipSize(payload?.sizeBytes));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to load zip size:", error);
        setDownloadSizeLabel("ZIP");
      }
    };

    void loadZipInfo();

    return () => {
      controller.abort();
    };
  }, [downloadInfoUrl]);

  const handleDownload = async () => {
    if (!downloadUrl || !modelId || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        let message = `Download failed: ${response.status}`;
        try {
          const errorPayload = await response.json();
          if (typeof errorPayload?.error === "string" && errorPayload.error) {
            message = errorPayload.error;
          }
        } catch {
          // Keep the fallback message when the response is not JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const fallbackName = `${modelId}${isModified ? "-modified" : ""}.zip`;
      const contentDisposition = response.headers.get("content-disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
      saveAs(blob, fileNameMatch?.[1] || fallbackName);
    } catch (error) {
      console.error("Model download failed:", error);
      window.alert(error instanceof Error ? error.message : "下载失败，请稍后重试。");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={disabled || !downloadUrl || isDownloading}
      className="h-11 w-11 shrink-0 rounded-xl border-[#E5004F]/20 dark:border-[#ff76a7]/25 bg-white/85 dark:bg-[#2a1d35]/70 hover:bg-[#E5004F]/10 hover:border-[#E5004F]/50 hover:text-[#E5004F] transition-all disabled:opacity-50 px-1 py-1"
      title={buttonTitle}
    >
      <span className="flex h-full w-full flex-col items-center justify-center leading-none">
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span className="mt-1 text-[8px] font-semibold uppercase tracking-tight">
          {isDownloading ? "..." : downloadSizeLabel || "ZIP"}
        </span>
      </span>
    </Button>
  );
}
