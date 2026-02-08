import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';
import { storesRoutes } from './routes/stores.js';
import { productsRoutes } from './routes/products.js';
import { conversationsRoutes } from './routes/conversations.js';
import { usersRoutes } from './routes/users.js';
import { chatRoutes } from './routes/chat.js';

config();

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

await app.register(helmet);
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
await app.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

// Health check route
app.get('/health', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'chat-bot-api',
  };
});

// Root route
app.get('/', async () => {
  return {
    message: '🤖 German Price Comparison AI API',
    version: '1.0.0',
    docs: '/docs',
  };
});

// Register routes
await app.register(storesRoutes, { prefix: '/api' });
await app.register(productsRoutes, { prefix: '/api' });
await app.register(conversationsRoutes, { prefix: '/api' });
await app.register(usersRoutes, { prefix: '/api' });
await app.register(chatRoutes, { prefix: '/api' });


const start = async () => {
  try {
    const port = Number(process.env.PORT) || 8000;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
