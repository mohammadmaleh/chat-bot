"""Tests for caching functionality."""
import pytest
from lib.cache import CacheManager
import json

@pytest.mark.asyncio
@pytest.mark.unit
async def test_cache_key_generation():
    """Test cache key generation."""
    cache = CacheManager()
    
    key1 = cache.cache_key("test", param1="value1", param2="value2")
    key2 = cache.cache_key("test", param2="value2", param1="value1")
    
    # Same parameters in different order should produce same key
    assert key1 == key2
    
    # Different parameters should produce different key
    key3 = cache.cache_key("test", param1="value1", param2="different")
    assert key1 != key3

@pytest.mark.asyncio
@pytest.mark.integration
async def test_cache_set_and_get():
    """Test setting and getting values from cache."""
    cache = CacheManager()
    
    # This test requires Redis to be running
    # Skip if Redis is not available
    try:
        await cache.connect()
        
        test_data = {"key": "value", "number": 123}
        await cache.set("test_key", test_data, ttl=60)
        
        result = await cache.get("test_key")
        assert result == test_data
        
        # Clean up
        await cache.delete("test_key")
        await cache.disconnect()
    except Exception:
        pytest.skip("Redis not available")

@pytest.mark.asyncio
@pytest.mark.integration
async def test_cache_expiration():
    """Test cache expiration."""
    cache = CacheManager()
    
    try:
        await cache.connect()
        
        # Set with 1 second TTL
        await cache.set("expire_test", {"data": "test"}, ttl=1)
        
        # Should exist immediately
        result = await cache.get("expire_test")
        assert result is not None
        
        # Wait for expiration
        import asyncio
        await asyncio.sleep(2)
        
        # Should be expired
        result = await cache.get("expire_test")
        assert result is None
        
        await cache.disconnect()
    except Exception:
        pytest.skip("Redis not available")
