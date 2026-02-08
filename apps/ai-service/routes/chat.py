from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from models.schemas import ChatRequest, ChatResponse, ProductSearchRequest, ProductSearchResponse
from lib.ai_client import chat_with_context, chat_with_streaming, extract_search_intent
from lib.database import search_products, get_product_prices, get_cheapest_products
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, chat_request: ChatRequest):
    """Main chat endpoint with product search integration."""
    try:
        # Extract user intent using AI
        intent_data = extract_search_intent(chat_request.message)
        
        product_context = None
        products = []
        
        # If user wants to search/compare products
        if intent_data.get("intent") in ["search", "gift", "compare"]:
            search_query = intent_data.get("search_query", "")
            if search_query:
                products = await search_products(search_query, limit=5)
                
                # Get prices for each product
                for product in products:
                    prices = await get_product_prices(product['id'])
                    product['prices'] = prices
                    if prices:
                        product['cheapest_price'] = min(float(p['price']) for p in prices)
                        product['most_expensive'] = max(float(p['price']) for p in prices)
                
                if products:
                    product_context = "Available products:\n"
                    for p in products:
                        prices_text = ", ".join([
                            f"€{pr['price']} at {pr['store_name']}" 
                            for pr in p.get('prices', [])
                        ])
                        product_context += f"- {p['name']} by {p.get('brand', 'Unknown')}: {prices_text}\n"
        
        # Build conversation history
        conversation_history = [
            {"role": msg.role, "content": msg.content} 
            for msg in chat_request.conversation_history
        ] if chat_request.conversation_history else []
        
        # Get AI response
        ai_response = chat_with_context(
            chat_request.message,
            conversation_history,
            product_context
        )
        
        return ChatResponse(
            success=True,
            response=ai_response,
            products=products if products else None,
            intent=intent_data.get("intent")
        )
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
@limiter.limit("20/minute")
async def chat_stream(request: Request, chat_request: ChatRequest):
    """Streaming chat endpoint for real-time responses."""
    async def generate():
        try:
            # Extract intent
            intent_data = extract_search_intent(chat_request.message)
            product_context = None
            
            # Search products if needed
            if intent_data.get("intent") in ["search", "gift", "compare"]:
                search_query = intent_data.get("search_query", "")
                if search_query:
                    products = await search_products(search_query, limit=5)
                    
                    # Get prices
                    for product in products:
                        prices = await get_product_prices(product['id'])
                        product['prices'] = prices
                    
                    if products:
                        product_context = "Available products:\n"
                        for p in products:
                            prices_text = ", ".join([
                                f"€{pr['price']} at {pr['store_name']}" 
                                for pr in p.get('prices', [])
                            ])
                            product_context += f"- {p['name']} by {p.get('brand', 'Unknown')}: {prices_text}\n"
                        
                        # Send products first
                        yield f"data: {json.dumps({'type': 'products', 'data': products})}\n\n"
            
            # Build conversation history
            conversation_history = [
                {"role": msg.role, "content": msg.content} 
                for msg in chat_request.conversation_history
            ] if chat_request.conversation_history else []
            
            # Stream AI response
            for chunk in chat_with_streaming(chat_request.message, conversation_history, product_context):
                yield f"data: {json.dumps({'type': 'message', 'content': chunk})}\n\n"
            
            yield "data: [DONE]\n\n"
        
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/search", response_model=ProductSearchResponse)
@limiter.limit("30/minute")
async def search_products_endpoint(request: Request, search_request: ProductSearchRequest):
    """Direct product search endpoint."""
    try:
        products = await search_products(search_request.query, search_request.limit)
        
        # Get prices for each product
        for product in products:
            prices = await get_product_prices(product['id'])
            product['prices'] = prices
            if prices:
                product['cheapest_price'] = min(float(p['price']) for p in prices)
        
        return ProductSearchResponse(
            success=True,
            products=products,
            count=len(products)
        )
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cheapest")
@limiter.limit("30/minute")
async def get_cheapest_endpoint(request: Request, category: str = None, limit: int = 10):
    """Get cheapest products, optionally filtered by category."""
    try:
        products = await get_cheapest_products(category=category, limit=limit)
        
        return {
            "success": True,
            "products": products,
            "count": len(products)
        }
    except Exception as e:
        logger.error(f"Cheapest products error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
