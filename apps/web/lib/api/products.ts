import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface Product {
  id: string
  name: string
  brand?: string
  category: string
  description?: string
  imageUrl?: string
  prices: Price[]
  createdAt: string
}

export interface Price {
  id: string
  price: number
  currency: string
  storeName: string
  storeId: string
  url?: string
  availability: boolean
  scrapedAt: string
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  brands?: string[]
  stores?: string[]
  availability?: boolean
  search?: string
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest'
  page?: number
  limit?: number
}

export const productsApi = {
  // Get all products with filters
  getProducts: async (filters: ProductFilters = {}) => {
    const { data } = await axios.get(`${API_URL}/api/products`, {
      params: filters,
    })
    return data
  },

  // Get single product by ID
  getProduct: async (id: string) => {
    const { data } = await axios.get(`${API_URL}/api/products/${id}`)
    return data
  },

  // Search products
  searchProducts: async (query: string, filters: ProductFilters = {}) => {
    const { data } = await axios.get(`${API_URL}/api/products/search`, {
      params: { q: query, ...filters },
    })
    return data
  },

  // Get product categories
  getCategories: async () => {
    const { data } = await axios.get(`${API_URL}/api/products/categories`)
    return data
  },

  // Get products by category
  getProductsByCategory: async (category: string, filters: ProductFilters = {}) => {
    const { data } = await axios.get(`${API_URL}/api/products/category/${category}`, {
      params: filters,
    })
    return data
  },

  // Get best deals
  getBestDeals: async (limit: number = 10) => {
    const { data } = await axios.get(`${API_URL}/api/products/deals`, {
      params: { limit },
    })
    return data
  },

  // Compare products
  compareProducts: async (productIds: string[]) => {
    const { data } = await axios.post(`${API_URL}/api/products/compare`, {
      product_ids: productIds,
    })
    return data
  },

  // Get price history
  getPriceHistory: async (productId: string, days: number = 30) => {
    const { data } = await axios.get(`${API_URL}/api/products/${productId}/price-history`, {
      params: { days },
    })
    return data
  },
}
