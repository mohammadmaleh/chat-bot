import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password_here',
      tier: 'FREE',
    },
  });
  console.log('✅ Created test user:', testUser.email);

  // Create German online stores
  const stores = [
    {
      name: 'Amazon.de',
      domain: 'amazon.de',
      logoUrl: 'https://logo.clearbit.com/amazon.de',
      country: 'DE',
      active: true,
    },
    {
      name: 'MediaMarkt',
      domain: 'mediamarkt.de',
      logoUrl: 'https://logo.clearbit.com/mediamarkt.de',
      country: 'DE',
      active: true,
    },
    {
      name: 'Saturn',
      domain: 'saturn.de',
      logoUrl: 'https://logo.clearbit.com/saturn.de',
      country: 'DE',
      active: true,
    },
    {
      name: 'Otto',
      domain: 'otto.de',
      logoUrl: 'https://logo.clearbit.com/otto.de',
      country: 'DE',
      active: true,
    },
    {
      name: 'Zalando',
      domain: 'zalando.de',
      logoUrl: 'https://logo.clearbit.com/zalando.de',
      country: 'DE',
      active: true,
    },
  ];

  for (const store of stores) {
    const createdStore = await prisma.store.upsert({
      where: { domain: store.domain },
      update: {},
      create: store,
    });
    console.log('✅ Created store:', createdStore.name);
  }

  // Create sample products
  const sampleProducts = [
    {
      name: 'Sony WH-1000XM5 Kopfhörer',
      brand: 'Sony',
      category: 'Elektronik',
      description: 'Kabellose Noise-Cancelling-Kopfhörer',
      ean: '4548736134980',
    },
    {
      name: 'Apple AirPods Pro',
      brand: 'Apple',
      category: 'Elektronik',
      description: 'In-Ear-Kopfhörer mit Geräuschunterdrückung',
      ean: '194253398219',
    },
    {
      name: 'DeLonghi Magnifica Kaffeevollautomat',
      brand: 'DeLonghi',
      category: 'Haushalt',
      description: 'Kaffeevollautomat mit Milchaufschäumdüse',
      ean: '8004399329454',
    },
  ];

  const createdStores = await prisma.store.findMany();
  
  for (const productData of sampleProducts) {
    const product = await prisma.product.upsert({
      where: { ean: productData.ean },
      update: {},
      create: productData,
    });
    console.log('✅ Created product:', product.name);

    // Add prices from different stores
    for (let i = 0; i < 2; i++) {
      const store = createdStores[i];
      const basePrice = 100 + Math.random() * 200;
      
      await prisma.price.create({
        data: {
          productId: product.id,
          storeId: store.id,
          price: Math.round(basePrice * 100) / 100,
          currency: 'EUR',
          availability: true,
          url: `https://${store.domain}/product/${product.ean}`,
        },
      });
    }
  }

  // Create sample conversation
  await prisma.conversation.create({
    data: {
      userId: testUser.id,
      title: 'Suche nach Kopfhörern',
      status: 'ACTIVE',
      messages: {
        create: [
          {
            role: 'USER',
            content: 'Ich suche gute Kopfhörer',
          },
          {
            role: 'ASSISTANT',
            content: 'Gerne helfe ich dir!',
          },
        ],
      },
    },
  });
  console.log('✅ Created sample conversation');

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
