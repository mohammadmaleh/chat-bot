import * as React from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "../avatar"
import { Bot } from "lucide-react"

const dotVariants = {
  initial: { y: 0 },
  animate: {
    y: [-4, 0, -4],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

const containerVariants = {
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
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
}

const shimmerVariants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear"
    }
  }
}

export function TypingIndicator() {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex gap-3 justify-start"
    >
      {/* Avatar */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
            <motion.div
              animate={{
                rotate: [0, 360]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Bot className="h-4 w-4 text-primary" />
            </motion.div>
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div className="flex flex-col gap-2">
        {/* Typing Badge */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-muted-foreground font-medium"
        >
          AI is thinking
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ...
          </motion.span>
        </motion.div>

        {/* Typing Bubble with Dots */}
        <motion.div
          variants={shimmerVariants}
          animate="animate"
          className="rounded-2xl px-5 py-4 bg-gradient-to-r from-muted/50 via-muted to-muted/50 backdrop-blur-sm border border-border/50 shadow-sm"
          style={{
            backgroundSize: "200% 100%"
          }}
        >
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{
                  delay: index * 0.15
                }}
                className="w-2 h-2 rounded-full bg-primary/60"
              />
            ))}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-0.5 bg-muted rounded-full overflow-hidden"
        >
          <motion.div
            animate={{
              x: ["-100%", "100%"]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
