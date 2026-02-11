import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useCharacters() {
  const { data, error, isLoading } = useSWR("/api/characters?limit=114514", fetcher, {
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
  const { data, error, isLoading } = useSWR("/api/categories", fetcher, {
    revalidateOnFocus: false,
  });

  return {
    categories: data?.categories || [],
    loading: isLoading,
    error,
  };
}
