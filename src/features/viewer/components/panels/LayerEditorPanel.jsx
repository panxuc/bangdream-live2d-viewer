"use client";

import { LocalModelUpload } from "@/src/features/viewer/components/controls";
import { Settings, Trash2 } from "lucide-react";
import { ExpressionSection } from "./ExpressionSection";
import { ModelSourceSection } from "./ModelSourceSection";
import { MotionSection } from "./MotionSection";
import { RemoteModelSection } from "./RemoteModelSection";
import { TransformSection } from "./TransformSection";

export function LayerEditorPanel({
  models,
  activeModel,
  activeModelId,
  activeModelIndex,
  isBatching,
  isReloading,
  isUploadingLocalModel,
  setActiveModelId,
  handleRemoveModel,
  handleCharacterSelect,
  handleModelSelect,
  handleModelSourceChange,
  handleModelReload,
  handleBodylessChange,
  handleHeadlessChange,
  handleModifiedChange,
  handleBorrowingToggle,
  handleApplyBorrowingToAllLayers,
  handleMotionSelect,
  handleMotionOverride,
  handleSourceCharChange,
  handleExpressionOverride,
  handleExpressionBorrowingToggle,
  handleExpressionSourceCharChange,
  handleExpressionSelect,
  handleTransformChange,
  handleLocalArchiveUpload,
  handleLocalModelPathSelect,
  handleApplyLocalModel,
}) {
  return (
    <div className="panel-glass p-5 md:p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#E5004F]" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">编辑图层 #{activeModelIndex + 1}</h2>
        </div>
        {models.length > 1 ? (
          <button
            onClick={() => handleRemoveModel(activeModelId)}
            disabled={isBatching}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="删除当前图层"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      <div className="space-y-5">
        <ModelSourceSection
          modelSource={activeModel.modelSource}
          isBatching={isBatching}
          handleModelSourceChange={handleModelSourceChange}
        />

        {activeModel.modelSource === "remote" ? (
          <RemoteModelSection
            activeModel={activeModel}
            isBatching={isBatching}
            isReloading={isReloading}
            handleCharacterSelect={handleCharacterSelect}
            handleModelSelect={handleModelSelect}
            handleModelReload={handleModelReload}
            handleBodylessChange={handleBodylessChange}
            handleHeadlessChange={handleHeadlessChange}
            handleModifiedChange={handleModifiedChange}
          />
        ) : (
          <LocalModelUpload
            disabled={isBatching}
            isUploading={isUploadingLocalModel}
            isReloading={isReloading}
            localModelFileName={activeModel.localModelFileName}
            localArchiveToken={activeModel.localArchiveToken}
            localModelCandidates={activeModel.localModelCandidates}
            localModelPath={activeModel.localModelPath}
            localModelError={activeModel.localModelError}
            onUploadArchive={handleLocalArchiveUpload}
            onSelectModelPath={handleLocalModelPathSelect}
            onApplyModel={handleApplyLocalModel}
            onReload={handleModelReload}
          />
        )}

        <MotionSection
          activeModel={activeModel}
          isBatching={isBatching}
          handleBorrowingToggle={handleBorrowingToggle}
          handleMotionSelect={handleMotionSelect}
          handleMotionOverride={handleMotionOverride}
          handleSourceCharChange={handleSourceCharChange}
          handleApplyBorrowingToAllLayers={handleApplyBorrowingToAllLayers}
        />

        <ExpressionSection
          activeModel={activeModel}
          isBatching={isBatching}
          handleExpressionBorrowingToggle={handleExpressionBorrowingToggle}
          handleExpressionOverride={handleExpressionOverride}
          handleExpressionSourceCharChange={handleExpressionSourceCharChange}
          handleExpressionSelect={handleExpressionSelect}
        />

        {(activeModel.modelSource === "local" ? !!activeModel.localModelData : !!activeModel.modelId) ? (
          <TransformSection
            activeModel={activeModel}
            isBatching={isBatching}
            handleTransformChange={handleTransformChange}
          />
        ) : null}
      </div>
    </div>
  );
}
