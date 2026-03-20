"use client";

import { useCallback, useRef, useState } from "react";

export function useBatchExportController({
  modelData,
  canvasRef,
  getFileName,
  captureAndDownload,
  onReload,
  onBatchStatusChange,
}) {
  const [isBatching, setIsBatching] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentName: "" });
  const abortControllerRef = useRef(null);

  const handleBatchSave = useCallback(async () => {
    if (!modelData || !modelData.motions || !canvasRef.current) return;

    setIsBatching(true);
    onBatchStatusChange?.(true);

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    const motionGroups = Object.keys(modelData.motions);

    setBatchProgress({ current: 0, total: motionGroups.length + 1, currentName: "初始化中..." });

    try {
      onReload?.();
      if (canvasRef.current?.waitUntilStable) {
        await canvasRef.current.waitUntilStable(signal);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (signal.aborted) throw new Error("Cancelled");

      setBatchProgress({ current: 1, total: motionGroups.length + 1, currentName: "标准待机" });
      await captureAndDownload(getFileName(null, null));

      for (let index = 0; index < motionGroups.length; index++) {
        if (signal.aborted) throw new Error("Cancelled");

        const group = motionGroups[index];
        setBatchProgress({ current: index + 2, total: motionGroups.length + 1, currentName: group });
        canvasRef.current.internalPlayMotion(group);

        if (canvasRef.current?.waitUntilStable) {
          await canvasRef.current.waitUntilStable(signal);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (signal.aborted) throw new Error("Cancelled");
        await captureAndDownload(getFileName(group, null));
      }
    } catch (error) {
      if (error.message !== "Cancelled") {
        console.error("Batch save error:", error);
      }
    } finally {
      setIsBatching(false);
      onBatchStatusChange?.(false);
      abortControllerRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.internalReset();
      }
    }
  }, [canvasRef, captureAndDownload, getFileName, modelData, onBatchStatusChange, onReload]);

  const cancelBatch = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    isBatching,
    batchProgress,
    handleBatchSave,
    cancelBatch,
  };
}
