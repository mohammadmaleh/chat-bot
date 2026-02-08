import { apiClient } from '../client';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  ean: string | null;
  gtin: string | null;
  bestPrice: {
    price: number;
    store: string;
    url: string;
  } | null;
  priceCount: number;
  prices?: Array<{
    id: string;
    price: number;
    currency: string;
    availability: boolean;
    url: string;
    scrapedAt: string;
    store: {
      id: string;
      name: string;
      domain: string;
      logoUrl: string | null;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchProductsParams {
  q: string;
  category?: string;
}

export interface SearchProductsResponse {
  products: Product[];
  count: number;
  query: string;
}

export interface GetProductsResponse {
  products: Product[];
  count: number;
}

export interface GetProductResponse {
  product: Product;
}

export const productsApi = {
  // Search products
  search: async (params: SearchProductsParams): Promise<SearchProductsResponse> => {
    const response = await apiClient.get<SearchProductsResponse>('/products/search', {
      params,
    });
    return response.data;
  },

  // Get all products
  getAll: async (): Promise<GetProductsResponse> => {
    const response = await apiClient.get<GetProductsResponse>('/products');
    return response.data;
  },

  // Get single product by ID
  getById: async (id: string): Promise<GetProductResponse> => {
    const response = await apiClient.get<GetProductResponse>(`/products/${id}`);
    return response.data;
  },
};
