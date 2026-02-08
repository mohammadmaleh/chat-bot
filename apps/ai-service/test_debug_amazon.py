"""
Debug Amazon scraper to see what's happening.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from scrapers.amazon import AmazonScraper


async def debug_search():
    """Debug Amazon search with screenshots."""
    print("🔍 Debug Amazon.de search...\n")
    
    scraper = AmazonScraper()
    
    try:
        # Initialize browser
        print("1. Initializing browser...")
        await scraper.init_browser()
        print("   ✅ Browser ready\n")
        
        # Navigate to Amazon
        search_url = "https://www.amazon.de/s?k=Gitarre"
        print(f"2. Navigating to: {search_url}")
        await scraper.page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
        print("   ✅ Page loaded\n")
        
        # Take screenshot for debugging
        await scraper.page.screenshot(path='amazon_search.png')
        print("   📸 Screenshot saved: amazon_search.png\n")
        
        # Check page title
        title = await scraper.page.title()
        print(f"3. Page title: {title}\n")
        
        # Check if search results selector exists
        print("4. Looking for product cards...")
        selector = '[data-component-type="s-search-result"]'
        
        try:
            await scraper.page.wait_for_selector(selector, timeout=5000)
            print(f"   ✅ Found selector: {selector}\n")
        except Exception as e:
            print(f"   ❌ Selector not found: {selector}")
            print(f"   Error: {e}\n")
            
            # Try alternative selectors
            print("5. Trying alternative selectors...")
            alt_selectors = [
                '.s-result-item',
                '[data-asin]',
                '.s-card-container',
                'div[data-component-type]'
            ]
            
            for alt_sel in alt_selectors:
                try:
                    await scraper.page.wait_for_selector(alt_sel, timeout=2000)
                    print(f"   ✅ Found alternative: {alt_sel}")
                    
                    # Count how many
                    count = await scraper.page.locator(alt_sel).count()
                    print(f"   📊 Count: {count}\n")
                    break
                except:
                    print(f"   ❌ Not found: {alt_sel}")
        
        # Get page content snippet
        print("6. Page content (first 500 chars):")
        content = await scraper.page.content()
        print(content[:500])
        print("\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await scraper.close()
        print("\n✅ Browser closed")


if __name__ == "__main__":
    asyncio.run(debug_search())
