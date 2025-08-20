"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCharacters, useCategories } from "../hooks/useCharacters";

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
      return filterMode === "whitelist" ? hasSelectedCategory : !hasUnselectedCategory;
    });
  }, [characters, selectedCategories, filterMode]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground/90">人物选择</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs bg-[#db024d]/10 hover:bg-[#db024d]/20 dark:bg-[#db024d]/30 border-[#db024d]/20 dark:border-[#db024d]/50 transition-all duration-200">
              筛选
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px]">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">筛选分类</h4>
                <p className="text-sm text-muted-foreground">
                  选择要显示的角色分类
                </p>
              </div>
              <RadioGroup
                value={filterMode}
                onValueChange={setFilterMode}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whitelist" id="whitelist" />
                  <label htmlFor="whitelist" className="text-sm font-medium">
                    显示选中分类
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blacklist" id="blacklist" />
                  <label htmlFor="blacklist" className="text-sm font-medium">
                    隐藏未选中分类
                  </label>
                </div>
              </RadioGroup>
              <div className="grid grid-cols-2 gap-2">
                {allCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories[category]}
                      onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <label
                      htmlFor={category}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
      <Select onValueChange={onSelect} value={value}>
        <SelectTrigger className="w-full bg-background hover:bg-accent transition-colors">
          <SelectValue placeholder="请选择人物" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">请选择人物</SelectItem>
          {charactersLoading ? (
            <SelectItem value="loading" disabled>加载中...</SelectItem>
          ) : (
            filteredCharacters.map((character) => (
              <SelectItem key={character.id} value={character.id.toString()}>
                {character.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
});

export { CharacterSelect };
