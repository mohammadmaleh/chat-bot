export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface Product {
  id: string
  name: string
  brand: string
  category: string
  description?: string
  image_url?: string
  ean: string
  prices: Price[]
  cheapest_price?: string
  most_expensive?: string
}

export interface Price {
  price: string
  currency: string
  availability: boolean
  url: string
  scraped_at?: string
  store_name: string
  store_domain: string
  store_logo?: string
}

export interface ChatRequest {
  message: string
  conversation_history?: ChatMessage[]
  user_id?: string
}

export interface ChatResponse {
  success: boolean
  response: string
  products?: Product[]
  intent?: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  products?: Product[]
}
