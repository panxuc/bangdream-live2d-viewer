import useSWR from "swr";
import { API_ROUTES, getCharactersApiUrl } from "@/src/config/urls";

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
};

export function useCharacters() {
  const { data, error, isLoading } = useSWR(getCharactersApiUrl(114514), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    characters: data?.characters || [],
    loading: isLoading,
    error,
  };
}

export function useCategories() {
  const { data, error, isLoading } = useSWR(API_ROUTES.categories, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    categories: data?.categories || [],
    loading: isLoading,
    error,
  };
}
