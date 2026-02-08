import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '../keys';
import type { Product } from '@/lib/api/endpoints/products';

interface InfiniteProductsResponse {
  products: Product[];
  count: number;
  nextCursor?: number;
  hasMore: boolean;
}

async function fetchInfiniteProducts({ pageParam = 0 }) {
  const response = await apiClient.get<InfiniteProductsResponse>('/products', {
    params: {
      cursor: pageParam,
      limit: 20,
    },
  });
  return response.data;
}

export function useInfiniteProducts() {
  return useInfiniteQuery({
    queryKey: queryKeys.products.lists(),
    queryFn: fetchInfiniteProducts,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
