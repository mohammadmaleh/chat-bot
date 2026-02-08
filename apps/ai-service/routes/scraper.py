"""
Scraper API routes.
Endpoints for triggering product scraping and price updates.
"""
from scrapers.thomann import ThomannScraper  # ADD THIS

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from scrapers.amazon import AmazonScraper
from scrapers.thomann import ThomannScraper  # ADD THIS LINE
from services.price_service import PriceService
from services.cache_service import CacheService
# Import scrapers (they're in same parent directory)
from scrapers.amazon import AmazonScraper
from services.price_service import PriceService
from services.cache_service import CacheService

router = APIRouter(prefix="/api/scraper", tags=["scraper"])


# Request/Response Models
class ScrapeSearchRequest(BaseModel):
    query: str
    store: str = "amazon"  # Default to Amazon
    max_results: int = 10


class ScrapeSearchResponse(BaseModel):
    success: bool
    products_scraped: int
    products_saved: int
    products: List[dict]


class ScrapePriceRequest(BaseModel):
    url: str
    store: str = "amazon"


class ScrapePriceResponse(BaseModel):
    success: bool
    product_id: Optional[str]
    price: Optional[float]
    message: str


class CacheStatsResponse(BaseModel):
    success: bool
    stats: dict

@router.post("/search", response_model=ScrapeSearchResponse)
async def scrape_and_save_search(request: ScrapeSearchRequest):
    """
    Scrape products from a store and save to database.
    """
    try:
        products_scraped = []
        products_saved = 0
        
        store_lower = request.store.lower()
        
        # Route to correct scraper
        if store_lower == "amazon":
            async with AmazonScraper() as scraper:
                scraped_products = await scraper.search(request.query, request.max_results)
        elif store_lower == "thomann":
            async with ThomannScraper() as scraper:
                scraped_products = await scraper.search(request.query, request.max_results)
        else:
            raise HTTPException(400, f"Store '{request.store}' not supported yet. Use 'amazon' or 'thomann'")
        
        print(f"✅ Scraped {len(scraped_products)} products from {request.store}")
        
        # Save to database
        async with PriceService() as price_service:
            for scraped in scraped_products:
                try:
                    result = await price_service.save_scraped_product(
                        scraped,
                        store_name=request.store.title(),
                        store_domain=f"{request.store}.de"
                    )
                    
                    products_saved += 1
                    products_scraped.append({
                        "name": scraped.name,
                        "price": float(scraped.price),
                        "currency": scraped.currency,
                        "url": scraped.url,
                        "image_url": scraped.image_url,
                        "product_id": result["product_id"],
                        "availability": scraped.availability
                    })
                except Exception as e:
                    print(f"❌ Error saving product: {e}")
                    continue
        
        print(f"💾 Saved {products_saved} products to database")
        
        return ScrapeSearchResponse(
            success=True,
            products_scraped=len(scraped_products),
            products_saved=products_saved,
            products=products_scraped
        )
    
    except Exception as e:
        print(f"❌ Scrape search error: {e}")
        raise HTTPException(500, str(e))

@router.get("/cache/stats", response_model=CacheStatsResponse)
async def get_cache_stats():
    """
    Get Redis cache statistics.
    
    Example:
        GET /api/scraper/cache/stats
    """
    try:
        cache = CacheService()
        stats = await cache.get_stats()
        await cache.close()
        
        return CacheStatsResponse(
            success=True,
            stats=stats
        )
    
    except Exception as e:
        print(f"❌ Cache stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cache/clear")
async def clear_cache():
    """
    Clear all cache entries. USE WITH CAUTION!
    
    Example:
        POST /api/scraper/cache/clear
    """
    try:
        cache = CacheService()
        await cache.clear_all()
        await cache.close()
        
        return {
            "success": True,
            "message": "Cache cleared successfully"
        }
    
    except Exception as e:
        print(f"❌ Cache clear error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stores")
async def list_supported_stores():
    """
    List all supported stores for scraping.
    
    Example:
        GET /api/scraper/stores
    """
    return {
        "success": True,
        "stores": [
            {
                "name": "Amazon",
                "domain": "amazon.de",
                "country": "DE",
                "supported": True,
                "features": ["search", "product_detail", "price_tracking"]
            },
            {
                "name": "Thomann",
                "domain": "thomann.de",
                "country": "DE",
                "supported": False,
                "features": []
            },
            {
                "name": "MediaMarkt",
                "domain": "mediamarkt.de",
                "country": "DE",
                "supported": False,
                "features": []
            }
        ]
    }
