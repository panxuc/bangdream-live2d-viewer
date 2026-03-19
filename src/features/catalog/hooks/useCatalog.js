import { categories } from "../../../server/catalog/categories.js";
import { characters } from "../../../server/catalog/characters.js";

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
