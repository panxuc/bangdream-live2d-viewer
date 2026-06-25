"use client";

import { Bone, FolderOpen, Music, Star, UserRound, Wifi } from "lucide-react";
import { getSourceOptionKey, MODEL_PROVIDERS, MODEL_TYPES } from "@/src/features/viewer/lib/modelState";

const PROVIDER_OPTIONS = [
  {
    key: MODEL_PROVIDERS.GBP,
    label: "Girls Band Party",
    icon: Star,
  },
  {
    key: MODEL_PROVIDERS.ON,
    label: "Our Notes",
    icon: Music,
  },
];

const TYPE_OPTIONS = [
  {
    key: MODEL_TYPES.LIVE2D,
    label: "Live2D",
    icon: UserRound,
  },
  {
    key: MODEL_TYPES.SPINE,
    label: "Spine",
    icon: Bone,
  },
];

const SOURCE_OPTIONS = [
  {
    key: "remote",
    label: "在线",
    icon: Wifi,
  },
  {
    key: "local",
    label: "本地",
    icon: FolderOpen,
  },
];

const buttonClassName = (isActive, isBatching) =>
  `h-10 rounded-xl border text-xs font-semibold transition-all ${
    isActive
      ? "border-[#E5004F] bg-[#E5004F]/10 text-[#E5004F]"
      : "border-[#E5004F]/20 text-gray-500 dark:text-gray-300 hover:border-[#E5004F]/50"
  } ${isBatching ? "opacity-50 cursor-not-allowed" : ""}`;

const SegmentedRow = ({ label, options, activeKey, isBatching, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-400 uppercase block px-1">{label}</label>
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/[0.03] p-1 dark:bg-white/[0.04]">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => !isBatching && activeKey !== option.key && onChange(option.key)}
            disabled={isBatching}
            className={buttonClassName(activeKey === option.key, isBatching)}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export function ModelSourceSection({
  modelProvider,
  modelType,
  modelSource,
  isBatching,
  handleModelProviderChange,
  handleModelSourceChange,
}) {
  const activeProvider = modelProvider || MODEL_PROVIDERS.GBP;

  const handleTypeChange = (nextModelType) => {
    handleModelSourceChange(getSourceOptionKey(nextModelType, modelSource));
  };

  const handleSourceChange = (nextModelSource) => {
    handleModelSourceChange(getSourceOptionKey(modelType, nextModelSource));
  };

  return (
    <div className="control-group">
      <div className="space-y-4">
        <SegmentedRow
          label="作品来源"
          options={PROVIDER_OPTIONS}
          activeKey={activeProvider}
          isBatching={isBatching}
          onChange={handleModelProviderChange}
        />
        {activeProvider === MODEL_PROVIDERS.GBP ? (
          <>
            <SegmentedRow
              label="模型类型"
              options={TYPE_OPTIONS}
              activeKey={modelType}
              isBatching={isBatching}
              onChange={handleTypeChange}
            />
            <SegmentedRow
              label="资源来源"
              options={SOURCE_OPTIONS}
              activeKey={modelSource}
              isBatching={isBatching}
              onChange={handleSourceChange}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
