import * as React from "react"
import { Avatar, AvatarFallback } from "../avatar"
import { Badge } from "../badge"
import { Bot, User, Copy, Check } from "lucide-react"
import { formatDate } from "../../lib/utils"
import { motion } from "framer-motion"
import { Button } from "../button"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date | string
  userName?: string
  streaming?: boolean
}

export function ChatMessage({
  role,
  content,
  timestamp,
  userName = "You",
  streaming = false,
}: ChatMessageProps) {
  const isUser = role === "user"
  const [copied, setCopied] = React.useState(false)
  const [displayedContent, setDisplayedContent] = React.useState("")
  const [isAnimating, setIsAnimating] = React.useState(streaming)

  // Character-by-character streaming animation
  React.useEffect(() => {
    if (streaming && !isUser) {
      setIsAnimating(true)
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex < content.length) {
          setDisplayedContent(content.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          setIsAnimating(false)
          clearInterval(interval)
        }
      }, 20) // 20ms per character for smooth animation

      return () => clearInterval(interval)
    } else {
      setDisplayedContent(content)
      setIsAnimating(false)
    }
  }, [content, streaming, isUser])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const messageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: { opacity: 0, scale: 0.95 }
  }

  const avatarVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}
    >
      {!isUser && (
        <motion.div variants={avatarVariants}>
          <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          {!isUser && (
            <Badge variant="secondary" className="text-xs font-medium">
              🤖 AI Assistant
            </Badge>
          )}
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatDate(timestamp)}
            </span>
          )}
        </motion.div>

        {/* Message Bubble */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={`relative rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
              : "bg-muted/50 backdrop-blur-sm border border-border/50"
          }`}
        >
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {displayedContent}
            {isAnimating && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-1 h-4 ml-1 bg-current"
              />
            )}
          </div>

          {/* Copy Button - Shows on hover for assistant messages */}
          {!isUser && !isAnimating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Reaction Area (Future Enhancement) */}
        {!isUser && !isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 0, y: 0 }}
            whileHover={{ opacity: 1 }}
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {['👍', '👎', '❤️'].map((emoji, idx) => (
              <button
                key={idx}
                className="text-xs hover:scale-125 transition-transform duration-200 p-1 rounded hover:bg-muted/50"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {isUser && (
        <motion.div variants={avatarVariants}>
          <Avatar className="h-8 w-8 border-2 border-primary shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  )
}
