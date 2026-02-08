cat > (src / index.ts) << 'EOF';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';

// Load environment variables
config();

// Create Fastify instance
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Register plugins
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

// Start server
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
EOF;
