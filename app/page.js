"use client";

import { useState } from "react";
import { ViewerControlsPanel, ViewerExportPanel, ViewerFooter, ViewerHeader, ViewerStage } from "@/src/features/viewer/components";
import { MAX_MODELS, useViewerPageState } from "@/src/features/viewer/hooks/useViewerPageState";

export default function Home() {
  const state = useViewerPageState();
  const [mobilePanel, setMobilePanel] = useState("controls");
  const stageProps = {
    models: state.models,
    canvasRef: state.canvasRef,
    backgroundColor: state.backgroundColor,
    onModelLoad: state.handleModelLoad,
    onModelError: state.handleModelError,
    onSyncComplete: state.handleCanvasSyncComplete,
    onLive2DParameterSnapshot: state.handleLive2DParameterSnapshot,
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
    handleSpineCharacterSelect: state.handleSpineCharacterSelect,
    handleModelSelect: state.handleModelSelect,
    handleSpineModelSelect: state.handleSpineModelSelect,
    handleModelProviderChange: state.handleModelProviderChange,
    handleOnCharacterSelect: state.handleOnCharacterSelect,
    handleOnModelSelect: state.handleOnModelSelect,
    handleModelSourceChange: state.handleModelSourceChange,
    handleModelReload: state.handleModelReload,
    handleBodylessChange: state.handleBodylessChange,
    handleHeadlessChange: state.handleHeadlessChange,
    handleModifiedChange: state.handleModifiedChange,
    handleBorrowingToggle: state.handleBorrowingToggle,
    handleApplyBorrowingToAllLayers: state.handleApplyBorrowingToAllLayers,
    handleMotionSelect: state.handleMotionSelect,
    handleMotionLoopChange: state.handleMotionLoopChange,
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
    isBatching: state.isBatching,
    live2dParameterValues: state.activeLive2DParameterValues,
    canvasRef: state.canvasRef,
    backgroundColor: state.backgroundColor,
    setBackgroundColor: state.setBackgroundColor,
    handleModelReload: state.handleModelReload,
    handleLive2DParameterChange: state.handleLive2DParameterChange,
    handleLive2DParameterReset: state.handleLive2DParameterReset,
    handleLive2DParameterResetAll: state.handleLive2DParameterResetAll,
    setIsBatching: state.setIsBatching,
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 overflow-x-hidden selection:bg-[#E5004F] selection:text-white ${state.isDarkMode ? "bg-[#141118] text-gray-100" : "bg-[#f8f8fb] text-gray-800"}`}>
      <ViewerHeader isDarkMode={state.isDarkMode} onToggleDarkMode={() => state.setIsDarkMode((prev) => !prev)} />

      <main className="relative z-10 w-full px-4 py-6 md:px-6 md:py-8 min-[800px]:px-8">
        <div className="viewer-layout-mobile space-y-4 w-full max-w-[56rem] mx-auto">
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

        <div className="viewer-layout-stacked grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)] gap-2 items-start w-full max-w-[min(100%,96rem)] mx-auto">
          <div className="min-w-0">
            <ViewerControlsPanel {...controlsPanelProps} />
          </div>

          <div className="min-w-0 w-full max-w-[42rem] justify-self-center space-y-2">
            <ViewerStage {...stageProps} />
            <ViewerExportPanel {...exportPanelProps} />
          </div>
        </div>

        <div className="viewer-layout-wide gap-2 items-start w-full max-w-[min(100%,112rem)] mx-auto">
          <div className="min-w-[18rem] max-w-[30rem] flex-[1.05_1_23rem]">
            <ViewerControlsPanel {...controlsPanelProps} />
          </div>

          <div className="min-w-[18rem] flex-[1.3_1_31rem]">
            <ViewerStage {...stageProps} />
          </div>

          <div className="min-w-[18rem] max-w-[28rem] flex-[0.95_1_21rem]">
            <ViewerExportPanel {...exportPanelProps} />
          </div>
        </div>

        <ViewerFooter />
      </main>
    </div>
  );
}
