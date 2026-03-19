import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { SelectItem } from "../../../../../components/ui/select.jsx";
import { useCharacters, useCategories } from "../../../catalog/hooks/useCatalog.js";
import { getCharacterAvailabilityApiUrl } from "../../../../config/urls.js";
import { hasAvailableModelForCharacter } from "../../lib/characterIdAliases.js";
import { fetchJson } from "../../../../lib/fetchJson.js";
import { Users } from "lucide-react";
import { CharacterFilterPopover } from "./CharacterFilterPopover.jsx";
import { SelectField, selectItemClass } from "./shared/SelectField.jsx";
import useSWR from "swr";

const CharacterSelect = memo(function CharacterSelect({
  onSelect,
  value,
  disabled,
  showFilter = true,
  modelType = null,
  isModified = false,
  hideWithoutModels = false,
}) {
  const { characters = [], loading: charactersLoading } = useCharacters();
  const { categories: allCategories = [] } = useCategories();
  const availabilityKey =
    hideWithoutModels && modelType ? getCharacterAvailabilityApiUrl(modelType, isModified) : null;
  const { data: availabilityData, isLoading: availabilityLoading } = useSWR(
    availabilityKey,
    fetchJson,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    },
  );

  const [selectedCategories, setSelectedCategories] = useState({});
  const [filterMode, setFilterMode] = useState("whitelist");

  useEffect(() => {
    if (allCategories.length > 0 && Object.keys(selectedCategories).length === 0) {
      setSelectedCategories(Object.fromEntries(allCategories.map(cat => [cat, true])));
    }
  }, [allCategories, selectedCategories]);

  const filteredCharacters = useMemo(() => {
    if (!characters.length) return [];
    const hasAvailabilityData = Array.isArray(availabilityData?.availableCharacterIds);
    const availableCharacterIds = new Set(hasAvailabilityData ? availabilityData.availableCharacterIds : []);

    return characters.filter(char => {
      if (
        hideWithoutModels &&
        hasAvailabilityData &&
        !availabilityLoading &&
        !hasAvailableModelForCharacter(char.id, availableCharacterIds)
      ) {
        return false;
      }

      const hasSelectedCategory = char.category.some(cat => selectedCategories[cat]);
      const hasUnselectedCategory = char.category.some(cat => !selectedCategories[cat]);
      return filterMode === "whitelist" ? hasSelectedCategory : hasUnselectedCategory;
    });
  }, [characters, selectedCategories, filterMode, availabilityData?.availableCharacterIds, availabilityLoading, hideWithoutModels]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  return (
    <div className="flex items-center gap-2 w-full">
      {/* 1. 下拉选择框 (占据主要空间) */}
      <div className="flex-1 min-w-0">
        <SelectField
          value={value}
          onValueChange={onSelect}
          disabled={disabled}
          icon={Users}
          placeholder="请选择角色..."
          emptyState={
            charactersLoading || (hideWithoutModels && availabilityLoading) ? (
              <div className="p-2 text-center text-sm text-muted-foreground animate-pulse">加载中...</div>
            ) : filteredCharacters.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">未找到角色</div>
            ) : null
          }
        >
          {filteredCharacters.map((character) => (
            <SelectItem key={character.id} value={character.id.toString()} className={selectItemClass}>
              {character.name}
            </SelectItem>
          ))}
        </SelectField>
      </div>

      {/* 2. 筛选按钮 (放在同一行，紧凑的方形按钮) */}
      {showFilter ? (
        <CharacterFilterPopover
          disabled={disabled}
          allCategories={allCategories}
          selectedCategories={selectedCategories}
          filterMode={filterMode}
          onModeChange={setFilterMode}
          onCategoryToggle={handleCategoryChange}
        />
      ) : null}
    </div>
  );
});

export { CharacterSelect };
