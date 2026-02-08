import * as React from "react"
import { Button } from "../button"
import { Send, Loader2, Sparkles, Mic, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
  suggestions?: string[]
}

const suggestionVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }),
  exit: { opacity: 0, scale: 0.8, y: -10 }
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask about products, prices, or get gift recommendations...",
  suggestions = [],
}: ChatInputProps) {
  const [input, setInput] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput("")
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
    if (!disabled) {
      onSend(suggestion)
    }
  }

  // Auto-resize textarea with animation
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  return (
    <div className="space-y-3">
      {/* Animated Suggestions */}
      <AnimatePresence mode="wait">
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Try asking:</span>
              </motion.div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <motion.div
                    key={idx}
                    custom={idx}
                    variants={suggestionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={disabled}
                      className="text-xs h-8 px-3 border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-200 group"
                    >
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-1.5"
                      >
                        {suggestion}
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Send className="h-3 w-3" />
                        </motion.span>
                      </motion.span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <motion.div
          animate={{
            boxShadow: isFocused
              ? "0 0 0 2px hsl(var(--primary))"
              : "0 0 0 0px transparent"
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none border bg-background px-4 py-3 pr-24 text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-2xl"
            style={{ minHeight: "48px", maxHeight: "200px" }}
          />

          {/* Action Buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* Voice Input Button (Future Feature) */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={disabled}
                className="h-8 w-8 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
                title="Voice input (coming soon)"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Send Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="submit"
                size="icon"
                disabled={disabled || !input.trim()}
                className="h-8 w-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <AnimatePresence mode="wait">
                  {disabled ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 180 }}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                    >
                      <Send className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Character Count (shows when approaching limit) */}
        <AnimatePresence>
          {input.length > 200 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -top-6 right-0 text-xs text-muted-foreground"
            >
              <span className={input.length > 450 ? "text-destructive" : ""}>
                {input.length}/500
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* Helper Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between text-xs text-muted-foreground"
      >
        <span>Press Enter to send, Shift+Enter for new line</span>
        <motion.span
          animate={{
            opacity: isFocused ? 1 : 0.6
          }}
          className="flex items-center gap-1"
        >
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⏎</kbd>
          <span>Send</span>
        </motion.span>
      </motion.div>
    </div>
  )
}
