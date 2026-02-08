import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@chat-bot/database';

const prisma = new PrismaClient();

export async function conversationsRoutes(app: FastifyInstance) {
  // Create a new conversation
  app.post('/conversations', async (request, reply) => {
    const { userId, title } = request.body as { userId: string; title?: string };

    if (!userId) {
      return reply.status(400).send({ error: 'userId is required' });
    }

    try {
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          title: title || 'New Conversation',
          status: 'ACTIVE',
        },
      });

      return { conversation };
    } catch (error) {
      console.error('Create conversation error:', error);
      reply.status(500).send({ error: 'Failed to create conversation' });
    }
  });

  // Get all conversations for a user
  app.get('/conversations', async (request, reply) => {
    const { userId } = request.query as { userId?: string };

    if (!userId) {
      return reply.status(400).send({ error: 'userId query parameter is required' });
    }

    try {
      const conversations = await prisma.conversation.findMany({
        where: { 
          userId,
          status: { not: 'DELETED' },
        },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return { conversations, count: conversations.length };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch conversations' });
    }
  });

  // Get single conversation with all messages
  app.get('/conversations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!conversation) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }

      return { conversation };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch conversation' });
    }
  });

  // Add a message to a conversation
  app.post('/conversations/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { role, content, metadata } = request.body as { 
      role: 'USER' | 'ASSISTANT' | 'SYSTEM'; 
      content: string;
      metadata?: any;
    };

    if (!role || !content) {
      return reply.status(400).send({ error: 'role and content are required' });
    }

    try {
      const message = await prisma.message.create({
        data: {
          conversationId: id,
          role,
          content,
          metadata: metadata || undefined,
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return { message };
    } catch (error) {
      console.error('Create message error:', error);
      reply.status(500).send({ error: 'Failed to create message' });
    }
  });
}
