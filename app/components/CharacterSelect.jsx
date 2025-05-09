"use client";

import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { characters } from "../characters";
import { categories as categoryOrder } from "../categories";

export function CharacterSelect({ onSelect }) {
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const categories = [...new Set(characters.flatMap(char => char.category))];
    return Object.fromEntries(categories.map(cat => [cat, true]));
  });

  const [filterMode, setFilterMode] = useState("whitelist"); // "whitelist" 或 "blacklist"

  const categories = useMemo(() => {
    const allCategories = [...new Set(characters.flatMap(char => char.category))];
    return allCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, []);

  const filteredCharacters = useMemo(() => {
    return characters.filter(char => {
      const hasSelectedCategory = char.category.some(cat => selectedCategories[cat]);
      const hasUnselectedCategory = char.category.some(cat => !selectedCategories[cat]);
      return filterMode === "whitelist" ? hasSelectedCategory : !hasUnselectedCategory;
    });
  }, [selectedCategories, filterMode]);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">人物</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
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
                {categories.map((category) => (
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
      <Select onValueChange={onSelect}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="请选择人物" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">请选择人物</SelectItem>
          {filteredCharacters.map((character) => (
            <SelectItem key={character.id} value={character.id.toString()}>
              {character.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
