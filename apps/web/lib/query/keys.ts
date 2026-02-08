// Query key factory pattern - prevents key collisions
export const queryKeys = {
  // Health
  health: ['health'] as const,
  
  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.conversations.lists(), userId] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
  },
  
  // Messages
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (conversationId: string) => [...queryKeys.messages.lists(), conversationId] as const,
  },
  
  // Products
  products: {
    all: ['products'] as const,
    searches: () => [...queryKeys.products.all, 'search'] as const,
    search: (query: string) => [...queryKeys.products.searches(), query] as const,
  },
} as const;
