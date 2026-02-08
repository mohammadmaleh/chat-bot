export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
  updatedAt?: string
  preferences: UserPreferences
  subscription?: Subscription
}

export interface UserPreferences {
  currency: string
  language: string
  notifications: boolean
  emailAlerts: boolean
  priceDropAlerts: boolean
  weeklyDigest: boolean
  theme: 'light' | 'dark' | 'system'
  defaultStore?: string
  favoriteCategories?: string[]
}

export interface Subscription {
  tier: 'free' | 'pro' | 'business'
  status: 'active' | 'inactive' | 'cancelled' | 'trialing'
  startDate: string
  endDate?: string
  renewalDate?: string
  features: string[]
  limits: {
    searchesPerDay: number
    priceAlerts: number
    comparisons: number
    historyDays: number
  }
}

export interface PriceAlert {
  id: string
  userId: string
  productId: string
  product?: {
    id: string
    name: string
    imageUrl?: string
  }
  targetPrice: number
  currentPrice: number
  store?: string
  active: boolean
  triggered: boolean
  triggeredAt?: string
  createdAt: string
  notificationsSent: number
}

export interface SearchHistory {
  id: string
  userId: string
  query: string
  filters?: Record<string, any>
  resultsCount: number
  timestamp: string
}

export interface Favorite {
  id: string
  userId: string
  productId: string
  product?: Product
  addedAt: string
  notes?: string
}

export interface ComparisonHistory {
  id: string
  userId: string
  productIds: string[]
  products?: Product[]
  createdAt: string
  name?: string
}

export interface Product {
  id: string
  name: string
  brand?: string
  imageUrl?: string
  category: string
  lowestPrice?: number
}

export interface UserStats {
  totalSearches: number
  activePriceAlerts: number
  favoriteProducts: number
  comparisons: number
  moneySaved: number
  lastActivity: string
}
