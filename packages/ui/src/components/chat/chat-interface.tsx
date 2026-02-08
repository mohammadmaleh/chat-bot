import * as React from "react"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ProductCard } from "./product-card"
import { TypingIndicator } from "./typing-indicator"
import { Card } from "../card"
import { ScrollArea } from "../scroll-area"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  products?: any[]
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  suggestions?: string[]
  className?: string
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  suggestions = [
    "Find wireless headphones under €200",
    "Gift ideas for coffee lovers",
    "Compare laptop prices",
  ],
  className = "",
}: ChatInterfaceProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-4xl">🛍️</div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Welcome to AI Shopping Assistant!
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                I can help you find the best prices for products across German stores,
                suggest gift ideas, and compare products. What are you looking for today?
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <ChatMessage
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
              {message.products && message.products.length > 0 && (
                <div className="space-y-3 ml-11">
                  {message.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && <TypingIndicator />}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
          suggestions={messages.length === 0 ? suggestions : []}
        />
      </div>
    </Card>
  )
}
