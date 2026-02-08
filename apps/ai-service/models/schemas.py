from pydantic import BaseModel
from typing import List, Optional, Literal

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    products: Optional[List[dict]] = None
    intent: Optional[str] = None

class ProductSearchRequest(BaseModel):
    query: str
    limit: int = 5

class ProductSearchResponse(BaseModel):
    success: bool
    products: List[dict]
    count: int
