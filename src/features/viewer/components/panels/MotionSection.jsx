import { MotionSelect } from "../controls/index.js";
import { Repeat, Shuffle } from "lucide-react";

export function MotionSection({
  activeModel,
  isBatching,
  supportsBorrowing,
  handleBorrowingToggle,
  handleMotionSelect,
  handleMotionLoopChange,
  handleMotionOverride,
  handleSourceCharChange,
  handleApplyBorrowingToAllLayers,
}) {
  const isSpine = activeModel.modelType === "spine";

  return (
    <div className="control-group">
      <div className="flex items-center justify-between px-1 mb-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase">{isSpine ? "动画" : "动作"}</label>
        <div className="flex items-center gap-2">
          {isSpine ? (
            <button
              type="button"
              onClick={() => !isBatching && handleMotionLoopChange(!activeModel.motionLoop)}
              disabled={isBatching}
              className={`transition-all duration-300 transform active:scale-95 ${
                activeModel.motionLoop
                  ? "text-[#E5004F] drop-shadow-sm"
                  : "text-gray-300 dark:text-gray-600 hover:text-gray-400"
              } ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
              title={activeModel.motionLoop ? "关闭循环播放" : "开启循环播放"}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          ) : null}
          {supportsBorrowing ? (
            <button
              onClick={() => !isBatching && handleBorrowingToggle()}
              disabled={isBatching}
              className={`transition-all duration-300 transform active:scale-95 ${activeModel.isBorrowingMotion ? "text-[#E5004F] drop-shadow-sm" : "text-gray-300 dark:text-gray-600 hover:text-gray-400"} ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
              title={activeModel.isBorrowingMotion ? "关闭动作借用" : "借用其他模型的动作"}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
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
