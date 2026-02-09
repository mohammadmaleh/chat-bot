"""
Seed database with sample products for testing.
"""
import asyncio
from lib.database import prisma, connect_db, disconnect_db
from decimal import Decimal

async def seed_products():
    """Add sample products and prices to database."""
    await connect_db()
    
    print("🌱 Seeding sample products...")
    
    # Get stores
    amazon = await prisma.store.find_first(where={"name": "Amazon"})
    thomann = await prisma.store.find_first(where={"name": "Thomann"})
    
    if not amazon or not thomann:
        print("❌ Stores not found. Run 'make seed-stores' first!")
        return
    
    # Sample products
    products_data = [
        {
            "name": "DeLonghi Magnifica S ECAM 22.110.B",
            "brand": "DeLonghi",
            "category": "Coffee Machines",
            "description": "Automatic coffee machine with milk frother",
            "imageUrl": "https://m.media-amazon.com/images/I/71X9E9fvZYL._AC_SL1500_.jpg",
            "prices": [
                {"store": amazon, "price": 299.99},
                {"store": thomann, "price": 289.99}
            ]
        },
        {
            "name": "Philips 3200 Series LatteGo",
            "brand": "Philips",
            "category": "Coffee Machines",
            "description": "Fully automatic espresso machine",
            "imageUrl": "https://m.media-amazon.com/images/I/71kWymZ+c-L._AC_SL1500_.jpg",
            "prices": [
                {"store": amazon, "price": 449.99}
            ]
        },
        {
            "name": "Fender Player Stratocaster",
            "brand": "Fender",
            "category": "Electric Guitars",
            "description": "Classic electric guitar, made in Mexico",
            "imageUrl": "https://media.thomann.de/pics/bdb/451407/14750643_800.jpg",
            "prices": [
                {"store": thomann, "price": 699.00},
                {"store": amazon, "price": 729.00}
            ]
        },
        {
            "name": "Gibson Les Paul Standard",
            "brand": "Gibson",
            "category": "Electric Guitars",
            "description": "Premium electric guitar, made in USA",
            "imageUrl": "https://media.thomann.de/pics/bdb/487171/15420512_800.jpg",
            "prices": [
                {"store": thomann, "price": 2299.00}
            ]
        },
        {
            "name": "Sony WH-1000XM5",
            "brand": "Sony",
            "category": "Headphones",
            "description": "Wireless noise-canceling headphones",
            "imageUrl": "https://m.media-amazon.com/images/I/61vEW2roGxL._AC_SL1500_.jpg",
            "prices": [
                {"store": amazon, "price": 379.00},
                {"store": thomann, "price": 399.00}
            ]
        },
        {
            "name": "Bose QuietComfort 45",
            "brand": "Bose",
            "category": "Headphones",
            "description": "Premium wireless headphones",
            "imageUrl": "https://m.media-amazon.com/images/I/51JKhCRJRSL._AC_SL1500_.jpg",
            "prices": [
                {"store": amazon, "price": 299.00}
            ]
        }
    ]
    
    products_created = 0
    prices_created = 0
    
    for product_data in products_data:
        # Create product
        product = await prisma.product.create(
            data={
                "name": product_data["name"],
                "brand": product_data["brand"],
                "category": product_data["category"],
                "description": product_data["description"],
                "imageUrl": product_data["imageUrl"]
            }
        )
        products_created += 1
        print(f"  ✅ Created product: {product.name}")
        
        # Create prices
        for price_data in product_data["prices"]:
            price = await prisma.price.create(
                data={
                    "productId": product.id,
                    "storeId": price_data["store"].id,
                    "price": Decimal(str(price_data["price"])),
                    "currency": "EUR",
                    "availability": True,
                    "url": f"https://{price_data['store'].domain}/product/{product.id}"
                }
            )
            prices_created += 1
    
    print(f"\n✅ Seeded {products_created} products with {prices_created} prices")
    
    await disconnect_db()

if __name__ == "__main__":
    asyncio.run(seed_products())
