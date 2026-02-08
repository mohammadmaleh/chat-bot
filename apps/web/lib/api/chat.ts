import axios from 'axios'
import type { ChatRequest, ChatResponse } from '../../types/api'

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001'

export const chatApi = {
  /**
   * Send a chat message to the AI service
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await axios.post<ChatResponse>(
      `${AI_API_URL}/api/chat/`,
      request
    )
    return response.data
  },

  /**
   * Send a message with streaming response
   * Returns an async generator that yields chunks
   */
  async *streamMessage(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${AI_API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'message') {
              yield parsed.content
            } else if (parsed.type === 'products') {
              yield JSON.stringify({ products: parsed.data })
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  },

  /**
   * Search products directly
   */
  async searchProducts(query: string, limit: number = 5) {
    const response = await axios.post(`${AI_API_URL}/api/chat/search`, {
      query,
      limit,
    })
    return response.data
  },
}
