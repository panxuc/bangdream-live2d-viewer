"use client";

import { ChevronDown, ChevronUp, Copy, GripVertical, Layers, Maximize2, Minimize2, Plus, Shirt, Shuffle, Skull, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

export function LayerListPanel({
  models,
  activeModelId,
  isBatching,
  maxModels,
  isWideControlsLayout,
  isLayerListExpanded,
  setIsLayerListExpanded,
  setActiveModelId,
  handleAddModel,
  handleDuplicateModel,
  handleRemoveModel,
  handleMoveModel,
  handleReorderModels,
}) {
  const [draggedModelId, setDraggedModelId] = useState(null);
  const [dragOverModelId, setDragOverModelId] = useState(null);
  const isLayerListOpen = isWideControlsLayout || isLayerListExpanded;

  const handleLayerDragStart = (event, modelId) => {
    if (isBatching) return;
    setDraggedModelId(modelId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", modelId);
  };

  const handleLayerDrop = (event, targetModelId) => {
    event.preventDefault();
    if (isBatching) return;

    const draggingId = draggedModelId || event.dataTransfer.getData("text/plain");
    if (!draggingId || draggingId === targetModelId) return;

    handleReorderModels(draggingId, targetModelId);
    setActiveModelId(draggingId);
    setDraggedModelId(null);
    setDragOverModelId(null);
  };

  return (
    <div className="panel-glass p-4 md:p-5">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#E5004F]" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">图层列表 ({models.length}/{maxModels})</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {!isWideControlsLayout ? (
            <button
              onClick={() => setIsLayerListExpanded((prev) => !prev)}
              className="p-1.5 rounded-xl transition-all bg-gray-100 text-gray-500 hover:text-[#E5004F] hover:bg-[#E5004F]/10 dark:bg-gray-800 dark:text-gray-300"
              title={isLayerListExpanded ? "收起图层列表" : "展开图层列表"}
            >
              {isLayerListExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          ) : null}
          <button
            onClick={handleAddModel}
            disabled={models.length >= maxModels || isBatching}
            className={`p-1.5 rounded-xl transition-all ${
              models.length >= maxModels || isBatching
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-[#E5004F]/10 text-[#E5004F] hover:bg-[#E5004F] hover:text-white hover:scale-105"
            }`}
            title={models.length >= maxModels ? "已达到最大图层数" : "添加模型"}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 ${isLayerListOpen ? "max-h-none overflow-visible" : "max-h-[150px] overflow-y-auto"}`}>
        {models.map((model, index) => (
          <div
            key={model.id}
            draggable={!isBatching}
            onDragStart={(event) => handleLayerDragStart(event, model.id)}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isBatching) setDragOverModelId(model.id);
            }}
            onDragLeave={() => {
              if (dragOverModelId === model.id) setDragOverModelId(null);
            }}
            onDrop={(event) => handleLayerDrop(event, model.id)}
            onDragEnd={() => {
              setDraggedModelId(null);
              setDragOverModelId(null);
            }}
            onClick={() => !isBatching && setActiveModelId(model.id)}
            className={`flex items-center justify-between p-2 rounded-xl text-sm transition-all group ${
              isBatching ? "cursor-not-allowed opacity-80" : "cursor-pointer"
            } ${
              dragOverModelId === model.id ? "ring-1 ring-[#E5004F] bg-[#E5004F]/5" : ""
            } ${
              model.id === activeModelId
                ? "bg-white/90 dark:bg-[#24192f] border-[#E5004F]/55 shadow-sm border"
                : "border border-transparent hover:bg-white/50 dark:hover:bg-gray-800/50"
            }`}
          >
            <div className="flex items-center gap-2 truncate flex-1">
              <GripVertical className={`w-3.5 h-3.5 flex-shrink-0 ${isBatching ? "text-gray-300" : "text-gray-400"}`} />
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
                {model.isModified ? <Sparkles className="w-3 h-3 text-[#E5004F]" /> : null}
                {model.borrowedModelId ? <Shuffle className="w-3 h-3 text-blue-500" /> : null}
                {model.isBodyless ? <Skull className="w-3 h-3 text-purple-500" /> : null}
                {model.isHeadless ? <Shirt className="w-3 h-3 text-blue-500" /> : null}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleDuplicateModel(model.id);
                }}
                disabled={isBatching || models.length >= maxModels}
                className="p-1 text-gray-400 hover:text-[#E5004F] hover:bg-[#E5004F]/10 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                title={models.length >= maxModels ? "已达到最大图层数" : "复制图层"}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {models.length > 1 ? (
                <>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMoveModel(model.id, "up");
                    }}
                    disabled={isBatching || index === 0}
                    className="p-1 text-gray-400 hover:text-[#E5004F] hover:bg-[#E5004F]/10 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                    title="上移图层"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMoveModel(model.id, "down");
                    }}
                    disabled={isBatching || index === models.length - 1}
                    className="p-1 text-gray-400 hover:text-[#E5004F] hover:bg-[#E5004F]/10 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                    title="下移图层"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveModel(model.id);
                    }}
                    disabled={isBatching}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                    title="删除图层"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
