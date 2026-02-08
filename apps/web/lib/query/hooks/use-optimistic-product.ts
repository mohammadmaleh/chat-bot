import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../keys';

interface AddToFavoritesParams {
  userId: string;
  productId: string;
}

export function useOptimisticFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, productId }: AddToFavoritesParams) => {
      // API call to add favorite
      const response = await fetch('/api/favorites', {
        method: 'POST',
        body: JSON.stringify({ userId, productId }),
      });
      return response.json();
    },

    // Optimistic update
    onMutate: async ({ productId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(
        queryKeys.products.list()
      );

      // Optimistically update
      queryClient.setQueryData(queryKeys.products.list(), (old: any) => ({
        ...old,
        products: old?.products.map((p: any) =>
          p.id === productId ? { ...p, isFavorite: true } : p
        ),
      }));

      return { previousProducts };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        queryKeys.products.list(),
        context?.previousProducts
      );
    },

    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
