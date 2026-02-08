import * as React from "react"
import { Avatar, AvatarFallback } from "../avatar"
import { Badge } from "../badge"
import { Bot, User, Copy, Check } from "lucide-react"
import { formatDate } from "../../lib/utils"
import { motion } from "framer-motion"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date | string
  userName?: string
  enableTypewriter?: boolean
}

export function ChatMessage({
  role,
  content,
  timestamp,
  userName = "You",
  enableTypewriter = false,
}: ChatMessageProps) {
  const isUser = role === "user"
  const [displayedContent, setDisplayedContent] = React.useState(enableTypewriter && !isUser ? "" : content)
  const [isCopied, setIsCopied] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  // Typewriter effect for assistant messages
  React.useEffect(() => {
    if (enableTypewriter && !isUser && content) {
      let index = 0
      const interval = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1))
          index++
        } else {
          clearInterval(interval)
        }
      }, 20) // Adjust speed here (lower = faster)

      return () => clearInterval(interval)
    } else {
      setDisplayedContent(content)
    }
  }, [content, enableTypewriter, isUser])

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}
    >
      {!isUser && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          <Avatar className="h-8 w-8 border-2 border-primary/20 ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Bot className="h-4 w-4 text-primary" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          {!isUser && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20"
            >
              🤖 AI Assistant
            </Badge>
          )}
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatDate(timestamp)}
            </span>
          )}
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative group/message"
        >
          <div
            className={`rounded-2xl px-4 py-3 transition-all duration-200 ${
              isUser
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl"
                : "bg-muted hover:bg-muted/80 shadow-sm hover:shadow-md"
            }`}
          >
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {displayedContent}
              {enableTypewriter && !isUser && displayedContent.length < content.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-1 h-4 bg-current ml-0.5 align-middle"
                />
              )}
            </div>
          </div>

          {/* Copy button - appears on hover */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className={`absolute ${isUser ? 'left-2' : 'right-2'} top-2 p-1.5 rounded-md 
                       bg-background/80 backdrop-blur-sm shadow-md hover:bg-background 
                       transition-colors pointer-events-auto`}
            aria-label="Copy message"
          >
            {isCopied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </motion.button>
        </motion.div>
      </div>

      {isUser && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          <Avatar className="h-8 w-8 border-2 border-primary ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  )
}
