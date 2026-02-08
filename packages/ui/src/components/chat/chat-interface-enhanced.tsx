import * as React from "react"
import { ChatMessage } from "./chat-message-enhanced"
import { ChatInput } from "./chat-input-enhanced"
import { ProductCard } from "./product-card-enhanced"
import { TypingIndicator } from "./typing-indicator"
import { Card } from "../card"
import { motion, AnimatePresence } from "framer-motion"

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

export function ChatInterfaceEnhanced({
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
  const [isScrolledToBottom, setIsScrolledToBottom] = React.useState(true)

  // Auto-scroll to bottom with smooth behavior
  React.useEffect(() => {
    if (scrollRef.current && isScrolledToBottom) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, isLoading, isScrolledToBottom])

  // Check if user is at bottom
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50
      setIsScrolledToBottom(isAtBottom)
    }
  }

  // Scroll to bottom button
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
      setIsScrolledToBottom(true)
    }
  }

  return (
    <Card className={`flex flex-col h-[600px] relative overflow-hidden ${className}`}>
      {/* Messages Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="text-6xl"
              >
                🛍️
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Welcome to AI Shopping Assistant!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  I can help you find the best prices for products across German stores,
                  suggest gift ideas, and compare products. What are you looking for today?
                </p>
              </motion.div>

              {/* Animated suggestion pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-2 justify-center max-w-md"
              >
                {suggestions.map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSendMessage(suggestion)}
                    className="px-4 py-2 text-xs bg-muted hover:bg-muted/80 rounded-full 
                             transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: index * 0.05,
                }}
                className="space-y-3"
              >
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
                {message.products && message.products.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3 ml-11"
                  >
                    {message.products.map((product, prodIdx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * prodIdx }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <TypingIndicator />
          </motion.div>
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {!isScrolledToBottom && messages.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToBottom}
            className="absolute bottom-20 right-6 bg-primary text-primary-foreground 
                     rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow z-10"
            aria-label="Scroll to bottom"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <ChatInput
          onSend={onSendMessage}
          disabled={isLoading}
          suggestions={messages.length === 0 ? suggestions : []}
        />
      </motion.div>
    </Card>
  )
}
