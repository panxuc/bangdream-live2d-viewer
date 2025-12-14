import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useCharacters() {
  const { data, error, isLoading } = useSWR('/api/characters?limit=114514', fetcher, {
    // 人物列表很少变动，可以设置很长的缓存时间
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    characters: data?.characters || [],
    loading: isLoading,
    error: error
  };
}

export function useCategories() {
  // 假设你有一个获取分类的 API，或者从 characters 数据中推导
  // 这里演示如果是独立 API 的情况：
  const { data, error, isLoading } = useSWR('/api/categories', fetcher, {
     revalidateOnFocus: false,
  });

  return {
    categories: data?.categories || [],
    loading: isLoading,
    error: error
  };
}
