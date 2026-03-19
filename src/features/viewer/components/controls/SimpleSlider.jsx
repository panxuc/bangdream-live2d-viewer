import { RotateCcw } from "lucide-react";

export function SimpleSlider({ value, min, max, step, onChange, label, disabled, defaultValue }) {
  return (
    <div className={`space-y-2 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-bold uppercase">{label}</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const nextValue = parseFloat(e.target.value);
              if (Number.isNaN(nextValue)) return;
              onChange(nextValue);
            }}
            disabled={disabled}
            className="w-16 h-6 px-1 text-right bg-white/90 dark:bg-[#2a1d35]/70 border border-[#E5004F]/20 dark:border-[#ff76a7]/25 rounded-md focus:border-[#E5004F] focus:outline-none transition-colors"
          />
          <button
            onClick={() => onChange(defaultValue)}
            disabled={disabled || value === defaultValue}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${value !== defaultValue ? "text-[#E5004F]" : "text-gray-300 dark:text-gray-600 cursor-default"}`}
            title={`重置为 ${defaultValue}`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#E5004F] hover:accent-[#ff4785] transition-all"
      />
    </div>
  );
}
