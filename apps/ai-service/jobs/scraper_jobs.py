"""Background job scheduler for automated product scraping."""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from scrapers.amazon import AmazonScraper
from scrapers.thomann import ThomannScraper
from lib.database import prisma
from lib.cache import cache
import logging
from datetime import datetime
import os

logger = logging.getLogger(__name__)

# Configuration
SCRAPING_ENABLED = os.getenv('ENABLE_SCRAPING', 'true').lower() == 'true'
SCRAPE_INTERVAL_HOURS = int(os.getenv('JOB_QUEUE_SCRAPER_INTERVAL_HOURS', '6'))

async def scrape_store(store_name: str, search_queries: list[str]):
    """Scrape a single store for multiple search queries."""
    logger.info(f"🤖 Starting scrape job for {store_name}")
    
    # Initialize scraper
    if store_name.lower() == 'amazon':
        scraper = AmazonScraper()
    elif store_name.lower() == 'thomann':
        scraper = ThomannScraper()
    else:
        logger.error(f"Unknown store: {store_name}")
        return
    
    total_products = 0
    
    try:
        for query in search_queries:
            try:
                logger.info(f"Scraping {store_name} for '{query}'...")
                products = await scraper.search(query, max_results=10)
                
                logger.info(f"✅ Scraped {len(products)} products from {store_name} for '{query}'")
                total_products += len(products)
                
                # Save products to database
                for product_data in products:
                    try:
                        # Check if product exists
                        existing = await prisma.product.find_first(
                            where={'name': product_data.name}
                        )
                        
                        if not existing:
                            # Create new product
                            product = await prisma.product.create(
                                data={
                                    'name': product_data.name,
                                    'brand': product_data.brand,
                                    'category': query,  # Use search query as category
                                    'description': product_data.description,
                                    'imageUrl': product_data.image_url,
                                    'ean': product_data.ean,
                                }
                            )
                        else:
                            product = existing
                        
                        # Get or create store
                        store = await prisma.store.find_first(
                            where={'domain': scraper.store_domain}
                        )
                        
                        if not store:
                            store = await prisma.store.create(
                                data={
                                    'name': scraper.store_name.title(),
                                    'domain': scraper.store_domain,
                                    'country': 'DE',
                                    'active': True
                                }
                            )
                        
                        # Create or update price
                        await prisma.price.upsert(
                            where={
                                'productId': product.id,
                                'storeId': store.id
                            },
                            data={
                                'create': {
                                    'productId': product.id,
                                    'storeId': store.id,
                                    'price': product_data.price,
                                    'currency': product_data.currency,
                                    'availability': product_data.availability,
                                    'url': product_data.url,
                                },
                                'update': {
                                    'price': product_data.price,
                                    'availability': product_data.availability,
                                    'scrapedAt': datetime.utcnow()
                                }
                            }
                        )
                        
                    except Exception as e:
                        logger.error(f"Error saving product '{product_data.name}': {e}")
                        continue
                
                # Invalidate cache for this query
                cache_key = cache.cache_key("search", query=query, limit=5)
                await cache.delete(cache_key)
                
            except Exception as e:
                logger.error(f"Error scraping {store_name} for '{query}': {e}")
                continue
        
        logger.info(f"✅ Completed {store_name} scraping: {total_products} products total")
        
    except Exception as e:
        logger.error(f"❌ Error in scrape job for {store_name}: {e}")
    
    finally:
        await scraper.close()

async def scrape_all_stores_job():
    """Background job to scrape all stores."""
    if not SCRAPING_ENABLED:
        logger.info("⚠️ Scraping disabled, skipping job")
        return
    
    logger.info("📅 Starting scheduled scraping job...")
    start_time = datetime.utcnow()
    
    # Define search queries (can be made dynamic based on popular searches)
    search_queries = [
        'guitar',
        'headphones',
        'laptop',
        'camera',
        'keyboard',
        'monitor',
    ]
    
    stores = ['amazon', 'thomann']
    
    for store_name in stores:
        try:
            await scrape_store(store_name, search_queries)
        except Exception as e:
            logger.error(f"Failed to scrape {store_name}: {e}")
    
    duration = (datetime.utcnow() - start_time).total_seconds()
    logger.info(f"✅ Scraping job completed in {duration:.2f} seconds")

async def cleanup_old_prices_job():
    """Clean up old price records."""
    logger.info("🧽 Cleaning up old price records...")
    
    try:
        # Delete prices older than 30 days
        cutoff_date = datetime.utcnow().replace(day=datetime.utcnow().day - 30)
        
        result = await prisma.price.delete_many(
            where={
                'scrapedAt': {'lt': cutoff_date}
            }
        )
        
        logger.info(f"✅ Deleted {result} old price records")
        
        # Clear related cache
        await cache.delete_pattern("prices:*")
        
    except Exception as e:
        logger.error(f"Error cleaning up old prices: {e}")

def setup_scheduler() -> AsyncIOScheduler:
    """Setup APScheduler for background jobs."""
    scheduler = AsyncIOScheduler(
        timezone='UTC',
        job_defaults={
            'coalesce': True,  # Combine multiple missed runs
            'max_instances': 1,  # Only one instance at a time
            'misfire_grace_time': 900  # 15 minutes grace period
        }
    )
    
    if SCRAPING_ENABLED:
        # Scraping job - runs every N hours
        scheduler.add_job(
            scrape_all_stores_job,
            trigger=IntervalTrigger(hours=SCRAPE_INTERVAL_HOURS),
            id='scrape_stores',
            name='Scrape all stores',
            replace_existing=True,
            next_run_time=datetime.utcnow()  # Run immediately on startup
        )
        logger.info(f"✅ Scheduled scraping job: every {SCRAPE_INTERVAL_HOURS} hours")
    
    # Cleanup job - runs daily at 2 AM
    scheduler.add_job(
        cleanup_old_prices_job,
        trigger='cron',
        hour=2,
        minute=0,
        id='cleanup_prices',
        name='Cleanup old prices',
        replace_existing=True
    )
    logger.info("✅ Scheduled cleanup job: daily at 2 AM UTC")
    
    return scheduler
