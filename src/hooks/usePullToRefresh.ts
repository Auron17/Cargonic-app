import { useCallback, useState } from 'react';

/**
 * Tortib yangilash belgisi faqat foydalanuvchi o'zi tortganda ko'rinadi.
 * React Query'ning `isRefetching` qiymati fon yangilanishlarida ham true bo'ladi
 * va belgi ekranni keraksiz siljitadi.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  return { refreshing, onRefresh };
}
