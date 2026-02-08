import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@chat-bot/database';

const prisma = new PrismaClient();

export async function productsRoutes(app: FastifyInstance) {
  // Search products
  app.get('/products/search', async (request, reply) => {
    const { q, category } = request.query as { q?: string; category?: string };
    
    if (!q) {
      return reply.status(400).send({ error: 'Search query "q" is required' });
    }

    try {
      const products = await prisma.product.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { brand: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            category ? { category: { contains: category, mode: 'insensitive' } } : {},
          ],
        },
        include: {
          prices: {
            include: {
              store: true,
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
        take: 20,
      });

      const productsWithBestPrice = products.map((product) => {
        const availablePrices = product.prices.filter((p) => p.availability);
        const bestPrice = availablePrices.length > 0 ? availablePrices[0] : null;

        return {
          ...product,
          bestPrice: bestPrice ? {
            price: bestPrice.price,
            store: bestPrice.store.name,
            url: bestPrice.url,
          } : null,
          priceCount: product.prices.length,
        };
      });

      return { 
        products: productsWithBestPrice, 
        count: productsWithBestPrice.length,
        query: q,
      };
    } catch (error) {
      console.error('Search error:', error);
      reply.status(500).send({ error: 'Failed to search products' });
    }
  });

  // Get single product with all prices
  app.get('/products/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          prices: {
            include: {
              store: true,
            },
            orderBy: {
              price: 'asc',
            },
          },
        },
      });

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      return { product };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch product' });
    }
  });

  // Get all products
  app.get('/products', async (request, reply) => {
    try {
      const products = await prisma.product.findMany({
        include: {
          prices: {
            include: {
              store: true,
            },
            orderBy: {
              price: 'asc',
            },
            take: 1,
          },
        },
        take: 50,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return { products, count: products.length };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch products' });
    }
  });
}
