import { apiClient } from '../client';
import type { Conversation } from '@/types';

export const conversationsApi = {
  // Get all conversations for a user
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>(`/conversations/${userId}`);
    return response.data;
  },

  // Get single conversation with messages
  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await apiClient.get<Conversation>(`/conversations/${conversationId}`);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}`);
  },
};
