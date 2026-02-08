export interface Product {
  id: string
  name: string
  brand?: string
  category: string
  description?: string
  imageUrl?: string
  ean?: string
  prices: Price[]
  createdAt: string
  updatedAt?: string
  averagePrice?: number
  lowestPrice?: number
  highestPrice?: number
  savingsPercentage?: number
}

export interface Price {
  id: string
  productId: string
  storeId: string
  storeName: string
  storeLogo?: string
  price: number
  currency: string
  url?: string
  availability: boolean
  stock?: number
  shippingCost?: number
  deliveryTime?: string
  scrapedAt: string
  lastUpdated?: string
}

export interface Store {
  id: string
  name: string
  domain: string
  logoUrl?: string
  country: string
  rating?: number
  trustScore?: number
  shippingInfo?: string
}

export interface ProductComparison {
  products: Product[]
  comparison: {
    lowestPrice: {
      productId: string
      price: number
      storeName: string
    }
    averagePrices: Record<string, number>
    specifications: Record<string, string[]>
    availability: Record<string, boolean>
  }
}

export interface PriceHistory {
  productId: string
  storeName: string
  data: Array<{
    date: string
    price: number
  }>
  lowestPrice: number
  highestPrice: number
  averagePrice: number
  currentPrice: number
  priceChange: number
  priceChangePercentage: number
}

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  productCount: number
  subcategories?: Category[]
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  brands?: string[]
  stores?: string[]
  availability?: boolean
  search?: string
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'popularity' | 'savings'
  page?: number
  limit?: number
}

export interface PaginatedProducts {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export interface Deal {
  product: Product
  originalPrice: number
  currentPrice: number
  savings: number
  savingsPercentage: number
  store: Store
  expiresAt?: string
}
