"""
Improved Chat Routes
Enhanced version with:
- Input validation using Pydantic
- Proper error handling
- Response caching
- Structured logging
- Security middleware integration
"""
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse, JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import Optional
import json
import logging
import asyncio
from datetime import datetime

# Local imports
from lib.validators import (
    ChatRequestValidator,
    ProductSearchValidator,
    validate_pagination
)
from lib.database_optimized import (
    search_products_optimized,
    get_product_with_prices,
    get_cheapest_products
)
from lib.ai_client import chat_with_context, chat_with_streaming, extract_search_intent
from lib.cache import cache
from lib.monitoring import capture_exception

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v2/chat", tags=["chat-v2"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/", status_code=status.HTTP_200_OK)
@limiter.limit("20/minute")
async def chat_endpoint(request: Request, chat_data: ChatRequestValidator):
    """
    Enhanced chat endpoint with validation and error handling.
    
    Features:
    - Input validation
    - Product search integration
    - Response caching
    - Structured error handling
    """
    start_time = datetime.utcnow()
    
    try:
        # Generate cache key
        cache_key = f"chat:{chat_data.message}:{len(chat_data.conversation_history or [])}"
        
        # Check cache first
        cached_response = await cache.get(cache_key)
        if cached_response:
            logger.info(f"Cache hit for chat request")
            return JSONResponse(
                content=json.loads(cached_response),
                headers={"X-Cache": "HIT"}
            )
        
        # Extract search intent
        try:
            intent_data = extract_search_intent(chat_data.message)
        except Exception as e:
            logger.error(f"Intent extraction error: {e}")
            intent_data = {"intent": "general"}
        
        product_context = None
        products = []
        
        # Search products if needed
        if intent_data.get("intent") in ["search", "gift", "compare"]:
            search_query = intent_data.get("search_query", "")
            
            if search_query:
                try:
                    # Use optimized search
                    products = await search_products_optimized(
                        query=search_query,
                        limit=5
                    )
                    
                    # Build context for AI
                    if products:
                        product_context = "Available products:\n"
                        for p in products:
                            if p.get('prices'):
                                cheapest = min(p['prices'], key=lambda x: x['price'])
                                product_context += (
                                    f"- {p['name']} by {p.get('brand', 'Unknown')}: "
                                    f"Best price €{cheapest['price']} at {cheapest['store_name']}\n"
                                )
                
                except Exception as e:
                    logger.error(f"Product search error: {e}", exc_info=True)
                    capture_exception(e, context={
                        "query": search_query,
                        "intent": intent_data.get("intent")
                    })
        
        # Build conversation history
        conversation_history = []
        if chat_data.conversation_history:
            conversation_history = [
                {"role": msg.role, "content": msg.content}
                for msg in chat_data.conversation_history
            ]
        
        # Get AI response with timeout
        try:
            ai_response = await asyncio.wait_for(
                asyncio.to_thread(
                    chat_with_context,
                    chat_data.message,
                    conversation_history,
                    product_context
                ),
                timeout=30.0  # 30 second timeout
            )
        except asyncio.TimeoutError:
            logger.error("AI request timeout")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service timeout. Please try again."
            )
        except Exception as e:
            logger.error(f"AI service error: {e}", exc_info=True)
            capture_exception(e)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service temporarily unavailable"
            )
        
        # Build response
        response_data = {
            "success": True,
            "response": ai_response,
            "products": products if products else None,
            "intent": intent_data.get("intent"),
            "timestamp": datetime.utcnow().isoformat(),
            "processing_time_ms": int((datetime.utcnow() - start_time).total_seconds() * 1000)
        }
        
        # Cache response for 5 minutes
        await cache.set(cache_key, json.dumps(response_data), ttl=300)
        
        return JSONResponse(
            content=response_data,
            headers={"X-Cache": "MISS"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}", exc_info=True)
        capture_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )


