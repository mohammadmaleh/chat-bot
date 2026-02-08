import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Major German online stores for price comparison
const germanStores = [
  {
    name: 'Amazon.de',
    domain: 'amazon.de',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    country: 'DE',
    active: true,
  },
  {
    name: 'MediaMarkt',
    domain: 'mediamarkt.de',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/4/43/MediaMarkt_logo.svg',
    country: 'DE',
    active: true,
  },
  {
    name: 'Saturn',
    domain: 'saturn.de',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/3/3e/Saturn_Logo.svg',
    country: 'DE',
    active: true,
  },
  {
    name: 'Otto',
    domain: 'otto.de',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/d/d6/OTTO_Logo.svg',
    country: 'DE',
    active: true,
  },
  {
    name: 'Zalando',
    domain: 'zalando.de',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zalando_logo.svg',
    country: 'DE',
    active: true,
  },
  {
    name: 'Idealo',
    domain: 'idealo.de',
    logoUrl: 'https://cdn.idealo.com/folder/Common/logo.svg',
    country: 'DE',
    active: true,
  },
  {
    name: 'eBay.de',
    domain: 'ebay.de',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
    country: 'DE',
    active: true,
  },
  {
    name: 'Notebooksbilliger',
    domain: 'notebooksbilliger.de',
    logoUrl: 'https://www.notebooksbilliger.de/images/logo.svg',
    country: 'DE',
    active: true,
  },
];

// Sample products for testing
const sampleProducts = [
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    brand: 'Sony',
    category: 'Electronics',
    description:
      'Industry-leading noise canceling headphones with premium sound quality',
    imageUrl: 'https://example.com/sony-headphones.jpg',
    ean: '4548736134980',
  },
  {
    name: 'DeLonghi Magnifica S Coffee Machine',
    brand: 'DeLonghi',
    category: 'Home & Kitchen',
    description: 'Automatic bean-to-cup coffee machine with milk frother',
    imageUrl: 'https://example.com/delonghi.jpg',
    ean: '8004399329157',
  },
  {
    name: 'Kindle Paperwhite (2024)',
    brand: 'Amazon',
    category: 'Electronics',
    description:
      'Waterproof e-reader with 6.8" display and adjustable warm light',
    imageUrl: 'https://example.com/kindle.jpg',
    ean: '8413907811335',
  },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - be careful in production!)
  console.log('🗑️  Clearing existing data...');
  await prisma.price.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();

  // Seed Stores
  console.log('🏪 Seeding German stores...');
  for (const store of germanStores) {
    await prisma.store.upsert({
      where: { domain: store.domain },
      update: {},
      create: store,
    });
    console.log(`  ✅ ${store.name}`);
  }

  // Seed Sample Products
  console.log('\n📦 Seeding sample products...');
  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { ean: product.ean },
      update: {},
      create: product,
    });
    console.log(`  ✅ ${product.name}`);
  }

  // Create sample prices for products
  console.log('\n💰 Creating sample prices...');
  const stores = await prisma.store.findMany();
  const products = await prisma.product.findMany();

  for (const product of products) {
    // Create 2-4 random prices per product
    const numPrices = Math.floor(Math.random() * 3) + 2;
    const selectedStores = stores
      .sort(() => 0.5 - Math.random())
      .slice(0, numPrices);

    for (const store of selectedStores) {
      const basePrice = Math.random() * 300 + 50; // Random price between 50-350
      await prisma.price.create({
        data: {
          productId: product.id,
          storeId: store.id,
          price: basePrice.toFixed(2),
          currency: 'EUR',
          availability: Math.random() > 0.1, // 90% available
          url: `https://${store.domain}/product/${product.ean}`,
        },
      });
    }
    console.log(`  ✅ Prices for ${product.name}`);
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - ${germanStores.length} stores`);
  console.log(`   - ${sampleProducts.length} products`);
  console.log(`   - Multiple price entries created`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
