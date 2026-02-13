"use client";

import { CharacterSelect, ModelSelect, MotionSelect, ExpressionSelect, SimpleSlider, LocalModelUpload } from "@/src/features/viewer/components/controls";
import { ChevronDown, ChevronUp, FolderOpen, Layers, Move, Plus, Settings, Shirt, Shuffle, Skull, Sparkles, Trash2, Wifi } from "lucide-react";

export function ViewerControlsPanel({
  models,
  activeModel,
  activeModelId,
  activeModelIndex,
  isBatching,
  isReloading,
  isUploadingLocalModel,
  maxModels,
  setActiveModelId,
  handleAddModel,
  handleRemoveModel,
  handleMoveModel,
  handleCharacterSelect,
  handleModelSelect,
  handleModelSourceChange,
  handleModelReload,
  handleBodylessChange,
  handleHeadlessChange,
  handleModifiedChange,
  handleBorrowingToggle,
  handleMotionSelect,
  handleMotionOverride,
  handleSourceCharChange,
  handleExpressionSelect,
  handleTransformChange,
  handleLocalArchiveUpload,
  handleLocalModelPathSelect,
  handleApplyLocalModel,
}) {
  return (
    <div className="lg:sticky lg:top-28 space-y-6">
      <div className="panel-glass p-4 md:p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E5004F]" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">图层列表 ({models.length}/{maxModels})</h3>
          </div>
          <button
            onClick={handleAddModel}
            disabled={models.length >= maxModels || isBatching}
            className={`p-1.5 rounded-xl transition-all ${models.length >= maxModels || isBatching ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500" : "bg-[#E5004F]/10 text-[#E5004F] hover:bg-[#E5004F] hover:text-white hover:scale-105"}`}
            title={models.length >= maxModels ? "已达到最大图层数" : "添加模型"}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {models.map((model, index) => (
            <div
              key={model.id}
              onClick={() => !isBatching && setActiveModelId(model.id)}
              className={`flex items-center justify-between p-2 rounded-xl text-sm transition-all group ${isBatching ? "cursor-not-allowed opacity-80" : "cursor-pointer"} ${model.id === activeModelId ? "bg-white/90 dark:bg-[#24192f] border-[#E5004F]/55 shadow-sm border" : "border border-transparent hover:bg-white/50 dark:hover:bg-gray-800/50"}`}
            >
              <div className="flex items-center gap-2 truncate flex-1">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500 flex-shrink-0">{index + 1}</span>
                <span className="truncate font-medium text-gray-700 dark:text-gray-300">
                  {model.modelSource === "local" && model.localModelLabel
                    ? model.localModelLabel
                    : model.modelId
                      ? model.modelId
                      : model.characterId
                        ? `角色 ${model.characterId}`
                        : "空图层"}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {model.isModified && (
                    <span className="text-[10px] text-[#E5004F]">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  )}
                  {model.borrowedModelId && (
                    <span className="text-[10px] text-blue-500">
                      <Shuffle className="w-3 h-3" />
                    </span>
                  )}
                  {model.isBodyless && (
                    <span className="text-[10px] text-purple-500">
                      <Skull className="w-3 h-3" />
                    </span>
                  )}
                  {model.isHeadless && (
                    <span className="text-[10px] text-blue-500">
                      <Shirt className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
              {models.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveModel(model.id, "up");
                    }}
                    disabled={isBatching || index === 0}
                    className="p-1 text-gray-400 hover:text-[#E5004F] hover:bg-[#E5004F]/10 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                    title="上移图层"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveModel(model.id, "down");
                    }}
                    disabled={isBatching || index === models.length - 1}
                    className="p-1 text-gray-400 hover:text-[#E5004F] hover:bg-[#E5004F]/10 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                    title="下移图层"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveModel(model.id);
                    }}
                    disabled={isBatching}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                    title="删除图层"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="panel-glass p-5 md:p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#E5004F]" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">编辑图层 #{activeModelIndex + 1}</h2>
          </div>
          {models.length > 1 && (
            <button
              onClick={() => handleRemoveModel(activeModelId)}
              disabled={isBatching}
              className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="删除当前图层"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-5">
          <div className="control-group">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">模型来源</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => !isBatching && handleModelSourceChange("remote")}
                disabled={isBatching}
                className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
                  activeModel.modelSource === "remote"
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
                  activeModel.modelSource === "local"
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

          {activeModel.modelSource === "remote" ? (
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
                />
              </div>
            </>
          ) : (
            <LocalModelUpload
              disabled={isBatching}
              isUploading={isUploadingLocalModel}
              isReloading={isReloading}
              localModelFileName={activeModel.localModelFileName}
              localModelCandidates={activeModel.localModelCandidates}
              localModelPath={activeModel.localModelPath}
              localModelError={activeModel.localModelError}
              onUploadArchive={handleLocalArchiveUpload}
              onSelectModelPath={handleLocalModelPathSelect}
              onApplyModel={handleApplyLocalModel}
              onReload={handleModelReload}
            />
          )}

          <div className="control-group">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase">动作</label>
              <button
                onClick={() => !isBatching && handleBorrowingToggle()}
                disabled={isBatching}
                className={`transition-all duration-300 transform active:scale-95 ${activeModel.isBorrowingMotion ? "text-[#E5004F] drop-shadow-sm" : "text-gray-300 dark:text-gray-600 hover:text-gray-400"} ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
                title={activeModel.isBorrowingMotion ? "关闭动作借用" : "借用其他模型的动作"}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
            <MotionSelect
              modelData={activeModel.modelData}
              onSelect={handleMotionSelect}
              value={activeModel.motion}
              disabled={isBatching}
              onMotionOverride={handleMotionOverride}
              isBorrowing={activeModel.isBorrowingMotion}
              borrowedCharId={activeModel.borrowedCharId}
              borrowedModelId={activeModel.borrowedModelId}
              onSourceCharChange={handleSourceCharChange}
            />
          </div>

          <div className="control-group">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">表情</label>
            <ExpressionSelect modelData={activeModel.modelData} onSelect={handleExpressionSelect} value={activeModel.expression} disabled={isBatching} />
          </div>

          {(activeModel.modelSource === "local" ? !!activeModel.localModelData : !!activeModel.modelId) && (
            <div className="pt-4 border-t border-black/5 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Move className="w-4 h-4 text-[#E5004F]" />
                <span className="text-xs font-bold text-gray-400 uppercase">变换</span>
              </div>
              <SimpleSlider label="X 轴偏移" min={-400} max={400} step={5} value={activeModel.x} onChange={(v) => handleTransformChange("x", v)} disabled={isBatching} defaultValue={0} />
              <SimpleSlider label="Y 轴偏移" min={-400} max={400} step={5} value={activeModel.y} onChange={(v) => handleTransformChange("y", v)} disabled={isBatching} defaultValue={0} />
              <SimpleSlider label="缩放" min={0.1} max={0.7} step={0.05} value={activeModel.scale} onChange={(v) => handleTransformChange("scale", v)} disabled={isBatching} defaultValue={0.25} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
