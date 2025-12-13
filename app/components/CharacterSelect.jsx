"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCharacters, useCategories } from "../hooks/useCharacters";
import { Filter, SlidersHorizontal, Users } from "lucide-react"; // 新增 Users 图标

const CharacterSelect = memo(function CharacterSelect({ onSelect, value }) {
  const { characters = [], loading: charactersLoading } = useCharacters();
  const { categories: allCategories = [], loading: categoriesLoading } = useCategories();

  const [selectedCategories, setSelectedCategories] = useState({});
  const [filterMode, setFilterMode] = useState("whitelist");

  // 初始化选中的分类
  useMemo(() => {
    if (allCategories.length > 0 && Object.keys(selectedCategories).length === 0) {
      setSelectedCategories(Object.fromEntries(allCategories.map(cat => [cat, true])));
    }
  }, [allCategories, selectedCategories]);

  const filteredCharacters = useMemo(() => {
    if (!characters.length) return [];

    return characters.filter(char => {
      const hasSelectedCategory = char.category.some(cat => selectedCategories[cat]);
      const hasUnselectedCategory = char.category.some(cat => !selectedCategories[cat]);
      return filterMode === "whitelist" ? hasSelectedCategory : hasUnselectedCategory;
    });
  }, [characters, selectedCategories, filterMode]);

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
        <Select onValueChange={onSelect} value={value}>
          <SelectTrigger
            className="w-full h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-[#E5004F]/50 focus:ring-[#E5004F]/20 focus:border-[#E5004F] transition-all duration-300"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Users className="w-4 h-4 text-[#E5004F]" />
              <span className={!value || value === "none" ? "text-muted-foreground" : "text-foreground font-medium"}>
                <SelectValue placeholder="Select a character..." />
              </span>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px] rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md">
            <SelectItem value="none" className="text-muted-foreground focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1">
              <span className="italic">---</span>
            </SelectItem>

            {charactersLoading ? (
              <div className="p-2 text-center text-sm text-muted-foreground animate-pulse">
                Loading...
              </div>
            ) : filteredCharacters.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No characters found
              </div>
            ) : (
              filteredCharacters.map((character) => (
                <SelectItem
                  key={character.id}
                  value={character.id.toString()}
                  className="focus:text-[#E5004F] focus:bg-[#E5004F]/5 rounded-lg my-1 mx-1 cursor-pointer font-medium"
                >
                  {character.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 2. 筛选按钮 (放在同一行，紧凑的方形按钮) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-[#E5004F]/10 hover:border-[#E5004F]/50 hover:text-[#E5004F] transition-all"
            title="Filter Characters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[340px] p-5 rounded-xl border-gray-100 dark:border-gray-800 shadow-xl bg-white/95 dark:bg-[#1a101f]/95 backdrop-blur-md" align="end">
          <div className="grid gap-5">
            <div className="space-y-1.5 border-b border-gray-100 dark:border-gray-800 pb-3">
              <h4 className="font-bold text-[#E5004F] flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter Settings
              </h4>
              <p className="text-xs text-muted-foreground">
                Customize which characters appear in the list.
              </p>
            </div>

            {/* 模式选择 */}
            <RadioGroup
              value={filterMode}
              onValueChange={setFilterMode}
              className="grid grid-cols-2 gap-3"
            >
              <div className="relative">
                <RadioGroupItem value="whitelist" id="whitelist" className="peer sr-only" />
                <label
                  htmlFor="whitelist"
                  className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#E5004F] peer-data-[state=checked]:text-[#E5004F] peer-data-[state=checked]:bg-[#E5004F]/5 cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold">包含选中</span>
                  <span className="text-[10px] opacity-70">Whitelist</span>
                </label>
              </div>
              <div className="relative">
                <RadioGroupItem value="blacklist" id="blacklist" className="peer sr-only" />
                <label
                  htmlFor="blacklist"
                  className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-muted bg-transparent hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#E5004F] peer-data-[state=checked]:text-[#E5004F] peer-data-[state=checked]:bg-[#E5004F]/5 cursor-pointer transition-all"
                >
                  <span className="text-xs font-bold">排除选中</span>
                  <span className="text-[10px] opacity-70">Blacklist</span>
                </label>
              </div>
            </RadioGroup>

            {/* 分类复选框 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {allCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2 group">
                  <Checkbox
                    id={category}
                    checked={selectedCategories[category]}
                    onCheckedChange={() => handleCategoryChange(category)}
                    className="data-[state=checked]:bg-[#E5004F] data-[state=checked]:border-[#E5004F] rounded-md border-gray-300 dark:border-gray-600"
                  />
                  <label
                    htmlFor={category}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-[#E5004F] transition-colors cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export { CharacterSelect };
