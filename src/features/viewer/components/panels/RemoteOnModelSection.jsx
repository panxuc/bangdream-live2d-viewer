"use client";

import { OnCharacterSelect, OnModelSelect } from "@/src/features/viewer/components/controls";

export function RemoteOnModelSection({
  activeModel,
  isBatching,
  isReloading,
  handleOnCharacterSelect,
  handleOnModelSelect,
  handleModelReload,
}) {
  return (
    <>
      <div className="control-group">
        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">角色</label>
        <OnCharacterSelect
          onSelect={handleOnCharacterSelect}
          value={activeModel.characterId}
          disabled={isBatching}
        />
      </div>

      <div className="control-group">
        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">模型</label>
        <OnModelSelect
          characterId={activeModel.characterId}
          onSelect={handleOnModelSelect}
          value={activeModel.modelId}
          onReload={handleModelReload}
          disabled={isBatching}
          isReloading={isReloading}
        />
      </div>
    </>
  );
}
