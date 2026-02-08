import * as React from "react"
import { ChatMessage } from "./chat-message-enhanced"
import { ChatInput } from "./chat-input-enhanced"
import { ProductCard } from "./product-card"
import { TypingIndicator } from "./typing-indicator-enhanced"
import { Card } from "../card"
import { ScrollArea } from "../scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, TrendingUp, Gift, Zap } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  products?: any[]
  streaming?: boolean
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading?: boolean
  suggestions?: string[]
  className?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
}

const welcomeFeatures = [
  {
    icon: TrendingUp,
    title: "Price Comparison",
    description: "Compare prices across German stores"
  },
  {
    icon: Gift,
    title: "Gift Ideas",
    description: "Get personalized gift recommendations"
  },
  {
    icon: Zap,
    title: "Smart Search",
    description: "AI-powered product discovery"
  }
]

export function ChatInterfaceEnhanced({
  messages,
  onSendMessage,
  isLoading = false,
  suggestions = [
    "Find wireless headphones under €200",
    "Gift ideas for coffee lovers under €50",
    "Compare Sony headphones prices",
  ],
  className = "",
}: ChatInterfaceProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isAutoScroll, setIsAutoScroll] = React.useState(true)

  // Smooth auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current && isAutoScroll) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [messages, isLoading, isAutoScroll])

  // Detect manual scroll
  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setIsAutoScroll(isAtBottom)
  }

  return (
    <Card className={`flex flex-col h-[600px] overflow-hidden ${className}`}>
      {/* Messages Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
              className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4"
            >
              {/* Animated Logo */}
              <motion.div
                initial={{ scale: 0.5, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1
                }}
                className="relative"
              >
                <div className="text-6xl">🛍️</div>
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="h-6 w-6 text-primary" />
                </motion.div>
              </motion.div>

              {/* Welcome Text */}
              <motion.div variants={itemVariants} className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Welcome to AI Shopping Assistant!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  I can help you find the best prices for products across German stores,
                  suggest personalized gift ideas, and compare products intelligently.
                </p>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-4"
              >
                {welcomeFeatures.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    className="p-4 rounded-xl border bg-card hover:shadow-lg transition-shadow"
                  >
                    <feature.icon className="h-8 w-8 text-primary mb-3 mx-auto" />
                    <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </motion.div>
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
                  mass: 1
                }}
                className="space-y-3"
              >
                <ChatMessage
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  streaming={message.streaming}
                />
                {message.products && message.products.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="space-y-3 ml-11"
                  >
                    {message.products.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
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

        {/* Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {!isAutoScroll && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
              })
              setIsAutoScroll(true)
            }}
            className="absolute bottom-24 right-8 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
        className="border-t bg-background/95 backdrop-blur-sm p-4"
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
