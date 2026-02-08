import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api-client';
import { ChatRequest, ChatResponse, Conversation } from '@/types';

// Send chat message
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChatRequest) => {
      return fetchApi<ChatResponse>('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation', data.conversationId],
      });
    },
  });
}

// Get all conversations for a user
export function useConversations(userId: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => fetchApi<Conversation[]>(`/conversations?userId=${userId}`),
    enabled: !!userId,
  });
}

// Get single conversation with messages
export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => fetchApi<Conversation>(`/conversations/${conversationId}`),
    enabled: !!conversationId,
  });
}

// Delete conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      return fetchApi(`/conversations/${conversationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
