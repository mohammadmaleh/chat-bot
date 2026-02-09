from typing import List, Dict, Any, Optional
from prisma import Prisma
from prisma.models import Product, Price, Store
from contextlib import asynccontextmanager
import logging
from lib.cache import cache

logger = logging.getLogger(__name__)

# Global Prisma client
prisma = Prisma()


@asynccontextmanager
async def get_prisma():
    """Context manager for Prisma client lifecycle"""
    if not prisma.is_connected():
        await prisma.connect()
    try:
        yield prisma
    finally:
        pass  # Don't disconnect - reuse connection


async def connect_db():
    """Initialize database connection on startup"""
    if not prisma.is_connected():
        await prisma.connect()
        logger.info("✅ Database connected")


async def disconnect_db():
    """Close database connection on shutdown"""
    if prisma.is_connected():
        await prisma.disconnect()
        logger.info("👋 Database disconnected")


# ==================
# PRODUCT QUERIES WITH CACHING
# ==================


async def search_products(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search products by name, brand, category, or description.
    Uses Redis caching with 10-minute TTL.
    """
    cache_key = cache.cache_key("search", query=query, limit=limit)
    cached_result = await cache.get(cache_key)
    if cached_result:
        logger.info(f"Cache HIT: search '{query}'")
        return cached_result

    logger.info(f"Cache MISS: search '{query}' - querying database")

    try:
        products = await prisma.product.find_many(
            where={
                "OR": [
                    {"name": {"contains": query, "mode": "insensitive"}},
                    {"brand": {"contains": query, "mode": "insensitive"}},
                    {"category": {"contains": query, "mode": "insensitive"}},
                    {"description": {"contains": query, "mode": "insensitive"}},
                ]
            },
            take=limit,
            include={
                "prices": {
                    "include": {
                        "store": True,
                    },
                    "order_by": {
                        "price": "asc",
                    },
                }
            },
        )

        result: List[Dict[str, Any]] = []
        for product in products:
            product_dict: Dict[str, Any] = {
                "id": product.id,
                "name": product.name,
                "brand": product.brand,
                "category": product.category,
                "description": product.description,
                "imageUrl": product.imageUrl,
                "ean": product.ean,
                "gtin": product.gtin,
                "createdAt": (
                    product.createdAt.isoformat() if product.createdAt else None
                ),
                "updatedAt": (
                    product.updatedAt.isoformat() if product.updatedAt else None
                ),
            }

            if product.prices:
                # Full prices array for frontend ProductCard
                product_dict["prices"] = [
                    {
                        "id": p.id,
                        "price": float(p.price),
                        "currency": p.currency,
                        "availability": p.availability,
                        "url": p.url,
                        "store": {
                            "id": p.store.id if p.store else None,
                            "name": p.store.name if p.store else "Unknown",
                            "domain": p.store.domain if p.store else None,
                            "logoUrl": p.store.logoUrl if p.store else None,
                        },
                    }
                    for p in product.prices
                ]

                prices_values = [float(p.price) for p in product.prices]
                product_dict["cheapest_price"] = min(prices_values)
                product_dict["most_expensive"] = max(prices_values)
                product_dict["price_range"] = max(prices_values) - min(prices_values)
                product_dict["available_stores"] = len(product.prices)
            else:
                product_dict["prices"] = []

            result.append(product_dict)

        await cache.set(cache_key, result, ttl=600)
        return result

    except Exception as e:
        logger.error(f"Error searching products: {e}")
        return []


async def get_product_prices(product_id: str) -> List[Dict[str, Any]]:
    """
    Get all prices for a specific product across stores.
    Cached for 30 minutes.
    """
    # Check cache
    cache_key = cache.cache_key("prices", product_id=product_id)
    cached_result = await cache.get(cache_key)
    if cached_result:
        logger.debug(f"Cache HIT: prices for {product_id}")
        return cached_result

    try:
        prices = await prisma.price.find_many(
            where={"productId": product_id},
            include={"store": True},
            order_by={"price": "asc"},
        )

        result = [
            {
                "price": float(p.price),
                "currency": p.currency,
                "availability": p.availability,
                "url": p.url,
                "scraped_at": p.scrapedAt.isoformat() if p.scrapedAt else None,
                "store_name": p.store.name if p.store else "Unknown",
                "store_domain": p.store.domain if p.store else None,
                "store_logo": p.store.logoUrl if p.store else None,
            }
            for p in prices
        ]

        # Cache for 30 minutes
        await cache.set(cache_key, result, ttl=1800)

        return result

    except Exception as e:
        logger.error(f"Error fetching prices for product {product_id}: {e}")
        return []


async def get_cheapest_products(
    category: Optional[str] = None, limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get products with their cheapest available prices.
    Cached for 1 hour.
    """
    # Check cache
    cache_key = cache.cache_key("cheapest", category=category or "all", limit=limit)
    cached_result = await cache.get(cache_key)
    if cached_result:
        logger.debug(f"Cache HIT: cheapest products")
        return cached_result

    try:
        where_clause = {"prices": {"some": {"availability": True}}}

        if category:
            where_clause["category"] = {"contains": category, "mode": "insensitive"}

        products = await prisma.product.find_many(
            where=where_clause,
            take=limit,
            include={
                "prices": {
                    "where": {"availability": True},
                    "take": 1,
                    "order_by": {"price": "asc"},
                    "include": {"store": True},
                }
            },
        )

        # Transform and add computed fields
        result = []
        for product in products:
            if product.prices:
                cheapest = product.prices[0]
                result.append(
                    {
                        "id": product.id,
                        "name": product.name,
                        "brand": product.brand,
                        "category": product.category,
                        "image_url": product.imageUrl,
                        "price": float(cheapest.price),
                        "currency": cheapest.currency,
                        "store_name": (
                            cheapest.store.name if cheapest.store else "Unknown"
                        ),
                        "store_domain": (
                            cheapest.store.domain if cheapest.store else None
                        ),
                        "url": cheapest.url,
                    }
                )

        # Cache for 1 hour
        await cache.set(cache_key, result, ttl=3600)

        return result

    except Exception as e:
        logger.error(f"Error fetching cheapest products: {e}")
        return []


# ==================
# CONVERSATION QUERIES
# ==================


async def create_conversation(
    user_id: str, title: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new conversation for a user"""
    try:
        conversation = await prisma.conversation.create(
            data={
                "userId": user_id,
                "title": title or "New Conversation",
                "status": "ACTIVE",
            }
        )

        # Invalidate user's conversation list cache
        await cache.delete_pattern(f"conversations:user:{user_id}:*")

        return {
            "id": conversation.id,
            "userId": conversation.userId,
            "title": conversation.title,
            "status": conversation.status,
            "createdAt": (
                conversation.createdAt.isoformat() if conversation.createdAt else None
            ),
            "updatedAt": (
                conversation.updatedAt.isoformat() if conversation.updatedAt else None
            ),
        }
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise


async def save_message(
    conversation_id: str, role: str, content: str, metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """Save a message to a conversation"""
    try:
        message = await prisma.message.create(
            data={
                "conversationId": conversation_id,
                "role": role.upper(),
                "content": content,
                "metadata": metadata,
            }
        )

        # Invalidate conversation cache
        await cache.delete(f"conversation:{conversation_id}:messages")

        return {
            "id": message.id,
            "conversationId": message.conversationId,
            "role": message.role,
            "content": message.content,
            "metadata": message.metadata,
            "createdAt": message.createdAt.isoformat() if message.createdAt else None,
        }
    except Exception as e:
        logger.error(f"Error saving message: {e}")
        raise


async def get_conversation_history(
    conversation_id: str, limit: int = 50
) -> List[Dict[str, Any]]:
    """Get message history for a conversation (cached)"""
    # Check cache
    cache_key = f"conversation:{conversation_id}:messages"
    cached_result = await cache.get(cache_key)
    if cached_result:
        return cached_result

    try:
        messages = await prisma.message.find_many(
            where={"conversationId": conversation_id},
            order_by={"createdAt": "asc"},
            take=limit,
        )

        result = [
            {
                "role": m.role.lower(),
                "content": m.content,
                "metadata": m.metadata,
                "created_at": m.createdAt.isoformat() if m.createdAt else None,
            }
            for m in messages
        ]

        # Cache for 5 minutes
        await cache.set(cache_key, result, ttl=300)

        return result
    except Exception as e:
        logger.error(f"Error fetching conversation history: {e}")
        return []
