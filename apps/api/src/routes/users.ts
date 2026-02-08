import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@chat-bot/database';

const prisma = new PrismaClient();

export async function usersRoutes(app: FastifyInstance) {
  // Get all users (for testing only - remove in production!)
  app.get('/users', async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        createdAt: true,
      },
    });
    return { users };
  });
}
