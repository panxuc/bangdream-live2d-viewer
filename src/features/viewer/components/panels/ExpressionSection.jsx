import { ExpressionSelect } from "../controls/index.js";
import { Shuffle } from "lucide-react";

export function ExpressionSection({
  activeModel,
  isBatching,
  handleExpressionBorrowingToggle,
  handleExpressionOverride,
  handleExpressionSourceCharChange,
  handleExpressionSelect,
}) {
  return (
    <div className="control-group">
      <div className="flex items-center justify-between px-1 mb-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase">表情</label>
        <button
          onClick={() => !isBatching && handleExpressionBorrowingToggle()}
          disabled={isBatching}
          className={`transition-all duration-300 transform active:scale-95 ${activeModel.isBorrowingExpression ? "text-[#E5004F] drop-shadow-sm" : "text-gray-300 dark:text-gray-600 hover:text-gray-400"} ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`}
          title={activeModel.isBorrowingExpression ? "关闭表情借用" : "借用其他模型的表情"}
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>
      </div>
      <ExpressionSelect
        modelData={activeModel.modelData}
        onSelect={handleExpressionSelect}
        value={activeModel.expression}
        disabled={isBatching}
        onExpressionOverride={handleExpressionOverride}
        isBorrowing={activeModel.isBorrowingExpression}
        borrowedCharId={activeModel.borrowedExpressionCharId}
        borrowedModelId={activeModel.borrowedExpressionModelId}
        onSourceCharChange={handleExpressionSourceCharChange}
      />
    </div>
  );
}
