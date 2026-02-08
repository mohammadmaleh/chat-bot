from typing import List, Dict, Any, Optional
from prisma import Prisma
from prisma.models import Product, Price, Store
from contextlib import asynccontextmanager
import logging

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
# PRODUCT QUERIES
# ==================

async def search_products(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search products by name, brand, category, or description.
    Uses Prisma's type-safe queries with full-text search.
    """
    try:
        products = await prisma.product.find_many(
            where={
                'OR': [
                    {'name': {'contains': query, 'mode': 'insensitive'}},
                    {'brand': {'contains': query, 'mode': 'insensitive'}},
                    {'category': {'contains': query, 'mode': 'insensitive'}},
                    {'description': {'contains': query, 'mode': 'insensitive'}},
                ]
            },
            take=limit,
            include={
                'prices': {
                    'include': {
                        'store': True
                    },
                    'order_by': {
                        'price': 'asc'
                    }
                }
            }
        )
        
        # Transform to dict with JSON-serializable fields
        result = []
        for product in products:
            # FIXED: Manually construct dict to control datetime serialization
            product_dict = {
                'id': product.id,
                'name': product.name,
                'brand': product.brand,
                'category': product.category,
                'description': product.description,
                'imageUrl': product.imageUrl,
                'ean': product.ean,
                'gtin': product.gtin,
                'createdAt': product.createdAt.isoformat() if product.createdAt else None,
                'updatedAt': product.updatedAt.isoformat() if product.updatedAt else None,
            }
            
            # Add price analytics
            if product.prices:
                prices = [float(p.price) for p in product.prices]
                product_dict['cheapest_price'] = min(prices)
                product_dict['most_expensive'] = max(prices)
                product_dict['price_range'] = max(prices) - min(prices)
                product_dict['available_stores'] = len(product.prices)
            
            result.append(product_dict)
        
        return result
    
    except Exception as e:
        logger.error(f"Error searching products: {e}")
        return []

async def get_product_prices(product_id: str) -> List[Dict[str, Any]]:
    """
    Get all prices for a specific product across stores.
    Sorted by price (cheapest first).
    """
    try:
        prices = await prisma.price.find_many(
            where={'productId': product_id},
            include={'store': True},
            order_by={'price': 'asc'}
        )
        
        return [
            {
                'price': float(p.price),
                'currency': p.currency,
                'availability': p.availability,
                'url': p.url,
                'scraped_at': p.scrapedAt.isoformat() if p.scrapedAt else None,
                'store_name': p.store.name if p.store else 'Unknown',
                'store_domain': p.store.domain if p.store else None,
                'store_logo': p.store.logoUrl if p.store else None
            }
            for p in prices
        ]
    
    except Exception as e:
        logger.error(f"Error fetching prices for product {product_id}: {e}")
        return []

async def get_cheapest_products(
    category: Optional[str] = None, 
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get products with their cheapest available prices.
    Optionally filter by category.
    """
    try:
        where_clause = {'prices': {'some': {'availability': True}}}
        
        if category:
            where_clause['category'] = {'contains': category, 'mode': 'insensitive'}
        
        products = await prisma.product.find_many(
            where=where_clause,
            take=limit,
            include={
                'prices': {
                    'where': {'availability': True},
                    'take': 1,
                    'order_by': {'price': 'asc'},
                    'include': {'store': True}
                }
            }
        )
        
        # Transform and add computed fields
        result = []
        for product in products:
            if product.prices:
                cheapest = product.prices[0]
                result.append({
                    'id': product.id,
                    'name': product.name,
                    'brand': product.brand,
                    'category': product.category,
                    'image_url': product.imageUrl,
                    'price': float(cheapest.price),
                    'currency': cheapest.currency,
                    'store_name': cheapest.store.name if cheapest.store else 'Unknown',
                    'store_domain': cheapest.store.domain if cheapest.store else None,
                    'url': cheapest.url
                })
        
        return result
    
    except Exception as e:
        logger.error(f"Error fetching cheapest products: {e}")
        return []

# ==================
# CONVERSATION QUERIES
# ==================

async def create_conversation(user_id: str, title: Optional[str] = None) -> Dict[str, Any]:
    """Create a new conversation for a user"""
    try:
        conversation = await prisma.conversation.create(
            data={
                'userId': user_id,
                'title': title or 'New Conversation',
                'status': 'ACTIVE'
            }
        )
        return {
            'id': conversation.id,
            'userId': conversation.userId,
            'title': conversation.title,
            'status': conversation.status,
            'createdAt': conversation.createdAt.isoformat() if conversation.createdAt else None,
            'updatedAt': conversation.updatedAt.isoformat() if conversation.updatedAt else None,
        }
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        raise

async def save_message(
    conversation_id: str,
    role: str,
    content: str,
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """Save a message to a conversation"""
    try:
        message = await prisma.message.create(
            data={
                'conversationId': conversation_id,
                'role': role.upper(),
                'content': content,
                'metadata': metadata
            }
        )
        return {
            'id': message.id,
            'conversationId': message.conversationId,
            'role': message.role,
            'content': message.content,
            'metadata': message.metadata,
            'createdAt': message.createdAt.isoformat() if message.createdAt else None,
        }
    except Exception as e:
        logger.error(f"Error saving message: {e}")
        raise

async def get_conversation_history(
    conversation_id: str,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Get message history for a conversation"""
    try:
        messages = await prisma.message.find_many(
            where={'conversationId': conversation_id},
            order_by={'createdAt': 'asc'},
            take=limit
        )
        
        return [
            {
                'role': m.role.lower(),
                'content': m.content,
                'metadata': m.metadata,
                'created_at': m.createdAt.isoformat() if m.createdAt else None
            }
            for m in messages
        ]
    except Exception as e:
        logger.error(f"Error fetching conversation history: {e}")
        return []
