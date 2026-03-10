import { categories } from "@/src/server/catalog/categories";
import { characters } from "@/src/server/catalog/characters";

export function useCharacters() {
  return {
    characters,
    loading: false,
    error: null,
  };
}

export function useCategories() {
  return {
    categories,
    loading: false,
    error: null,
  };
}
