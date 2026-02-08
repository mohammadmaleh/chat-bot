"""
Check current database state - READ ONLY, no modifications.
"""

import asyncio
from lib.database import connect_db, disconnect_db
from prisma import Prisma

prisma = Prisma()


async def inspect_database():
    """Inspect database without making changes."""
    print("🔍 DATABASE INSPECTION (READ-ONLY)\n")
    print("=" * 60)

    await connect_db()

    try:
        # Check stores
        print("\n📦 STORES TABLE:")
        stores = await prisma.store.find_many()
        if stores:
            for store in stores:
                print(f"  ✓ {store.name} ({store.domain}) - ID: {store.id}")
        else:
            print("  ⚠️  EMPTY - No stores found!")
            print("  ❌ This is why scraping fails!")

        # Check products
        print("\n📦 PRODUCTS TABLE:")
        product_count = await prisma.product.count()
        print(f"  Total products: {product_count}")

        if product_count > 0:
            recent = await prisma.product.find_many(
                take=5, order_by={"createdAt": "desc"}
            )
            print("\n  Recent products:")
            for p in recent:
                print(f"    - {p.name[:50]}")

        # Check prices
        print("\n📦 PRICES TABLE:")
        price_count = await prisma.price.count()
        print(f"  Total prices: {price_count}")

        # Check users
        print("\n📦 USERS TABLE:")
        user_count = await prisma.user.count()
        print(f"  Total users: {user_count}")

        # Check conversations
        print("\n📦 CONVERSATIONS TABLE:")
        conversation_count = await prisma.conversation.count()
        print(f"  Total conversations: {conversation_count}")

        print("\n" + "=" * 60)
        print("✅ Inspection complete - No changes made")

    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(inspect_database())