@router.post("/stream", status_code=status.HTTP_200_OK)
@limiter.limit("15/minute")
async def chat_stream_endpoint(request: Request, chat_data: ChatRequestValidator):
    """
    Enhanced streaming chat endpoint.
    
    Features:
    - Server-Sent Events (SSE)
    - Real-time product search
    - Graceful error handling
    - Connection management
    """
    
    async def generate():
        try:
            # Extract intent
            try:
                intent_data = extract_search_intent(chat_data.message)
            except Exception as e:
                logger.error(f"Intent extraction error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'message': 'Failed to process request'})}\n\n"
                return
            
            # Search products if needed
            if intent_data.get("intent") in ["search", "gift", "compare"]:
                search_query = intent_data.get("search_query", "")
                
                if search_query:
                    try:
                        products = await search_products_optimized(
                            query=search_query,
                            limit=5
                        )
                        
                        if products:
                            # Send products first
                            yield f"data: {json.dumps({'type': 'products', 'data': products})}\n\n"
                            
                            # Build context
                            product_context = "Available products:\n"
                            for p in products:
                                if p.get('prices'):
                                    cheapest = min(p['prices'], key=lambda x: x['price'])
                                    product_context += (
                                        f"- {p['name']}: €{cheapest['price']} at {cheapest['store_name']}\n"
                                    )
                        else:
                            product_context = None
                    
                    except Exception as e:
                        logger.error(f"Product search error in stream: {e}")
                        product_context = None
                else:
                    product_context = None
            else:
                product_context = None
            
            # Build conversation history
            conversation_history = []
            if chat_data.conversation_history:
                conversation_history = [
                    {"role": msg.role, "content": msg.content}
                    for msg in chat_data.conversation_history
                ]
            
            # Stream AI response
            try:
                for chunk in chat_with_streaming(
                    chat_data.message,
                    conversation_history,
                    product_context
                ):
                    yield f"data: {json.dumps({'type': 'message', 'content': chunk})}\n\n"
                    await asyncio.sleep(0)  # Allow other tasks to run
            
            except Exception as e:
                logger.error(f"AI streaming error: {e}", exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'message': 'AI service error'})}\n\n"
                return
            
            # Send completion signal
            yield "data: [DONE]\n\n"
        
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            capture_exception(e)
            yield f"data: {json.dumps({'type': 'error', 'message': 'Unexpected error'})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post("/search", status_code=status.HTTP_200_OK)
@limiter.limit("30/minute")
async def search_endpoint(request: Request, search_data: ProductSearchValidator):
    """
    Enhanced product search endpoint.
    
    Features:
    - Input validation
    - Price filtering
    - Category filtering
    - Response caching
    """
    try:
        # Generate cache key
        cache_key = f"search:{search_data.query}:{search_data.limit}:{search_data.category}:{search_data.min_price}:{search_data.max_price}"
        
        # Check cache
        cached_result = await cache.get(cache_key)
        if cached_result:
            return JSONResponse(
                content=json.loads(cached_result),
                headers={"X-Cache": "HIT"}
            )
        
        # Search products
        products = await search_products_optimized(
            query=search_data.query,
            limit=search_data.limit,
            category=search_data.category,
            min_price=search_data.min_price,
            max_price=search_data.max_price
        )
        
        response_data = {
            "success": True,
            "products": products,
            "count": len(products),
            "query": search_data.query,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Cache for 10 minutes
        await cache.set(cache_key, json.dumps(response_data), ttl=600)
        
        return JSONResponse(
            content=response_data,
            headers={"X-Cache": "MISS"}
        )
    
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        capture_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )


@router.get("/product/{product_id}", status_code=status.HTTP_200_OK)
@limiter.limit("60/minute")
async def get_product_endpoint(request: Request, product_id: str):
    """
    Get detailed product information.
    
    Args:
        product_id: Product identifier
    
    Returns:
        Product with prices from all stores
    """
    try:
        # Validate product_id format
        if not product_id or len(product_id) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product_id"
            )
        
        # Check cache
        cache_key = f"product:{product_id}"
        cached_result = await cache.get(cache_key)
        if cached_result:
            return JSONResponse(
                content=json.loads(cached_result),
                headers={"X-Cache": "HIT"}
            )
        
        # Get product
        product = await get_product_with_prices(product_id)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        response_data = {
            "success": True,
            "product": product,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Cache for 30 minutes
        await cache.set(cache_key, json.dumps(response_data), ttl=1800)
        
        return JSONResponse(
            content=response_data,
            headers={"X-Cache": "MISS"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}", exc_info=True)
        capture_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch product"
        )


@router.get("/cheapest", status_code=status.HTTP_200_OK)
@limiter.limit("30/minute")
async def cheapest_endpoint(
    request: Request,
    category: Optional[str] = None,
    limit: int = 10
):
    """
    Get cheapest products across all stores.
    
    Args:
        category: Optional category filter
        limit: Maximum number of results (1-50)
    
    Returns:
        List of cheapest products
    """
    try:
        # Validate pagination
        _, limit = validate_pagination(1, limit)
        
        # Check cache
        cache_key = f"cheapest:{category}:{limit}"
        cached_result = await cache.get(cache_key)
        if cached_result:
            return JSONResponse(
                content=json.loads(cached_result),
                headers={"X-Cache": "HIT"}
            )
        
        # Get cheapest products
        products = await get_cheapest_products(category=category, limit=limit)
        
        response_data = {
            "success": True,
            "products": products,
            "count": len(products),
            "category": category,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Cache for 1 hour
        await cache.set(cache_key, json.dumps(response_data), ttl=3600)
        
        return JSONResponse(
            content=response_data,
            headers={"X-Cache": "MISS"}
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error fetching cheapest products: {e}", exc_info=True)
        capture_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch cheapest products"
        )
