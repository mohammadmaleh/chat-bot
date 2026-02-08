import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, ProductFilters } from '../api/products'

// Query keys for caching
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  categories: () => [...productKeys.all, 'categories'] as const,
  deals: () => [...productKeys.all, 'deals'] as const,
  search: (query: string) => [...productKeys.all, 'search', query] as const,
  priceHistory: (id: string) => [...productKeys.detail(id), 'price-history'] as const,
}

// Get products with filters
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Search products
export function useProductSearch(query: string, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.search(query),
    queryFn: () => productsApi.searchProducts(query, filters),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes for search
  })
}

// Get categories
export function useCategories() {
  return useQuery({
    queryKey: productKeys.categories(),
    queryFn: () => productsApi.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  })
}

// Get products by category
export function useProductsByCategory(category: string, filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list({ ...filters, category }),
    queryFn: () => productsApi.getProductsByCategory(category, filters),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  })
}

// Get best deals
export function useBestDeals(limit: number = 10) {
  return useQuery({
    queryKey: productKeys.deals(),
    queryFn: () => productsApi.getBestDeals(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Compare products
export function useCompareProducts() {
  return useMutation({
    mutationFn: (productIds: string[]) => productsApi.compareProducts(productIds),
  })
}

// Get price history
export function usePriceHistory(productId: string, days: number = 30) {
  return useQuery({
    queryKey: productKeys.priceHistory(productId),
    queryFn: () => productsApi.getPriceHistory(productId, days),
    enabled: !!productId,
    staleTime: 60 * 60 * 1000, // 1 hour - historical data
  })
}

// Prefetch product details (for hover/navigation)
export function usePrefetchProduct() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => productsApi.getProduct(id),
      staleTime: 5 * 60 * 1000,
    })
  }
}

// Infinite scroll for products
export function useInfiniteProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list({ ...filters, page: 1 }),
    queryFn: ({ pageParam = 1 }) => 
      productsApi.getProducts({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage.hasMore) {
        return pages.length + 1
      }
      return undefined
    },
    staleTime: 5 * 60 * 1000,
  })
}
