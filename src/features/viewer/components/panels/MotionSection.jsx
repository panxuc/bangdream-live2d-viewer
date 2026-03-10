"use client";

import { MotionSelect } from "@/src/features/viewer/components/controls";
import { Shuffle } from "lucide-react";

export function MotionSection({
  activeModel,
  isBatching,
  handleBorrowingToggle,
  handleMotionSelect,
  handleMotionOverride,
  handleSourceCharChange,
  handleApplyBorrowingToAllLayers,
}) {
  return (
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
        onApplyToAllLayers={handleApplyBorrowingToAllLayers}
      />
    </div>
  );
}
