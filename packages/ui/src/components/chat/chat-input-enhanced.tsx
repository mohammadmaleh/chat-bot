import * as React from "react"
import { Textarea } from "../textarea"
import { Button } from "../button"
import { Send, Loader2, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  suggestions?: string[]
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  onSend,
  disabled = false,
  suggestions = [],
  placeholder = "Ask me anything about products...",
  maxLength = 500,
}: ChatInputProps) {
  const [message, setMessage] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message.trim())
      setMessage("")
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion)
    textareaRef.current?.focus()
  }

  const charCount = message.length
  const isNearLimit = charCount > maxLength * 0.8
  const isOverLimit = charCount > maxLength

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && message.length === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion, idx) => (
              <motion.button
                key={idx}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled}
                className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full 
                         transition-all duration-200 shadow-sm hover:shadow-md
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Container */}
      <motion.div
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`relative rounded-lg border-2 transition-colors duration-200 ${
          isFocused
            ? "border-primary shadow-lg shadow-primary/10"
            : "border-border shadow-sm"
        } ${isOverLimit ? "border-destructive" : ""}`}
      >
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="min-h-[44px] max-h-[200px] resize-none border-0 focus-visible:ring-0 
                   focus-visible:ring-offset-0 pr-24 py-3 text-sm"
        />

        {/* Character Count */}
        <AnimatePresence>
          {(isNearLimit || message.length > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute bottom-2 right-16 text-xs transition-colors ${
                isOverLimit
                  ? "text-destructive font-semibold"
                  : isNearLimit
                  ? "text-orange-500"
                  : "text-muted-foreground"
              }`}
            >
              {charCount}/{maxLength}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send Button */}
        <div className="absolute bottom-2 right-2">
          <Button
            type="submit"
            size="sm"
            disabled={disabled || !message.trim() || isOverLimit}
            className="h-9 w-9 p-0 rounded-full transition-all duration-200"
          >
            <motion.div
              animate={{
                rotate: disabled ? 360 : 0,
              }}
              transition={{
                duration: 1,
                repeat: disabled ? Infinity : 0,
                ease: "linear",
              }}
            >
              {disabled ? (
                <Loader2 className="h-4 w-4" />
              ) : (
                <motion.div
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send className="h-4 w-4" />
                </motion.div>
              )}
            </motion.div>
          </Button>
        </div>
      </motion.div>

      {/* Helpful tip */}
      <AnimatePresence>
        {isFocused && message.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-muted-foreground flex items-center gap-2"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border">Enter</kbd> to send,{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted border">Shift + Enter</kbd> for new line
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
