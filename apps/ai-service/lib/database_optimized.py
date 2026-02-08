"""
Optimized Database Module
Implements efficient database queries with:
- Connection pooling
- Query optimization (avoiding N+1)
- Result caching
- Batch operations
"""
from typing import List, Optional, Dict, Any
from prisma import Prisma
from prisma.models import Product, Store, Price
import logging
import asyncio
from functools import lru_cache
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Global connection pool
_prisma_client: Optional[Prisma] = None
_connection_lock = asyncio.Lock()


async def get_db() -> Prisma:
    """Get database client with connection pooling."""
    global _prisma_client
    
    if _prisma_client is None:
        async with _connection_lock:
            if _prisma_client is None:
                _prisma_client = Prisma(
                    auto_register=True,
                    datasource={
                        'url': None  # Uses DATABASE_URL from env
                    }
                )
                await _prisma_client.connect()
                logger.info("Database connection pool initialized")
    
    return _prisma_client


async def close_db():
    """Close database connection."""
    global _prisma_client
    
    if _prisma_client:
        await _prisma_client.disconnect()
        _prisma_client = None
        logger.info("Database connection pool closed")


async def search_products_optimized(
    query: str,
    limit: int = 10,
    offset: int = 0,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Optimized product search with prices fetched in single query.
    Avoids N+1 problem by using include.
    
    Args:
        query: Search term
        limit: Maximum results
        offset: Pagination offset
        category: Optional category filter
        min_price: Minimum price filter
        max_price: Maximum price filter
    
    Returns:
        List of products with prices
    """
    db = await get_db()
    
    try:
        # Build where clause
        where_clause: Dict[str, Any] = {
            'OR': [
                {'name': {'contains': query, 'mode': 'insensitive'}},
                {'brand': {'contains': query, 'mode': 'insensitive'}},
                {'description': {'contains': query, 'mode': 'insensitive'}},
            ]
        }
        
        if category:
            where_clause['category'] = {'equals': category, 'mode': 'insensitive'}
        
        # Fetch products with prices in single query (avoids N+1)
        products = await db.product.find_many(
            where=where_clause,
            include={
                'prices': {
                    'where': {
                        'availability': True,
                        # Filter by price range if specified
                        **({
                            'price': {
                                'gte': min_price if min_price else 0,
                                'lte': max_price if max_price else 999999
                            }
                        } if min_price or max_price else {})
                    },
                    'include': {
                        'store': True
                    },
                    'order_by': {
                        'price': 'asc'  # Cheapest first
                    }
                }
            },
            take=limit,
            skip=offset,
            order_by={
                'created_at': 'desc'
            }
        )
        
        # Transform to dict format
        results = []
        for product in products:
            product_dict = {
                'id': product.id,
                'name': product.name,
                'brand': product.brand,
                'category': product.category,
                'description': product.description,
                'image_url': product.imageUrl,
                'ean': product.ean,
                'created_at': product.createdAt.isoformat() if product.createdAt else None,
                'prices': []
            }
            
            # Add prices
            for price in product.prices:
                product_dict['prices'].append({
                    'id': price.id,
                    'price': float(price.price),
                    'currency': price.currency,
                    'availability': price.availability,
                    'url': price.url,
                    'store_id': price.storeId,
                    'store_name': price.store.name if price.store else 'Unknown',
                    'store_domain': price.store.domain if price.store else None,
                    'scraped_at': price.scrapedAt.isoformat() if price.scrapedAt else None,
                })
            
            # Add price statistics
            if product_dict['prices']:
                prices_only = [p['price'] for p in product_dict['prices']]
                product_dict['cheapest_price'] = min(prices_only)
                product_dict['most_expensive'] = max(prices_only)
                product_dict['average_price'] = sum(prices_only) / len(prices_only)
                product_dict['price_count'] = len(prices_only)
            
            results.append(product_dict)
        
        logger.info(f"Found {len(results)} products for query: {query}")
        return results
    
    except Exception as e:
        logger.error(f"Database search error: {e}")
        raise


async def get_product_with_prices(product_id: str) -> Optional[Dict[str, Any]]:
    """
    Get single product with all prices in one query.
    
    Args:
        product_id: Product ID
    
    Returns:
        Product with prices or None
    """
    db = await get_db()
    
    try:
        product = await db.product.find_unique(
            where={'id': product_id},
            include={
                'prices': {
                    'include': {'store': True},
                    'order_by': {'price': 'asc'}
                }
            }
        )
        
        if not product:
            return None
        
        # Transform to dict
        result = {
            'id': product.id,
            'name': product.name,
            'brand': product.brand,
            'category': product.category,
            'description': product.description,
            'image_url': product.imageUrl,
            'ean': product.ean,
            'prices': []
        }
        
        for price in product.prices:
            result['prices'].append({
                'id': price.id,
                'price': float(price.price),
                'currency': price.currency,
                'availability': price.availability,
                'url': price.url,
                'store_name': price.store.name if price.store else 'Unknown',
                'store_domain': price.store.domain if price.store else None,
            })
        
        return result
    
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise


async def get_cheapest_products(
    category: Optional[str] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get products with cheapest prices across all stores.
    Uses efficient subquery.
    
    Args:
        category: Optional category filter
        limit: Maximum results
    
    Returns:
        List of products with cheapest price
    """
    db = await get_db()
    
    try:
        # Build where clause
        where_clause = {}
        if category:
            where_clause['category'] = {'equals': category, 'mode': 'insensitive'}
        
        # Get products with at least one price
        products = await db.product.find_many(
            where={
                **where_clause,
                'prices': {
                    'some': {
                        'availability': True
                    }
                }
            },
            include={
                'prices': {
                    'where': {'availability': True},
                    'include': {'store': True},
                    'order_by': {'price': 'asc'},
                    'take': 1  # Only cheapest price
                }
            },
            take=limit
        )
        
        # Transform and sort by cheapest price
        results = []
        for product in products:
            if product.prices:
                cheapest_price = product.prices[0]
                results.append({
                    'id': product.id,
                    'name': product.name,
                    'brand': product.brand,
                    'category': product.category,
                    'image_url': product.imageUrl,
                    'cheapest_price': float(cheapest_price.price),
                    'store_name': cheapest_price.store.name if cheapest_price.store else 'Unknown',
                    'store_domain': cheapest_price.store.domain if cheapest_price.store else None,
                    'url': cheapest_price.url,
                })
        
        # Sort by price
        results.sort(key=lambda x: x['cheapest_price'])
        
        return results
    
    except Exception as e:
        logger.error(f"Error fetching cheapest products: {e}")
        raise


async def batch_update_prices(
    price_updates: List[Dict[str, Any]]
) -> int:
    """
    Batch update prices for better performance.
    
    Args:
        price_updates: List of price update dicts with keys:
            - product_id
            - store_id
            - price
            - currency
            - availability
            - url
    
    Returns:
        Number of prices updated
    """
    db = await get_db()
    updated_count = 0
    
    try:
        # Use transaction for atomicity
        async with db.tx() as transaction:
            for update in price_updates:
                # Upsert price (update if exists, create if not)
                await transaction.price.upsert(
                    where={
                        'product_id_store_id': {
                            'productId': update['product_id'],
                            'storeId': update['store_id']
                        }
                    },
                    data={
                        'create': {
                            'productId': update['product_id'],
                            'storeId': update['store_id'],
                            'price': update['price'],
                            'currency': update.get('currency', 'EUR'),
                            'availability': update.get('availability', True),
                            'url': update.get('url'),
                            'scrapedAt': datetime.utcnow()
                        },
                        'update': {
                            'price': update['price'],
                            'availability': update.get('availability', True),
                            'url': update.get('url'),
                            'scrapedAt': datetime.utcnow()
                        }
                    }
                )
                updated_count += 1
        
        logger.info(f"Batch updated {updated_count} prices")
        return updated_count
    
    except Exception as e:
        logger.error(f"Batch update error: {e}")
        raise


async def cleanup_old_prices(days: int = 30) -> int:
    """
    Remove old price records to keep database lean.
    
    Args:
        days: Remove prices older than this many days
    
    Returns:
        Number of prices deleted
    """
    db = await get_db()
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.price.delete_many(
            where={
                'scrapedAt': {
                    'lt': cutoff_date
                }
            }
        )
        
        deleted_count = result if isinstance(result, int) else 0
        logger.info(f"Cleaned up {deleted_count} old prices (older than {days} days)")
        return deleted_count
    
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise


async def get_database_stats() -> Dict[str, Any]:
    """
    Get database statistics for monitoring.
    
    Returns:
        Statistics dict
    """
    db = await get_db()
    
    try:
        product_count = await db.product.count()
        store_count = await db.store.count()
        price_count = await db.price.count()
        
        # Get recent price updates
        recent_prices = await db.price.count(
            where={
                'scrapedAt': {
                    'gte': datetime.utcnow() - timedelta(hours=24)
                }
            }
        )
        
        return {
            'products': product_count,
            'stores': store_count,
            'prices': price_count,
            'prices_last_24h': recent_prices,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {'error': str(e)}
