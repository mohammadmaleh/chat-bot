import asyncio
from lib.database import connect_db, disconnect_db, search_products

async def test():
    print("🔌 Connecting to database...")
    await connect_db()
    
    print("🔍 Testing product search...")
    products = await search_products("coffee", limit=3)
    
    print(f"\n✅ Found {len(products)} products:")
    for p in products:
        print(f"  - {p['name']} by {p.get('brand', 'Unknown')}")
        if p.get('prices'):
            print(f"    💰 Cheapest: €{p.get('cheapest_price', 'N/A')}")
    
    await disconnect_db()
    print("\n✅ Test completed!")

if __name__ == "__main__":
    asyncio.run(test())
