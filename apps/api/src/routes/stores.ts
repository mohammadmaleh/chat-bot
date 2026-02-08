import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@chat-bot/database';

const prisma = new PrismaClient();

export async function storesRoutes(app: FastifyInstance) {
  // Get all stores
  app.get('/stores', async (request, reply) => {
    try {
      const stores = await prisma.store.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
      
      return { stores, count: stores.length };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch stores' });
    }
  });

  // Get single store
  app.get('/stores/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const store = await prisma.store.findUnique({
        where: { id },
        include: {
          prices: {
            take: 10,
            orderBy: { scrapedAt: 'desc' },
          },
        },
      });
      
      if (!store) {
        return reply.status(404).send({ error: 'Store not found' });
      }
      
      return { store };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch store' });
    }
  });
}
