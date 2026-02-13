import useSWR from "swr";

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
};

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
