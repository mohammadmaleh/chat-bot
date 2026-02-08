'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/types';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationsSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationsSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationsSidebarProps) {
  return (
    <div className="w-64 border-r flex flex-col h-full bg-muted/30">
      <div className="p-4 border-b">
        <Button onClick={onNewConversation} className="w-full" size="sm">
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Neuer Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'group relative rounded-md hover:bg-muted transition-colors',
                currentConversationId === conversation.id && 'bg-muted'
              )}
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3 px-3"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conversation.title || 'Neuer Chat'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conversation.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
