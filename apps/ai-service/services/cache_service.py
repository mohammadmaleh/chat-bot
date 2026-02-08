"""
Redis cache service for price data.
Implements TTL-based caching to reduce scraping load.
"""
import json
import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import redis.asyncio as redis


class CacheService:
    """Redis-based cache for scraped product data."""
    
    def __init__(self):
        """Initialize Redis connection."""
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl_hours = int(os.getenv('CACHE_TTL_HOURS', 1))
        self.ttl_seconds = self.ttl_hours * 3600
    
    async def close(self):
        """Close Redis connection."""
        await self.redis.close()
    
    def _make_key(self, key_type: str, identifier: str) -> str:
        """
        Generate cache key.
        
        Args:
            key_type: Type of cache entry (product, search, price)
            identifier: Unique identifier (URL, query hash, etc.)
        
        Returns:
            str: Redis key
        """
        return f"chatbot:{key_type}:{identifier}"
    
    async def get_product(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Get cached product data by URL.
        
        Args:
            url: Product URL
        
        Returns:
            Product data dict or None
        """
        key = self._make_key('product', url)
        data = await self.redis.get(key)
        
        if data:
            return json.loads(data)
        return None
    
    async def set_product(self, url: str, product_data: Dict[str, Any]):
        """
        Cache product data.
        
        Args:
            url: Product URL
            product_data: Product information dict
        """
        key = self._make_key('product', url)
        await self.redis.setex(
            key,
            self.ttl_seconds,
            json.dumps(product_data, default=str)
        )
    
    async def get_search_results(self, query: str, store: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get cached search results.
        
        Args:
            query: Search query
            store: Store name (amazon, thomann, etc.)
        
        Returns:
            List of product dicts or None
        """
        search_key = f"{store}:{query.lower()}"
        key = self._make_key('search', search_key)
        data = await self.redis.get(key)
        
        if data:
            return json.loads(data)
        return None
    
    async def set_search_results(self, query: str, store: str, results: List[Dict[str, Any]]):
        """
        Cache search results.
        
        Args:
            query: Search query
            store: Store name
            results: List of product dicts
        """
        search_key = f"{store}:{query.lower()}"
        key = self._make_key('search', search_key)
        await self.redis.setex(
            key,
            self.ttl_seconds,
            json.dumps(results, default=str)
        )
    
    async def get_price(self, product_id: str, store_id: str) -> Optional[float]:
        """
        Get cached price for product at store.
        
        Args:
            product_id: Product ID
            store_id: Store ID
        
        Returns:
            Price as float or None
        """
        price_key = f"{product_id}:{store_id}"
        key = self._make_key('price', price_key)
        price_str = await self.redis.get(key)
        
        if price_str:
            return float(price_str)
        return None
    
    async def set_price(self, product_id: str, store_id: str, price: float):
        """
        Cache price.
        
        Args:
            product_id: Product ID
            store_id: Store ID
            price: Price value
        """
        price_key = f"{product_id}:{store_id}"
        key = self._make_key('price', price_key)
        await self.redis.setex(key, self.ttl_seconds, str(price))
    
    async def invalidate_product(self, url: str):
        """
        Remove product from cache.
        
        Args:
            url: Product URL
        """
        key = self._make_key('product', url)
        await self.redis.delete(key)
    
    async def clear_all(self):
        """Clear all chatbot cache entries (USE WITH CAUTION)."""
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match='chatbot:*', count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break
    
    async def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dict with cache info
        """
        info = await self.redis.info('stats')
        
        # Count keys by type
        product_keys = len(await self.redis.keys('chatbot:product:*'))
        search_keys = len(await self.redis.keys('chatbot:search:*'))
        price_keys = len(await self.redis.keys('chatbot:price:*'))
        
        return {
            'total_keys': product_keys + search_keys + price_keys,
            'product_keys': product_keys,
            'search_keys': search_keys,
            'price_keys': price_keys,
            'ttl_hours': self.ttl_hours,
            'redis_version': info.get('redis_version'),
            'uptime_seconds': info.get('uptime_in_seconds')
        }
