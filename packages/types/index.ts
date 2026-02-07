export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  tokens?: number
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
