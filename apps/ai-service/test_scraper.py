"""
Test script for Amazon scraper.
Tests search, product detail extraction, and database integration.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from scrapers.amazon import AmazonScraper
from scrapers.base_scraper import ScrapedProduct
from services.price_service import PriceService
from services.cache_service import CacheService


async def test_amazon_search():
    """Test Amazon.de search functionality."""
    print("🔍 Testing Amazon.de search...")
    
    async with AmazonScraper() as scraper:
        results = await scraper.search("Fender Gitarre", max_results=3)
        
        print(f"✅ Found {len(results)} products\n")
        
        for i, product in enumerate(results, 1):
            print(f"Product {i}:")
            print(f"  Name: {product.name}")
            print(f"  Price: {product.price} {product.currency}")
            print(f"  Available: {product.availability}")
            print(f"  URL: {product.url[:60]}...")
            print(f"  Image: {product.image_url[:60] if product.image_url else 'N/A'}...")
            print()


async def test_amazon_product_detail():
    """Test Amazon.de product detail extraction."""
    print("🔎 Testing Amazon.de product detail extraction...")
    
    # Example guitar product URL
    test_url = "https://www.amazon.de/dp/B0002CZUUA"
    
    async with AmazonScraper() as scraper:
        product = await scraper.get_product(test_url)
        
        if product:
            print("✅ Product details extracted:\n")
            print(f"  Name: {product.name}")
            print(f"  Brand: {product.brand}")
            print(f"  Price: {product.price} {product.currency}")
            print(f"  Available: {product.availability}")
            print(f"  EAN/ASIN: {product.ean}")
            print(f"  Description: {product.description[:100] if product.description else 'N/A'}...")
            print()
        else:
            print("❌ Failed to extract product details")


async def test_save_to_database():
    """Test saving scraped data to database."""
    print("💾 Testing database integration...")
    
    # First scrape a product
    async with AmazonScraper() as scraper:
        results = await scraper.search("Kaffee", max_results=1)
        
        if not results:
            print("❌ No products found to save")
            return
        
        product = results[0]
        print(f"Scraped: {product.name}")
        
        # Save to database
        async with PriceService() as price_service:
            result = await price_service.save_scraped_product(
                product,
                store_name="Amazon",
                store_domain="amazon.de"
            )
            
            print(f"✅ Saved to database!")
            print(f"  Product ID: {result['product_id']}")
            print(f"  Price ID: {result['price_id']}")
            print()


async def test_cache():
    """Test Redis cache."""
    print("🗄️  Testing Redis cache...")
    
    cache = CacheService()
    
    # Test product caching
    test_data = {'name': 'Test Product', 'price': 29.99}
    await cache.set_product('https://test.com', test_data)
    
    cached = await cache.get_product('https://test.com')
    
    if cached and cached['name'] == 'Test Product':
        print("✅ Cache working correctly!")
    else:
        print("❌ Cache test failed")
    
    # Get cache stats
    stats = await cache.get_stats()
    print(f"  Total keys: {stats['total_keys']}")
    print(f"  TTL: {stats['ttl_hours']} hours")
    print()
    
    await cache.close()


async def main():
    """Run all tests."""
    print("=" * 60)
    print("🚀 STARTING SCRAPER TESTS")
    print("=" * 60)
    print()
    
    try:
        # Test 1: Search
        await test_amazon_search()
        
        # Test 2: Product detail
        await test_amazon_product_detail()
        
        # Test 3: Cache
        await test_cache()
        
        # Test 4: Database (requires Prisma setup)
        # await test_save_to_database()
        
        print("=" * 60)
        print("✅ ALL TESTS COMPLETED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
