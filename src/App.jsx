import { lazy, Suspense, useState } from "react";
import { ViewerControlsPanel } from "./features/viewer/components/panels/ViewerControlsPanel.jsx";
import { ViewerFooter } from "./features/viewer/components/layout/ViewerFooter.jsx";
import { ViewerHeader } from "./features/viewer/components/layout/ViewerHeader.jsx";
import { ViewerExportPanel } from "./features/viewer/components/panels/index.js";
import { MAX_MODELS, useViewerPageState } from "./features/viewer/hooks/useViewerPageState.js";

const ViewerStage = lazy(() =>
  import("./features/viewer/components/layout/ViewerStage.jsx").then((module) => ({
    default: module.ViewerStage,
  })),
);

function ViewerStageSkeleton() {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full">
        <div className="relative panel-glass overflow-hidden">
          <div className="h-9 bg-white/70 dark:bg-[#26222d] flex items-center px-4 justify-between border-b border-black/5 dark:border-white/10">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E5004F]/40" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
              <div className="w-2 h-2 rounded-full bg-blue-400/40" />
            </div>
            <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500">舞台加载中</div>
          </div>
          <div className="aspect-square bg-white/30 dark:bg-[#1b1821] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const state = useViewerPageState();
  const [mobilePanel, setMobilePanel] = useState("controls");
  const stageProps = {
    models: state.models,
    canvasRef: state.canvasRef,
    backgroundColor: state.backgroundColor,
    onModelLoad: state.handleModelLoad,
    onModelError: state.handleModelError,
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
    handleSpineCharacterSelect: state.handleSpineCharacterSelect,
    handleModelSelect: state.handleModelSelect,
    handleSpineModelSelect: state.handleSpineModelSelect,
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
    canvasRef: state.canvasRef,
    backgroundColor: state.backgroundColor,
    setBackgroundColor: state.setBackgroundColor,
    handleModelReload: state.handleModelReload,
    setIsBatching: state.setIsBatching,
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 overflow-x-hidden selection:bg-[#E5004F] selection:text-white ${state.isDarkMode ? "bg-[#141118] text-gray-100" : "bg-[#f8f8fb] text-gray-800"}`}>
      <ViewerHeader isDarkMode={state.isDarkMode} onToggleDarkMode={() => state.setIsDarkMode((prev) => !prev)} />

      <main className="relative z-10 w-full px-4 py-6 md:px-6 md:py-8 min-[800px]:px-8">
        <div className="viewer-layout-mobile space-y-4 w-full max-w-[56rem] mx-auto">
          <Suspense fallback={<ViewerStageSkeleton />}>
            <ViewerStage {...stageProps} />
          </Suspense>

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
            <Suspense fallback={<ViewerStageSkeleton />}>
              <ViewerStage {...stageProps} />
            </Suspense>
            <ViewerExportPanel {...exportPanelProps} />
          </div>
        </div>

        <div className="viewer-layout-wide gap-2 items-start w-full max-w-[min(100%,112rem)] mx-auto">
          <div className="min-w-[18rem] max-w-[30rem] flex-[1.05_1_23rem]">
            <ViewerControlsPanel {...controlsPanelProps} />
          </div>

          <div className="min-w-[18rem] flex-[1.3_1_31rem]">
            <Suspense fallback={<ViewerStageSkeleton />}>
              <ViewerStage {...stageProps} />
            </Suspense>
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
