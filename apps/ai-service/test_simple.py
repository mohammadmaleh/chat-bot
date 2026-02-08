"""
Simple test for Amazon scraper without database dependencies.
"""
import asyncio
import sys
from pathlib import Path

print("🔄 Starting imports...")

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from scrapers.amazon import AmazonScraper
from scrapers.base_scraper import ScrapedProduct

# Direct import to avoid __init__.py
import services.cache_service
CacheService = services.cache_service.CacheService

print("✅ Imports successful!")


async def test_amazon_search():
    """Test Amazon.de search functionality."""
    print("\n🔍 Testing Amazon.de search...")
    print("   Initializing scraper...")
    
    try:
        async with AmazonScraper() as scraper:
            print("   Scraper initialized, starting search...")
            results = await scraper.search("Gitarre", max_results=2)
            
            print(f"✅ Found {len(results)} products\n")
            
            for i, product in enumerate(results, 1):
                print(f"Product {i}:")
                print(f"  Name: {product.name[:60]}...")
                print(f"  Price: €{product.price}")
                print(f"  Available: {product.availability}")
                print()
    except Exception as e:
        print(f"❌ Search failed: {e}")
        import traceback
        traceback.print_exc()


async def test_cache():
    """Test Redis cache."""
    print("🗄️  Testing Redis cache...")
    
    cache = CacheService()
    
    try:
        print("   Setting cache value...")
        # Test product caching
        test_data = {'name': 'Test Product', 'price': 29.99}
        await cache.set_product('https://test.com', test_data)
        
        print("   Getting cache value...")
        cached = await cache.get_product('https://test.com')
        
        if cached and cached['name'] == 'Test Product':
            print("✅ Cache working correctly!")
            print(f"  Cached: {cached}")
        else:
            print("❌ Cache test failed")
        
        # Get cache stats
        print("   Getting cache stats...")
        stats = await cache.get_stats()
        print(f"\n📊 Cache Stats:")
        print(f"  Total keys: {stats['total_keys']}")
        print(f"  TTL: {stats['ttl_hours']} hours")
        print()
        
    except Exception as e:
        print(f"❌ Cache test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await cache.close()


async def main():
    """Run all tests."""
    print("=" * 60)
    print("🚀 STARTING SCRAPER TESTS")
    print("=" * 60)
    
    try:
        # Test 1: Cache (quick test first)
        await test_cache()
        
        # Test 2: Amazon search (slower)
        await test_amazon_search()
        
        print("=" * 60)
        print("✅ ALL TESTS COMPLETED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("🚀 Script starting...")
    asyncio.run(main())
    print("✅ Script finished!")
