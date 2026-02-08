'use client';

import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationsSidebar } from '@/components/chat/conversations-sidebar';
import { useSendMessage, useConversation, useConversations, useDeleteConversation } from '@/hooks/use-chat';
import { Product } from '@/types';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [conversationId, setConversationId] = useState<string>();
  const [products, setProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hardcoded user ID - replace with actual auth later
  const userId = 'cmld3ufw40000u6wzx7rh2qb2';

  // React Query hooks
  const sendMessage = useSendMessage();
  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(userId);
  const deleteConversation = useDeleteConversation();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSendMessage = async (message: string) => {
    try {
      const response = await sendMessage.mutateAsync({
        userId,
        conversationId,
        message,
      });

      // Update conversation ID if it's a new conversation
      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      // Update products if any were found
      if (response.products.length > 0) {
        setProducts(response.products);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleNewConversation = () => {
    setConversationId(undefined);
    setProducts([]);
  };

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    setProducts([]);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation.mutateAsync(id);
      if (conversationId === id) {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Conversations Sidebar */}
      <ConversationsSidebar
        conversations={conversations}
        currentConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Chat Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-background">
          <h1 className="text-2xl font-bold">🤖 German Price Comparison AI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Finde die besten Preise für deine Produkte
          </p>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto">
            {conversationLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : conversation?.messages && conversation.messages.length > 0 ? (
              <>
                {conversation.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="text-6xl">🛒</div>
                <div>
                  <h2 className="text-2xl font-semibold mb-2">
                    Willkommen beim Preisvergleich!
                  </h2>
                  <p className="text-muted-foreground">
                    Frage nach Produkten und finde die besten Preise in Deutschland
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={sendMessage.isPending}
        />
      </div>

      {/* Products Sidebar */}
      {products.length > 0 && (
        <div className="w-96 border-l bg-muted/30 overflow-y-auto">
          <div className="p-4 border-b bg-background sticky top-0 z-10">
            <h2 className="text-xl font-bold">Gefundene Produkte</h2>
            <p className="text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? 'Produkt' : 'Produkte'}
            </p>
          </div>
          <div className="p-4 space-y-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
