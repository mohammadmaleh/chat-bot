"""
Check if stores exist in database and create them if needed.
"""

import asyncio
from lib.database import (
    connect_db,
    disconnect_db,
    prisma,
)  # Use the shared prisma instance


async def check_and_create_stores():
    """Ensure Amazon and Thomann stores exist in database."""
    print("🔍 Checking database stores...\n")

    await connect_db()

    try:
        # Check existing stores
        stores = await prisma.store.find_many()

        print(f"📦 Found {len(stores)} stores in database:")
        for store in stores:
            print(f"  - {store.name} ({store.domain})")

        # Create stores if they don't exist
        stores_to_create = [
            {
                "name": "Amazon",
                "domain": "amazon.de",
                "country": "DE",
                "logoUrl": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            },
            {
                "name": "Thomann",
                "domain": "thomann.de",
                "country": "DE",
                "logoUrl": "https://www.thomann.de/pics/tm/thomann-logo.svg",
            },
        ]

        existing_domains = {store.domain for store in stores}

        for store_data in stores_to_create:
            if store_data["domain"] not in existing_domains:
                print(f"\n➕ Creating store: {store_data['name']}")
                created = await prisma.store.create(data=store_data)
                print(f"   ✅ Created: {created.name} (ID: {created.id})")
            else:
                print(f"\n✓ Store already exists: {store_data['name']}")

        # Show final state
        print("\n" + "=" * 60)
        print("📦 FINAL STORE LIST:")
        print("=" * 60)
        all_stores = await prisma.store.find_many()
        for store in all_stores:
            print(f"  {store.name}")
            print(f"    Domain: {store.domain}")
            print(f"    Country: {store.country}")
            print(f"    ID: {store.id}")
            print()

    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(check_and_create_stores())
