import { apiClient } from '../client';
import type { Message, Conversation } from '@/types';

export interface SendMessageRequest {
  userId: string;
  conversationId?: string;
  message: string;
}

export interface SendMessageResponse {
  success: boolean;
  conversationId: string;
  message: Message;
  products: any[]; // TODO: Replace with Product type
}

export const chatApi = {
  // Send message
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await apiClient.post<SendMessageResponse>('/chat', data);
    return response.data;
  },

  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};
