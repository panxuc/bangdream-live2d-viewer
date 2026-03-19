import { CharacterSelect, ModelDownloadButton, SpineModelSelect } from "../controls/index.js";

export function RemoteSpineSection({
  activeModel,
  isBatching,
  isReloading,
  handleSpineCharacterSelect,
  handleSpineModelSelect,
  handleModelReload,
}) {
  return (
    <>
      <div className="control-group">
        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block px-1">角色</label>
        <CharacterSelect
          onSelect={handleSpineCharacterSelect}
          value={activeModel.characterId}
          disabled={isBatching}
          modelType="spine"
          hideWithoutModels
        />
      </div>

      <div className="control-group">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase">模型</label>
        </div>

        <SpineModelSelect
          characterId={activeModel.characterId}
          onSelect={handleSpineModelSelect}
          value={activeModel.modelId}
          onReload={handleModelReload}
          disabled={isBatching}
          isReloading={isReloading}
          trailingActions={
            <ModelDownloadButton
              modelId={activeModel.modelId}
              disabled={isBatching}
              modelType="spine"
            />
          }
        />

        {activeModel.localModelError ? <p className="text-xs text-red-500 px-1 mt-2">{activeModel.localModelError}</p> : null}
      </div>
    </>
  );
}
