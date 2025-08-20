"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, memo } from "react";

const ModelSelect = memo(function ModelSelect({ characterId, onSelect, isDarkMode, value }) {
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
        const models = Object.keys(data.models || {})
          .filter(key => !key.includes('_general'));
        setModelList(models);
      })
      .catch(() => {
        setModelList([]);
      });
  }, [characterId, isDarkMode]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground/90">模型选择</label>
      <Select onValueChange={onSelect} value={value}>
        <SelectTrigger className="w-full bg-background hover:bg-accent transition-colors">
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
});

export { ModelSelect };
