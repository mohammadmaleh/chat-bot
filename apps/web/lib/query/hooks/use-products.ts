import { useQuery } from '@tanstack/react-query';
import {
  productsApi,
  type SearchProductsParams,
} from '@/lib/api/endpoints/products';
import { queryKeys } from '../keys';

// Search products
export function useSearchProducts(
  params: SearchProductsParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.products.search(params.q, params.category),
    queryFn: () => productsApi.search(params),
    enabled: enabled && params.q.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes - products don't change often
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

// Get all products
export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: productsApi.getAll,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Get single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
