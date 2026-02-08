import * as React from "react"
import { Avatar, AvatarFallback } from "../avatar"
import { Badge } from "../badge"
import { Bot, User } from "lucide-react"
import { formatDate } from "../../lib/utils"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: Date | string
  userName?: string
}

export function ChatMessage({
  role,
  content,
  timestamp,
  userName = "You",
}: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-50 slide-in-from-bottom-2 duration-300`}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-2">
          {!isUser && (
            <Badge variant="secondary" className="text-xs">
              AI Assistant
            </Badge>
          )}
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatDate(timestamp)}
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 border-2 border-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
