// Query key factory pattern - prevents key collisions
export const queryKeys = {
  // Health
  health: ['health'] as const,

  // Chat
  chat: {
    all: ['chat'] as const,
    messages: () => [...queryKeys.chat.all, 'messages'] as const,
  },

  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (userId: string) =>
      [...queryKeys.conversations.lists(), userId] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (conversationId: string) =>
      [...queryKeys.messages.lists(), conversationId] as const,
  },

  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: () => [...queryKeys.products.lists()] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    searches: () => [...queryKeys.products.all, 'search'] as const,
    search: (query: string, category?: string) =>
      [...queryKeys.products.searches(), { query, category }] as const,
  },

  // Stores
  stores: {
    all: ['stores'] as const,
    lists: () => [...queryKeys.stores.all, 'list'] as const,
    list: () => [...queryKeys.stores.lists()] as const,
    details: () => [...queryKeys.stores.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.stores.details(), id] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
} as const;
