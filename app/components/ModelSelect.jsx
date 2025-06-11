"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

export function ModelSelect({ characterId, onSelect, isDarkMode }) {
  const [modelList, setModelList] = useState([]);

  useEffect(() => {
    if (!characterId) {
      setModelList([]);
      return;
    }

    const paddedId = characterId.padStart(3, '0');

    fetch(`/api/models?characterId=${paddedId}&isModified=${isDarkMode}`)
      .then(res => res.json())
      .then(data => {
        console.log(data);
        const models = Object.keys(data.models || {})
          .filter(key => !key.includes('_general'));
        console.log(models);
        setModelList(models);
      })
      .catch(err => {
        console.error('Error loading models:', err);
        setModelList([]);
      });
  }, [characterId, isDarkMode]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">模型</label>
      <Select onValueChange={onSelect}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="请选择模型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">请选择模型</SelectItem>
          {modelList.map((model) => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
