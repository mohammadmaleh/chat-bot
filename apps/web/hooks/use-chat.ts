import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { chatApi } from '../lib/api/chat'
import type { Message, ChatMessage } from '../types/api'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const mutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (data) => {
      // Add AI response to messages
      const aiMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        products: data.products,
      }
      setMessages((prev) => [...prev, aiMessage])
    },
  })

  const sendMessage = useCallback(
    async (content: string) => {
      // Add user message immediately
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      // Prepare conversation history
      const history: ChatMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      // Send to API
      mutation.mutate({
        message: content,
        conversation_history: history,
      })
    },
    [messages, mutation]
  )

  const sendMessageStream = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      setIsStreaming(true)

      // Prepare AI message container
      const aiMessageId = `msg-${Date.now()}-ai`
      let aiContent = ''
      let products: any[] | undefined

      // Add empty AI message
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ])

      try {
        const history: ChatMessage[] = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        for await (const chunk of chatApi.streamMessage({
          message: content,
          conversation_history: history,
        })) {
          // Check if chunk is products data
          try {
            const parsed = JSON.parse(chunk)
            if (parsed.products) {
              products = parsed.products
              continue
            }
          } catch {
            // Regular text chunk
            aiContent += chunk
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: aiContent, products }
                  : msg
              )
            )
          }
        }
      } catch (error) {
        console.error('Streaming error:', error)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content: "I'm sorry, I encountered an error. Please try again.",
                }
              : msg
          )
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [messages]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    sendMessage,
    sendMessageStream,
    clearMessages,
    isLoading: mutation.isPending || isStreaming,
  }
}
