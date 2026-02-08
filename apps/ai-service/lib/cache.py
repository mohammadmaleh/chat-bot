"""Redis caching layer for performance optimization."""
import redis.asyncio as redis
import json
from typing import Optional, Any
import hashlib
import logging
import os

logger = logging.getLogger(__name__)

class CacheManager:
    """Manages Redis caching operations."""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.enabled = os.getenv('ENABLE_REDIS_CACHE', 'true').lower() == 'true'
    
    async def connect(self):
        """Connect to Redis."""
        if not self.enabled:
            logger.info("⚠️ Redis caching disabled")
            return
        
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://redis:6379/0')
            self.redis_client = await redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            await self.redis_client.ping()
            logger.info("✅ Redis cache connected")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}. Continuing without cache.")
            self.redis_client = None
    
    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("👋 Redis cache disconnected")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if not self.redis_client:
            return None
        
        try:
            data = await self.redis_client.get(key)
            if data:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(data)
            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in cache with TTL."""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.setex(key, ttl, json.dumps(value))
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    async def delete(self, key: str):
        """Delete value from cache."""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
    
    async def delete_pattern(self, pattern: str):
        """Delete all keys matching pattern."""
        if not self.redis_client:
            return
        
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                await self.redis_client.delete(*keys)
                logger.info(f"Cache DELETE pattern: {pattern} ({len(keys)} keys)")
        except Exception as e:
            logger.error(f"Cache delete pattern error: {e}")
    
    def cache_key(self, prefix: str, **kwargs) -> str:
        """Generate cache key from parameters."""
        key_str = f"{prefix}:" + ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return hashlib.md5(key_str.encode()).hexdigest()
    
    async def get_stats(self) -> dict:
        """Get cache statistics."""
        if not self.redis_client:
            return {"enabled": False}
        
        try:
            info = await self.redis_client.info('stats')
            return {
                "enabled": True,
                "hits": info.get('keyspace_hits', 0),
                "misses": info.get('keyspace_misses', 0),
                "hit_rate": info.get('keyspace_hits', 0) / (info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1))
            }
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"enabled": True, "error": str(e)}

# Global cache instance
cache = CacheManager()
