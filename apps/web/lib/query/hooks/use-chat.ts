import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/endpoints/chat';
import { conversationsApi } from '@/lib/api/endpoints/conversations';
import { queryKeys } from '../keys';
import type { SendMessageRequest } from '@/lib/api/endpoints/chat';

// Send message with optimistic update
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatApi.sendMessage,
    
    // Optimistic update for instant UI feedback
    onMutate: async (variables: SendMessageRequest) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.conversations.detail(variables.conversationId || ''),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        queryKeys.conversations.detail(variables.conversationId || '')
      );

      // Optimistically update
      if (variables.conversationId) {
        queryClient.setQueryData(
          queryKeys.conversations.detail(variables.conversationId),
          (old: any) => ({
            ...old,
            messages: [
              ...(old?.messages || []),
              {
                id: `temp-${Date.now()}`,
                content: variables.message,
                role: 'user',
                createdAt: new Date().toISOString(),
              },
            ],
          })
        );
      }

      return { previousData };
    },

    // On error, rollback
    onError: (err, variables, context) => {
      if (context?.previousData && variables.conversationId) {
        queryClient.setQueryData(
          queryKeys.conversations.detail(variables.conversationId),
          context.previousData
        );
      }
    },

    // On success, refetch to get server data
    onSuccess: (data, variables) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.lists(),
      });

      // Update conversation detail
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.detail(data.conversationId),
        });
      }
    },
  });
}

// Get conversation with aggressive caching
export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId || ''),
    queryFn: () => conversationsApi.getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 0, // Always fresh for chat
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });
}

// Get conversations list
export function useConversations(userId: string) {
  return useQuery({
    queryKey: queryKeys.conversations.list(userId),
    queryFn: () => conversationsApi.getConversations(userId),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Delete conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversationsApi.deleteConversation,
    onSuccess: () => {
      // Invalidate all conversation queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });
    },
  });
}

// Health check with infinite stale time
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: chatApi.health,
    staleTime: Infinity, // Never goes stale
    gcTime: Infinity, // Never garbage collected
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
