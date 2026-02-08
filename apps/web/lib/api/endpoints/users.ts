import { apiClient } from '../client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  preferences: any;
  createdAt: string;
  updatedAt: string;
}

export interface GetUserResponse {
  user: User;
}

export const usersApi = {
  // Get user by ID
  getById: async (id: string): Promise<GetUserResponse> => {
    const response = await apiClient.get<GetUserResponse>(`/users/${id}`);
    return response.data;
  },
};
