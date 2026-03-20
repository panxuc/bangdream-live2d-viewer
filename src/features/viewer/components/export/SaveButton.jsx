"use client";

import { useState, useCallback, memo, useMemo, useEffect } from "react";
import { DEFAULT_CUSTOM_BACKGROUND, decodeCustomBackground } from "@/src/features/viewer/lib/backgroundStyle";
import { BatchExportSection } from "./BatchExportSection";
import { ExportSettingsSection } from "./ExportSettingsSection";
import { useBatchExportController } from "@/src/features/viewer/hooks/useBatchExportController";
import { useCanvasImageExport } from "@/src/features/viewer/hooks/useCanvasImageExport";

const SaveButton = memo(function SaveButton({
  modelData,
  selectedModel,
  selectedMotion,
  selectedExpression,
  canvasRef,
  backgroundColor,
  onBackgroundColorChange,
  onReload,
  onBatchStatusChange,
}) {
  const [imageSize, setImageSize] = useState("200");
  const [customName, setCustomName] = useState("");
  const [customBackground, setCustomBackground] = useState(DEFAULT_CUSTOM_BACKGROUND);

  useEffect(() => {
    const decoded = decodeCustomBackground(backgroundColor);
    if (decoded) {
      setCustomBackground(decoded);
    }
  }, [backgroundColor]);

  const getFileName = useCallback((motionGroup, expression) => {
    const clean = (value) => (value ? value.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, "") : "");
    const baseName = customName.trim() ? customName.trim() : selectedModel || "model";
    const parts = [clean(baseName)];

    if (motionGroup) parts.push(clean(motionGroup));
    if (expression) parts.push(clean(expression));

    return `${parts.join("_")}.png`;
  }, [customName, selectedModel]);

  const currentFileName = useMemo(
    () => getFileName(selectedMotion, selectedExpression),
    [getFileName, selectedMotion, selectedExpression],
  );

  const { captureAndDownload } = useCanvasImageExport({
    canvasRef,
    backgroundColor,
    imageSize,
  });

  const handleSave = () => captureAndDownload(currentFileName);
  const { isBatching, batchProgress, handleBatchSave, cancelBatch } = useBatchExportController({
    modelData,
    canvasRef,
    getFileName,
    captureAndDownload,
    onReload,
    onBatchStatusChange,
  });

  const hasCanvas = !!canvasRef?.current?.getApp?.();
  const hasModelLoaded = !!modelData;
  const isDisabled = !hasCanvas || !hasModelLoaded;
  const motionGroups = modelData?.motions ? Object.keys(modelData.motions) : [];
  const isBatchDisabled = isDisabled || motionGroups.length === 0;

  return (
    <div className="space-y-5">
      <ExportSettingsSection
        backgroundColor={backgroundColor}
        customBackground={customBackground}
        customName={customName}
        imageSize={imageSize}
        isBatching={isBatching}
        isDisabled={isDisabled}
        selectedModel={selectedModel}
        onBackgroundColorChange={onBackgroundColorChange}
        onCustomBackgroundChange={setCustomBackground}
        onCustomNameChange={setCustomName}
        onImageSizeChange={setImageSize}
      />

      <BatchExportSection
        isDisabled={isDisabled}
        isBatchDisabled={isBatchDisabled}
        isBatching={isBatching}
        batchProgress={batchProgress}
        onSave={handleSave}
        onBatchSave={handleBatchSave}
        onCancelBatch={cancelBatch}
      />
    </div>
  );
});

export { SaveButton };
