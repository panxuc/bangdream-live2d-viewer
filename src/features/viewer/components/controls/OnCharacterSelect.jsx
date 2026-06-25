"use client";

import { SelectItem } from "@/components/ui/select";
import { onCharacters } from "@/src/server/catalog/on-characters";
import { Users } from "lucide-react";
import { memo } from "react";
import { SelectField, selectItemClass } from "./shared/SelectField";

const OnCharacterSelect = memo(function OnCharacterSelect({ onSelect, value, disabled }) {
  return (
    <SelectField
      value={value}
      onValueChange={onSelect}
      disabled={disabled}
      icon={Users}
      placeholder="请选择 Our Notes 角色..."
    >
      {onCharacters.map((character) => (
        <SelectItem key={character.id} value={character.id} className={selectItemClass}>
          {character.name}
        </SelectItem>
      ))}
    </SelectField>
  );
});

export { OnCharacterSelect };
