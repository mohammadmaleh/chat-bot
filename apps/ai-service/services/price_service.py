"""
Price service - Integrates scrapers with Prisma database.
Handles product creation, price updates, and store management.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from prisma import Prisma
from decimal import Decimal

# Absolute imports instead of relative
from scrapers.base_scraper import ScrapedProduct
from services.cache_service import CacheService

class PriceService:
    """Service for managing products, prices, and stores in the database."""
    
    def __init__(self):
        """Initialize Prisma client and cache service."""
        self.db = Prisma()
        self.cache = CacheService()
    
    async def connect(self):
        """Connect to database."""
        await self.db.connect()
    
    async def disconnect(self):
        """Disconnect from database and close cache."""
        await self.db.disconnect()
        await self.cache.close()
    
    async def __aenter__(self):
        """Context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        await self.disconnect()
    
    async def ensure_store(self, store_name: str, store_domain: str) -> str:
        """
        Get or create store in database.
        
        Args:
            store_name: Store name (e.g., 'Amazon')
            store_domain: Store domain (e.g., 'amazon.de')
        
        Returns:
            str: Store ID
        """
        # Check cache first
        cache_key = f"store:{store_domain}"
        cached = await self.cache.redis.get(cache_key)
        if cached:
            return cached
        
        # Check database
        store = await self.db.store.find_first(
            where={'domain': store_domain}
        )
        
        if not store:
            # Create new store
            store = await self.db.store.create(
                data={
                    'name': store_name,
                    'domain': store_domain,
                    'country': 'DE',
                    'active': True
                }
            )
        
        # Cache store ID
        await self.cache.redis.setex(cache_key, 86400, store.id)  # Cache 24h
        
        return store.id
    
    async def save_scraped_product(
        self, 
        scraped: ScrapedProduct, 
        store_name: str, 
        store_domain: str
    ) -> Dict[str, str]:
        """
        Save scraped product and price to database.
        
        Args:
            scraped: ScrapedProduct object from scraper
            store_name: Store name
            store_domain: Store domain
        
        Returns:
            Dict with product_id and price_id
        """
        # Ensure store exists
        store_id = await self.ensure_store(store_name, store_domain)
        
        # Find or create product
        product = None
        
        # Try to find by EAN first
        if scraped.ean:
            product = await self.db.product.find_first(
                where={'ean': scraped.ean}
            )
        
        # If not found, try by name (fuzzy match)
        if not product:
            product = await self.db.product.find_first(
                where={'name': {'contains': scraped.name[:50]}}  # Partial match
            )
        
        # Create new product if not found
        if not product:
            product = await self.db.product.create(
                data={
                    'name': scraped.name,
                    'brand': scraped.brand,
                    'description': scraped.description,
                    'imageUrl': scraped.image_url,
                    'ean': scraped.ean
                }
            )
        
        # Create price entry
        price = await self.db.price.create(
            data={
                'productId': product.id,
                'storeId': store_id,
                'price': Decimal(str(scraped.price)),
                'currency': scraped.currency,
                'availability': scraped.availability,
                'url': scraped.url
            }
        )
        
        # Update cache
        product_data = {
            'id': product.id,
            'name': product.name,
            'brand': product.brand,
            'imageUrl': product.imageUrl,
            'price': float(scraped.price),
            'store': store_name,
            'url': scraped.url
        }
        await self.cache.set_product(scraped.url, product_data)
        
        return {
            'product_id': product.id,
            'price_id': price.id
        }
    
    async def get_product_prices(self, product_id: str) -> List[Dict[str, Any]]:
        """
        Get all current prices for a product across stores.
        
        Args:
            product_id: Product ID
        
        Returns:
            List of price dicts with store info
        """
        prices = await self.db.price.find_many(
            where={'productId': product_id},
            include={'store': True},
            order_by={'scrapedAt': 'desc'}
        )
        
        # Group by store, keeping only latest price per store
        store_prices = {}
        for price in prices:
            store_id = price.storeId
            if store_id not in store_prices:
                store_prices[store_id] = {
                    'store_name': price.store.name,
                    'store_domain': price.store.domain,
                    'price': float(price.price),
                    'currency': price.currency,
                    'availability': price.availability,
                    'url': price.url,
                    'scraped_at': price.scrapedAt.isoformat()
                }
        
        return list(store_prices.values())
    
    async def search_products(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Search products in database.
        
        Args:
            query: Search query
            limit: Max results
        
        Returns:
            List of product dicts
        """
        products = await self.db.product.find_many(
            where={
                'OR': [
                    {'name': {'contains': query, 'mode': 'insensitive'}},
                    {'brand': {'contains': query, 'mode': 'insensitive'}},
                    {'description': {'contains': query, 'mode': 'insensitive'}}
                ]
            },
            include={'prices': {'include': {'store': True}}},
            take=limit
        )
        
        result = []
        for product in products:
            # Get latest price per store
            latest_prices = {}
            for price in product.prices:
                store_id = price.storeId
                if store_id not in latest_prices or price.scrapedAt > latest_prices[store_id]['scraped_at']:
                    latest_prices[store_id] = {
                        'store': price.store.name,
                        'price': float(price.price),
                        'currency': price.currency,
                        'url': price.url,
                        'scraped_at': price.scrapedAt
                    }
            
            result.append({
                'id': product.id,
                'name': product.name,
                'brand': product.brand,
                'imageUrl': product.imageUrl,
                'prices': list(latest_prices.values())
            })
        
        return result
    
    async def update_prices_for_product(self, product_id: str, store_scrapers: dict):
        """
        Update prices for a product from all stores.
        
        Args:
            product_id: Product ID
            store_scrapers: Dict of {store_name: scraper_instance}
        """
        # Get product
        product = await self.db.product.find_un
        ique(where={'id': product_id})
        if not product:
            return
        
        # Get existing prices to find URLs
        prices = await self.db.price.find_many(
            where={'productId': product_id},
            include={'store': True}
        )
        
        # Update each store
        for price in prices:
            store_name = price.store.name.lower()
            if store_name in store_scrapers:
                scraper = store_scrapers[store_name]
                try:
                    updated = await scraper.get_product(price.url)
                    if updated:
                        await self.save_scraped_product(
                            updated,
                            price.store.name,
                            price.store.domain
                        )
                except Exception as e:
                    print(f"Error updating {store_name} price: {e}")
