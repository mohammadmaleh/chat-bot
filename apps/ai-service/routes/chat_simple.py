"""
Simplified Chat Routes for Quick Testing
Uses groq directly without Prisma dependencies
"""

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])

# Simple in-memory conversation history for testing
conversations = {}


class ChatMessage:
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content
        self.dict = lambda: {"role": self.role, "content": self.content}


class SimpleChatRequest:
    def __init__(self, message: str, conversation_history: Optional[List] = None):
        self.message = message
        self.conversation_history = conversation_history or []


@router.post("/", status_code=status.HTTP_200_OK)
async def simple_chat(request: Request):
    """
    Simplified chat endpoint for immediate testing
    This version doesn't use Prisma and works standalone
    """
    try:
        body = await request.json()
        message = body.get("message", "")

        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty",
            )

        # Try to use Groq if available
        try:
            from lib.ai_client import chat_with_context

            # Prepare message history
            history = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in body.get("conversation_history", [])
            ]

            # Get AI response
            ai_response = chat_with_context(message, history)

            return {
                "success": True,
                "response": ai_response,
                "products": [],
                "intent": "general",
            }
        except ImportError:
            logger.warning("Groq AI client not available, using fallback response")
            # Fallback: simple echo response
            return {
                "success": True,
                "response": f"I received your message: '{message}'. (Running in simplified mode - Chat AI not fully initialized)",
                "products": [],
                "intent": "general",
            }
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {str(e)}",
        )


@router.post("/stream", status_code=status.HTTP_200_OK)
async def simple_chat_stream(request: Request):
    """
    Simplified streaming chat endpoint
    """
    # Read body once before creating generator
    try:
        body = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse request body: {e}")

        async def error_generate():
            yield f"data: {json.dumps({'type': 'error', 'message': 'Invalid request'})}\n\n"

        return StreamingResponse(error_generate(), media_type="text/event-stream")

    message = body.get("message", "Hello")
    history = [
        {"role": msg["role"], "content": msg["content"]}
        for msg in body.get("conversation_history", [])
    ]

    async def generate():
        try:
            # Try to use streaming if available
            try:
                from lib.ai_client import chat_with_streaming

                for chunk in chat_with_streaming(message, history):
                    yield f"data: {json.dumps({'type': 'message', 'content': chunk})}\n\n"

                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.warning(f"Streaming error: {e}")
                # Fallback non-streaming response
                response = f"Received: {message}"
                yield f"data: {json.dumps({'type': 'message', 'content': response})}\n\n"
                yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify chat service is working"""
    return {
        "status": "ok",
        "message": "Chat service is responding",
        "endpoints": {
            "post_chat": "/api/chat/",
            "post_stream": "/api/chat/stream",
            "test": "/api/chat/test",
        },
    }
