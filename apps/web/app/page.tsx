'use client'

import { ChatInterface } from '@chat-bot/ui'
import { useChat } from '../hooks/use-chat'

export default function Home() {
  const { messages, sendMessageStream, isLoading } = useChat()

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            🛍️ AI Shopping Assistant
          </h1>
          <p className="text-muted-foreground">
            Find the best prices across German stores with AI-powered search
          </p>
        </div>

        {/* Chat Interface */}
        <ChatInterface
          messages={messages}
          onSendMessage={sendMessageStream}
          isLoading={isLoading}
          suggestions={[
            "Find wireless headphones under €200",
            "Gift ideas for coffee lovers under €50",
            "Compare Sony headphones prices",
          ]}
        />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Powered by Groq AI • Comparing prices from Amazon, MediaMarkt, Saturn & more
        </div>
      </div>
    </main>
  )
}
