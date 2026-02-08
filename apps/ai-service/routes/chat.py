from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest, ChatResponse, ProductSearchRequest, ProductSearchResponse
from lib.ai_client import chat_with_context, chat_with_streaming, extract_search_intent
from lib.database import search_products, get_product_prices, get_cheapest_products
import json

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Main chat endpoint with product search integration"""
    try:
        # Extract user intent using AI
        intent_data = extract_search_intent(request.message)
        
        product_context = None
        products = []
        
        # If user wants to search/compare products
        if intent_data.get("intent") in ["search", "gift", "compare"]:
            search_query = intent_data.get("search_query", "")
            if search_query:
                # FIXED: Added await
                products = await search_products(search_query, limit=5)
                
                # Get prices for each product
                for product in products:
                    # FIXED: Added await
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
            for msg in request.conversation_history
        ] if request.conversation_history else []
        
        # Get AI response
        ai_response = chat_with_context(
            request.message,
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
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint for real-time responses"""
    async def generate():
        try:
            # Extract intent
            intent_data = extract_search_intent(request.message)
            product_context = None
            
            # Search products if needed
            if intent_data.get("intent") in ["search", "gift", "compare"]:
                search_query = intent_data.get("search_query", "")
                if search_query:
                    # FIXED: Added await
                    products = await search_products(search_query, limit=5)
                    
                    # Get prices
                    for product in products:
                        # FIXED: Added await
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
                for msg in request.conversation_history
            ] if request.conversation_history else []
            
            # Stream AI response
            for chunk in chat_with_streaming(request.message, conversation_history, product_context):
                yield f"data: {json.dumps({'type': 'message', 'content': chunk})}\n\n"
            
            yield "data: [DONE]\n\n"
        
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/search", response_model=ProductSearchResponse)
async def search_products_endpoint(request: ProductSearchRequest):
    """Direct product search endpoint"""
    try:
        # FIXED: Added await
        products = await search_products(request.query, request.limit)
        
        # Get prices for each product
        for product in products:
            # FIXED: Added await
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
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cheapest")
async def get_cheapest_endpoint(category: str = None, limit: int = 10):
    """Get cheapest products, optionally filtered by category"""
    try:
        # FIXED: Added await
        products = await get_cheapest_products(category=category, limit=limit)
        
        return {
            "success": True,
            "products": products,
            "count": len(products)
        }
    except Exception as e:
        print(f"Cheapest products error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
