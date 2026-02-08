"""
Smart Scraping Service - Intelligent cache-or-scrape decision making.
Combines database lookups with live scraping for fresh data.
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from scrapers.amazon import AmazonScraper
from scrapers.thomann import ThomannScraper
from services.price_service import PriceService
from lib.database import search_products, get_product_prices
import asyncio


class SmartScraperService:
    """
    Intelligent scraping service that:
    1. Checks database first
    2. Determines if data is fresh enough
    3. Triggers live scraping if needed
    4. Merges and deduplicates results
    """

    def __init__(self, cache_ttl_hours: int = 24):
        """
        Args:
            cache_ttl_hours: How old database data can be before re-scraping
        """
        self.cache_ttl_hours = cache_ttl_hours
        self.scrapers = {"amazon": AmazonScraper, "thomann": ThomannScraper}

    async def intelligent_search(
        self,
        query: str,
        stores: List[str] = None,
        max_results_per_store: int = 5,
        force_scrape: bool = False,
    ) -> Dict:
        """
        Intelligent product search with automatic scraping decision.

        Args:
            query: Search query (e.g., "guitar")
            stores: List of stores to search (default: all available)
            max_results_per_store: Max products per store
            force_scrape: Skip database, always scrape fresh

        Returns:
            {
                'products': [...],
                'sources': {'database': 2, 'scraped': 6},
                'stores_searched': ['amazon', 'thomann'],
                'total_count': 8
            }
        """
        stores = stores or list(self.scrapers.keys())

        results = {
            "products": [],
            "sources": {"database": 0, "scraped": 0},
            "stores_searched": stores,
            "total_count": 0,
            "scraping_triggered": [],
        }

        # Step 1: Check database first (unless force_scrape)
        db_products = []
        if not force_scrape:
            db_products = await search_products(
                query, limit=max_results_per_store * len(stores)
            )

            # Check if database data is fresh
            fresh_products = self._filter_fresh_products(db_products)

            if fresh_products:
                print(f"✅ Found {len(fresh_products)} fresh products in database")
                results["products"].extend(fresh_products)
                results["sources"]["database"] = len(fresh_products)

        # Step 2: Determine if we need to scrape
        needs_scraping = force_scrape or len(results["products"]) < (
            max_results_per_store * len(stores) / 2
        )

        if needs_scraping:
            print(f"🔍 Database insufficient, triggering live scraping from {stores}")
            results["scraping_triggered"] = stores

            # Step 3: Scrape in parallel from all stores
            scraped_products = await self._scrape_all_stores(
                query, stores, max_results_per_store
            )

            if scraped_products:
                print(f"✅ Scraped {len(scraped_products)} new products")
                results["products"].extend(scraped_products)
                results["sources"]["scraped"] = len(scraped_products)

        # Step 4: Deduplicate and sort by price
        results["products"] = self._deduplicate_products(results["products"])
        results["products"] = sorted(
            results["products"], key=lambda x: x.get("price", float("inf"))
        )
        results["total_count"] = len(results["products"])

        return results

    def _filter_fresh_products(self, products: List[Dict]) -> List[Dict]:
        """Filter products that have recent price data."""
        fresh_cutoff = datetime.utcnow() - timedelta(hours=self.cache_ttl_hours)
        fresh = []

        for product in products:
            # Check if product has recent price updates
            if product.get("updatedAt"):
                try:
                    updated_at = datetime.fromisoformat(
                        product["updatedAt"].replace("Z", "+00:00")
                    )
                    if updated_at > fresh_cutoff:
                        fresh.append(product)
                except:
                    pass

        return fresh

    async def _scrape_all_stores(
        self, query: str, stores: List[str], max_results: int
    ) -> List[Dict]:
        """Scrape from multiple stores in parallel."""
        tasks = []

        for store_name in stores:
            if store_name in self.scrapers:
                task = self._scrape_store(store_name, query, max_results)
                tasks.append(task)

        # Run all scrapers concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Flatten results and filter errors
        all_products = []
        for result in results:
            if isinstance(result, list):
                all_products.extend(result)
            elif isinstance(result, Exception):
                print(f"⚠️ Scraping error: {result}")

        return all_products

    async def _scrape_store(
        self, store_name: str, query: str, max_results: int
    ) -> List[Dict]:
        """Scrape a single store and save to database."""
        scraper_class = self.scrapers[store_name]
        products_saved = []

        try:
            async with scraper_class() as scraper:
                print(f"🔍 Scraping {store_name} for '{query}'...")
                scraped_products = await scraper.search(query, max_results)

                # Save to database
                async with PriceService() as price_service:
                    for scraped in scraped_products:
                        try:
                            result = await price_service.save_scraped_product(
                                scraped,
                                store_name=store_name.title(),
                                store_domain=f"{store_name}.de",
                            )

                            # Convert to dict format
                            products_saved.append(
                                {
                                    "id": result["product_id"],
                                    "name": scraped.name,
                                    "brand": scraped.brand,
                                    "price": float(scraped.price),
                                    "currency": scraped.currency,
                                    "url": scraped.url,
                                    "imageUrl": scraped.image_url,
                                    "availability": scraped.availability,
                                    "store": store_name,
                                    "scraped_fresh": True,  # Mark as freshly scraped
                                }
                            )
                        except Exception as e:
                            print(f"⚠️ Error saving product: {e}")
                            continue

                print(f"✅ {store_name}: Saved {len(products_saved)} products")
                return products_saved

        except Exception as e:
            print(f"❌ Error scraping {store_name}: {e}")
            return []

    def _deduplicate_products(self, products: List[Dict]) -> List[Dict]:
        """
        Remove duplicate products based on name similarity.
        Keep the cheaper one if duplicates found.
        """
        seen = {}
        unique = []

        for product in products:
            # Create normalized key (lowercase, no special chars)
            key = product.get("name", "").lower().replace(" ", "").replace("-", "")

            if key not in seen:
                seen[key] = product
                unique.append(product)
            else:
                # Keep the cheaper one
                existing_price = seen[key].get("price", float("inf"))
                new_price = product.get("price", float("inf"))

                if new_price < existing_price:
                    # Replace with cheaper product
                    unique.remove(seen[key])
                    unique.append(product)
                    seen[key] = product

        return unique

    async def get_price_comparison(self, product_name: str) -> Dict:
        """
        Get price comparison for a specific product across all stores.

        Args:
            product_name: Exact or partial product name

        Returns:
            {
                'product': {...},
                'prices': [
                    {'store': 'amazon', 'price': 299, 'url': '...'},
                    {'store': 'thomann', 'price': 279, 'url': '...'}
                ],
                'cheapest': {'store': 'thomann', 'price': 279},
                'savings': 20
            }
        """
        # Search database
        products = await search_products(product_name, limit=1)

        if not products:
            return {"error": "Product not found"}

        product = products[0]
        product_id = product["id"]

        # Get all prices
        prices = await get_product_prices(product_id)

        if not prices:
            return {"error": "No prices available"}

        # Find cheapest
        sorted_prices = sorted(prices, key=lambda x: x["price"])
        cheapest = sorted_prices[0]
        most_expensive = sorted_prices[-1]

        return {
            "product": product,
            "prices": prices,
            "cheapest": cheapest,
            "most_expensive": most_expensive,
            "savings": most_expensive["price"] - cheapest["price"],
            "price_range": {"min": cheapest["price"], "max": most_expensive["price"]},
        }
