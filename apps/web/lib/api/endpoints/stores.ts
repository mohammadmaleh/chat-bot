import { apiClient } from '../client';

export interface Store {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  country: string;
  active: boolean;
  scrapperConfig: any;
  createdAt: string;
  updatedAt: string;
}

export interface GetStoresResponse {
  stores: Store[];
  count: number;
}

export interface GetStoreResponse {
  store: Store & {
    prices?: Array<{
      id: string;
      price: number;
      scrapedAt: string;
    }>;
  };
}

export const storesApi = {
  // Get all active stores
  getAll: async (): Promise<GetStoresResponse> => {
    const response = await apiClient.get<GetStoresResponse>('/stores');
    return response.data;
  },

  // Get single store by ID
  getById: async (id: string): Promise<GetStoreResponse> => {
    const response = await apiClient.get<GetStoreResponse>(`/stores/${id}`);
    return response.data;
  },
};
