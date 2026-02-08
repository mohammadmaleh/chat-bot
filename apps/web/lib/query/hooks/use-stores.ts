import { useQuery } from '@tanstack/react-query';
import { storesApi } from '@/lib/api/endpoints/stores';
import { queryKeys } from '../keys';

// Get all stores
export function useStores() {
  return useQuery({
    queryKey: queryKeys.stores.list(),
    queryFn: storesApi.getAll,
    staleTime: 1000 * 60 * 60, // 1 hour - stores rarely change
    gcTime: 1000 * 60 * 60 * 2, // 2 hours cache
  });
}

// Get single store
export function useStore(id: string) {
  return useQuery({
    queryKey: queryKeys.stores.detail(id),
    queryFn: () => storesApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
