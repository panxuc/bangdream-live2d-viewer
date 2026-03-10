"use client";

import { useState } from "react";
import { ViewerControlsPanel, ViewerExportPanel, ViewerHeader, ViewerStage } from "@/src/features/viewer/components";
import { MAX_MODELS, useViewerPageState } from "@/src/features/viewer/hooks/useViewerPageState";

export default function Home() {
  const state = useViewerPageState();
  const [mobilePanel, setMobilePanel] = useState("controls");
  const stageProps = {
    models: state.models,
    canvasRef: state.canvasRef,
    backgroundColor: state.backgroundColor,
    onModelLoad: state.handleModelLoad,
    onSyncComplete: state.handleCanvasSyncComplete,
  };
  const controlsPanelProps = {
    models: state.models,
    activeModel: state.activeModel,
    activeModelId: state.activeModelId,
    activeModelIndex: state.activeModelIndex,
    isBatching: state.isBatching,
    isReloading: state.isReloading,
    isUploadingLocalModel: state.isUploadingLocalModel,
    maxModels: MAX_MODELS,
    setActiveModelId: state.setActiveModelId,
    handleAddModel: state.handleAddModel,
    handleDuplicateModel: state.handleDuplicateModel,
    handleRemoveModel: state.handleRemoveModel,
    handleMoveModel: state.handleMoveModel,
    handleReorderModels: state.handleReorderModels,
    handleCharacterSelect: state.handleCharacterSelect,
    handleModelSelect: state.handleModelSelect,
    handleModelSourceChange: state.handleModelSourceChange,
    handleModelReload: state.handleModelReload,
    handleBodylessChange: state.handleBodylessChange,
    handleHeadlessChange: state.handleHeadlessChange,
    handleModifiedChange: state.handleModifiedChange,
    handleBorrowingToggle: state.handleBorrowingToggle,
    handleApplyBorrowingToAllLayers: state.handleApplyBorrowingToAllLayers,
    handleMotionSelect: state.handleMotionSelect,
    handleMotionOverride: state.handleMotionOverride,
    handleSourceCharChange: state.handleSourceCharChange,
    handleExpressionOverride: state.handleExpressionOverride,
    handleExpressionBorrowingToggle: state.handleExpressionBorrowingToggle,
    handleExpressionSourceCharChange: state.handleExpressionSourceCharChange,
    handleExpressionSelect: state.handleExpressionSelect,
    handleTransformChange: state.handleTransformChange,
    handleLocalArchiveUpload: state.handleLocalArchiveUpload,
    handleLocalModelPathSelect: state.handleLocalModelPathSelect,
    handleApplyLocalModel: state.handleApplyLocalModel,
  };
  const exportPanelProps = {
    activeModel: state.activeModel,
    canvasRef: state.canvasRef,
    backgroundColor: state.backgroundColor,
    setBackgroundColor: state.setBackgroundColor,
    handleModelReload: state.handleModelReload,
    setIsBatching: state.setIsBatching,
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 overflow-x-hidden selection:bg-[#E5004F] selection:text-white ${state.isDarkMode ? "bg-[#141118] text-gray-100" : "bg-[#f8f8fb] text-gray-800"}`}>
      <ViewerHeader isDarkMode={state.isDarkMode} onToggleDarkMode={() => state.setIsDarkMode((prev) => !prev)} />

      <main className="container relative z-10 mx-auto px-4 py-6 md:py-8">
        <div className="lg:hidden space-y-4 max-w-[780px] mx-auto">
          <ViewerStage {...stageProps} />

          <div className="panel-glass p-1 flex items-center gap-1">
            <button
              onClick={() => setMobilePanel("controls")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                mobilePanel === "controls"
                  ? "bg-[#E5004F] text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              编辑
            </button>
            <button
              onClick={() => setMobilePanel("export")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                mobilePanel === "export"
                  ? "bg-[#E5004F] text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              导出
            </button>
          </div>

          {mobilePanel === "controls" ? (
            <ViewerControlsPanel {...controlsPanelProps} />
          ) : (
            <ViewerExportPanel {...exportPanelProps} />
          )}
        </div>

        <div className="hidden lg:grid grid-cols-[380px_minmax(0,1fr)_340px] gap-6 items-start max-w-[1760px] mx-auto">
          <ViewerControlsPanel {...controlsPanelProps} />

          <ViewerStage {...stageProps} />

          <ViewerExportPanel {...exportPanelProps} />
        </div>
      </main>
    </div>
  );
}
