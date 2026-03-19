import { Button } from "../../../../../components/ui/button.jsx";
import { Input } from "../../../../../components/ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select.jsx";
import { Check, Pencil, Scaling } from "lucide-react";
import {
  ID_PHOTO_BG,
  encodeCustomBackground,
  getBackgroundSwatchStyle,
  isCustomBackground,
  isDarkBackground,
  normalizeCustomBackground,
} from "../../lib/backgroundStyle.js";

export const BACKGROUND_OPTIONS = [
  { id: "transparent", color: "transparent", label: "透明", border: "border-gray-200" },
  { id: "white", color: "#ffffff", label: "白色", border: "border-gray-200" },
  { id: "black", color: "#1a101f", label: "黑色", border: "border-gray-800" },
  { id: "id-standard", color: ID_PHOTO_BG, label: "蓝白渐变", border: "border-sky-400/70" },
  { id: "custom", color: "custom", label: "自定义", border: "border-[#E5004F]/45" },
];

export function ExportSettingsSection({
  backgroundColor,
  customBackground,
  customName,
  imageSize,
  isBatching,
  isDisabled,
  selectedModel,
  onBackgroundColorChange,
  onCustomBackgroundChange,
  onCustomNameChange,
  onImageSizeChange,
}) {
  const customBackgroundValue = encodeCustomBackground(customBackground);
  const selectedOptionId = isCustomBackground(backgroundColor)
    ? "custom"
    : BACKGROUND_OPTIONS.find((option) => option.color === backgroundColor)?.id || null;

  return (
    <>
      <div className="space-y-2">
        <div className={`flex gap-2 p-1 transition-opacity ${isBatching ? "opacity-50 pointer-events-none" : ""}`}>
          {BACKGROUND_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onBackgroundColorChange(option.id === "custom" ? customBackgroundValue : option.color)}
              disabled={isBatching}
              className={`relative w-8 h-8 rounded-full border shadow-sm transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E5004F] ${option.border} ${(option.id === "custom" ? selectedOptionId === "custom" : backgroundColor === option.color) ? "ring-2 ring-offset-1 ring-[#E5004F] scale-105" : ""}`}
              style={getBackgroundSwatchStyle(option.id === "custom" ? customBackgroundValue : option.color)}
              title={option.label}
            >
              {(option.id === "custom" ? selectedOptionId === "custom" : backgroundColor === option.color) ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className={`w-4 h-4 ${isDarkBackground(option.id === "custom" ? customBackgroundValue : option.color) ? "text-white" : "text-[#E5004F]"}`} strokeWidth={3} />
                </span>
              ) : null}
              {option.id === "custom" ? (
                <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a101f] border border-[#E5004F]/30 flex items-center justify-center shadow-sm">
                  <Pencil className="w-2.5 h-2.5 text-[#E5004F]" />
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {selectedOptionId === "custom" ? (
          <div className="mt-3 rounded-xl border border-[#E5004F]/20 bg-white/90 dark:bg-[#2a1d35]/70 p-3 space-y-3 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-200 space-y-1.5">
                <span className="block">主色</span>
                <input
                  type="color"
                  value={customBackground.primary}
                  onChange={(event) => onCustomBackgroundChange(normalizeCustomBackground({ ...customBackground, primary: event.target.value }))}
                  disabled={isBatching}
                  className="w-full h-10 rounded-lg border border-[#E5004F]/25 bg-white/70 dark:bg-[#1f1429]/70 p-1 cursor-pointer"
                />
              </label>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-200 space-y-1.5">
                <span className="block">主色透明度 {customBackground.alpha}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={customBackground.alpha}
                  onChange={(event) => onCustomBackgroundChange(normalizeCustomBackground({ ...customBackground, alpha: Number.parseInt(event.target.value, 10) }))}
                  disabled={isBatching}
                  className="w-full accent-[#E5004F]"
                />
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => onCustomBackgroundChange(normalizeCustomBackground({ ...customBackground, gradient: !customBackground.gradient }))}
              disabled={isBatching}
              className={`w-full h-9 rounded-lg border text-xs font-medium transition-all ${
                customBackground.gradient
                  ? "border-[#E5004F]/40 text-[#E5004F] bg-[#E5004F]/5"
                  : "border-[#E5004F]/20 text-gray-600 dark:text-gray-200 bg-white/50 dark:bg-[#24162f]/50"
              }`}
            >
              {customBackground.gradient ? "已启用渐变" : "启用渐变"}
            </Button>

            {customBackground.gradient ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200 space-y-1.5">
                  <span className="block">终点色</span>
                  <input
                    type="color"
                    value={customBackground.secondary}
                    onChange={(event) => onCustomBackgroundChange(normalizeCustomBackground({ ...customBackground, secondary: event.target.value }))}
                    disabled={isBatching}
                    className="w-full h-10 rounded-lg border border-[#E5004F]/25 bg-white/70 dark:bg-[#1f1429]/70 p-1 cursor-pointer"
                  />
                </label>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-200 space-y-1.5">
                  <span className="block">终点透明度 {customBackground.secondaryAlpha}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={customBackground.secondaryAlpha}
                    onChange={(event) => onCustomBackgroundChange(normalizeCustomBackground({ ...customBackground, secondaryAlpha: Number.parseInt(event.target.value, 10) }))}
                    disabled={isBatching}
                    className="w-full accent-[#E5004F]"
                  />
                </label>
                <div className="col-span-2">
                  <Select
                    value={customBackground.direction}
                    onValueChange={(value) => onCustomBackgroundChange(normalizeCustomBackground({ ...customBackground, direction: value }))}
                    disabled={isBatching}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-white/90 dark:bg-[#2a1d35]/70 border-[#E5004F]/20 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F] transition-all">
                      <SelectValue placeholder="渐变方向" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-[#E5004F]/15 dark:border-[#ff76a7]/25 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
                      <SelectItem value="to bottom" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">↓</SelectItem>
                      <SelectItem value="to right" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">→</SelectItem>
                      <SelectItem value="to top" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">↑</SelectItem>
                      <SelectItem value="to left" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">←</SelectItem>
                      <SelectItem value="to bottom right" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">↘</SelectItem>
                      <SelectItem value="to top left" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">↖</SelectItem>
                      <SelectItem value="to top right" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">↗</SelectItem>
                      <SelectItem value="to bottom left" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">↙</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Input
            value={customName}
            onChange={(event) => onCustomNameChange(event.target.value)}
            placeholder={selectedModel || "自定义文件名..."}
            disabled={isBatching || isDisabled}
            className="pl-9 h-11 rounded-xl bg-white/90 dark:bg-[#2a1d35]/70 border-[#E5004F]/20 dark:border-[#ff76a7]/25 focus:border-[#E5004F] transition-all"
          />
          <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <Select onValueChange={onImageSizeChange} value={imageSize} disabled={isBatching}>
          <SelectTrigger className="w-full h-11 rounded-xl bg-white/90 dark:bg-[#2a1d35]/70 border-[#E5004F]/20 dark:border-[#ff76a7]/25 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F] transition-all duration-300">
            <div className="flex items-center gap-2.5">
              <Scaling className="w-4 h-4 text-[#E5004F]" />
              <SelectValue placeholder="分辨率" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-[#E5004F]/15 dark:border-[#ff76a7]/25 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
            <SelectItem value="200" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">
              <span className="font-medium">200px × 200px</span>
              <span className="ml-2 text-xs text-muted-foreground">(NGA)</span>
            </SelectItem>
            <SelectItem value="400" className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 cursor-pointer">
              <span className="font-medium">400px × 400px</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
