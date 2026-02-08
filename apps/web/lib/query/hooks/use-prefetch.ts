import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { conversationsApi } from '@/lib/api/endpoints/conversations';
import { productsApi } from '@/lib/api/endpoints/products';
import { storesApi } from '@/lib/api/endpoints/stores';

export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    // Prefetch conversation on hover
    prefetchConversation: (conversationId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.conversations.detail(conversationId),
        queryFn: () => conversationsApi.getConversation(conversationId),
        staleTime: 1000 * 60, // 1 minute
      });
    },

    // Prefetch product on hover
    prefetchProduct: (productId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.products.detail(productId),
        queryFn: () => productsApi.getById(productId),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    },

    // Prefetch store on hover
    prefetchStore: (storeId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.stores.detail(storeId),
        queryFn: () => storesApi.getById(storeId),
        staleTime: 1000 * 60 * 30, // 30 minutes
      });
    },

    // Prefetch all stores (for dropdown/filter)
    prefetchStores: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.stores.list(),
        queryFn: storesApi.getAll,
        staleTime: 1000 * 60 * 60, // 1 hour
      });
    },
  };
}
