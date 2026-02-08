import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@chat-bot/database';
import { generateAIResponse, extractUserIntent } from '../services/ai.js';

const prisma = new PrismaClient();

export async function chatRoutes(app: FastifyInstance) {
  app.post('/chat', async (request, reply) => {
    const { userId, conversationId, message } = request.body as {
      userId: string;
      conversationId?: string;
      message: string;
    };

    if (!userId || !message) {
      return reply
        .status(400)
        .send({ error: 'userId and message are required' });
    }

    try {
      let conversation;
      if (conversationId) {
        conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
      } else {
        conversation = await prisma.conversation.create({
          data: {
            userId,
            title: message.substring(0, 50),
            status: 'ACTIVE',
          },
          include: { messages: true },
        });
      }

      if (!conversation) {
        return reply.status(404).send({ error: 'Conversation not found' });
      }

      const userMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: message,
        },
      });

      const intent = await extractUserIntent(message);
      let products: any[] = [];

      if (intent.keywords.length > 0) {
        products = await prisma.product.findMany({
          where: {
            OR: intent.keywords.map((keyword: string) => ({
              OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { brand: { contains: keyword, mode: 'insensitive' } },
                { category: { contains: keyword, mode: 'insensitive' } },
              ],
            })),
          },
          include: {
            prices: {
              include: { store: true },
              orderBy: { price: 'asc' },
              take: 3,
            },
          },
          take: 5,
        });
      }

      const messageHistory = [
        ...conversation.messages.map((m) => ({
          role: m.role.toLowerCase() as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: message },
      ];

      const aiResponse = await generateAIResponse(messageHistory, {
        availableProducts: products,
      });

      const assistantMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: aiResponse,
          metadata: { intent, productsFound: products.length },
        },
      });

      return {
        conversationId: conversation.id,
        userMessage,
        assistantMessage,
        products,
      };
    } catch (error) {
      console.error('Chat error:', error);
      reply.status(500).send({ error: 'Failed to process chat message' });
    }
  });
}
