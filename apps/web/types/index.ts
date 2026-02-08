export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: {
    intent?: any;
    productsFound?: number;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  prices: Price[];
}

export interface Price {
  id: string;
  price: string;
  currency: string;
  availability: boolean;
  url: string;
  store: Store;
  scrapedAt: string;
}

export interface Store {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
}

export interface ChatRequest {
  userId: string;
  conversationId?: string;
  message: string;
}

export interface ChatResponse {
  conversationId: string;
  userMessage: Message;
  assistantMessage: Message;
  products: Product[];
}
