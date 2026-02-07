import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Message } from '@chat-bot/types';

export default function Home() {
  const testMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    createdAt: new Date().toISOString(),
  };
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        {/* Hero */}
        <div className="text-center space-y-8 mb-20">
          <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-zinc-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
            AI ChatBot
          </h1>
          <p className="text-2xl md:text-3xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Modern, scalable AI assistant built with the latest 2026 stack
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="px-12 py-8 text-xl font-semibold shadow-2xl hover:shadow-3xl"
            >
              🚀 Start Chatting
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-12 py-8 text-xl font-semibold border-2"
            >
              📖 View Docs
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                ⚡ Real-time
              </CardTitle>
              <CardDescription>
                Instant responses with streaming AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>FastAPI WebSockets + React Query for seamless conversations</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                🧠 Semantic Search
              </CardTitle>
              <CardDescription>RAG with vector databases</CardDescription>
            </CardHeader>
            <CardContent>
              <p>PostgreSQL pgvector + Qdrant for intelligent context</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                🔄 Scalable
              </CardTitle>
              <CardDescription>Built for millions of users</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Monorepo + Turborepo + Horizontal scaling ready</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
