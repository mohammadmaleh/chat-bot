"""
Input Validation Module
Provides robust validation for all user inputs using Pydantic.
"""
from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List
import re
from enum import Enum


class MessageRole(str, Enum):
    """Allowed message roles in conversation."""
    user = "user"
    assistant = "assistant"
    system = "system"


class SearchIntent(str, Enum):
    """Recognized user intents."""
    search = "search"
    compare = "compare"
    gift = "gift"
    general = "general"
    greeting = "greeting"


class ConversationMessage(BaseModel):
    """Single message in a conversation."""
    role: MessageRole = Field(..., description="Role of the message sender")
    content: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Message content"
    )
    
    @field_validator('content')
    @classmethod
    def sanitize_content(cls, v: str) -> str:
        """Sanitize message content."""
        # Remove excessive whitespace
        v = ' '.join(v.split())
        
        # Check for null bytes
        if '\x00' in v:
            raise ValueError("Content contains null bytes")
        
        return v.strip()


class ChatRequestValidator(BaseModel):
    """Validated chat request."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User message"
    )
    conversation_history: Optional[List[ConversationMessage]] = Field(
        default=None,
        max_length=50,
        description="Previous conversation messages"
    )
    user_id: Optional[str] = Field(
        default=None,
        max_length=100,
        description="User identifier"
    )
    session_id: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Session identifier"
    )
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate and sanitize message."""
        # Remove excessive whitespace
        v = ' '.join(v.split())
        
        # Check for control characters
        if any(ord(char) < 32 and char not in '\n\r\t' for char in v):
            raise ValueError("Message contains invalid control characters")
        
        # Check minimum meaningful length
        if len(v.strip()) < 1:
            raise ValueError("Message is too short")
        
        return v.strip()
    
    @field_validator('conversation_history')
    @classmethod
    def validate_history(cls, v: Optional[List[ConversationMessage]]) -> Optional[List[ConversationMessage]]:
        """Validate conversation history."""
        if v is None:
            return None
        
        # Limit history size
        if len(v) > 50:
            raise ValueError("Conversation history too long (max 50 messages)")
        
        # Calculate total size
        total_size = sum(len(msg.content) for msg in v)
        if total_size > 50000:  # 50KB limit
            raise ValueError("Conversation history total size too large")
        
        return v


class ProductSearchValidator(BaseModel):
    """Validated product search request."""
    query: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Search query"
    )
    limit: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of results"
    )
    category: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Product category filter"
    )
    min_price: Optional[float] = Field(
        default=None,
        ge=0,
        description="Minimum price filter"
    )
    max_price: Optional[float] = Field(
        default=None,
        ge=0,
        description="Maximum price filter"
    )
    
    @field_validator('query')
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate search query."""
        # Remove excessive whitespace
        v = ' '.join(v.split())
        
        # Check for SQL injection patterns
        dangerous_patterns = [
            r'\bunion\b.*\bselect\b',
            r'\bdrop\b.*\btable\b',
            r'\bdelete\b.*\bfrom\b',
            r'--|#|/\*',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("Query contains invalid patterns")
        
        # Allow only safe characters
        if not re.match(r'^[\w\s\-.,!?äöüßÄÖÜ]+$', v):
            raise ValueError("Query contains invalid characters")
        
        return v.strip()
    
    @field_validator('max_price')
    @classmethod
    def validate_price_range(cls, v: Optional[float], info) -> Optional[float]:
        """Validate price range."""
        if v is not None:
            min_price = info.data.get('min_price')
            if min_price is not None and v < min_price:
                raise ValueError("max_price must be greater than min_price")
        return v


class ScraperRequestValidator(BaseModel):
    """Validated scraper request."""
    query: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Product to scrape"
    )
    stores: Optional[List[str]] = Field(
        default=None,
        description="List of stores to scrape"
    )
    max_products: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum products per store"
    )
    
    @field_validator('stores')
    @classmethod
    def validate_stores(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate store list."""
        if v is None:
            return None
        
        allowed_stores = ['amazon', 'thomann', 'mediamarkt', 'saturn', 'otto']
        
        for store in v:
            if store.lower() not in allowed_stores:
                raise ValueError(f"Invalid store: {store}. Allowed: {', '.join(allowed_stores)}")
        
        return [s.lower() for s in v]


class URLValidator(BaseModel):
    """Validated URL."""
    url: str = Field(
        ...,
        min_length=10,
        max_length=2048,
        description="URL to validate"
    )
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate URL format and security."""
        # Check URL format
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE
        )
        
        if not url_pattern.match(v):
            raise ValueError("Invalid URL format")
        
        # Prevent SSRF attacks - block private IPs
        private_patterns = [
            r'localhost',
            r'127\.',
            r'192\.168\.',
            r'10\.',
            r'172\.(1[6-9]|2[0-9]|3[0-1])\.',
            r'169\.254\.',
            r'0\.0\.0\.0',
        ]
        
        for pattern in private_patterns:
            if re.search(pattern, v, re.IGNORECASE):
                raise ValueError("URL points to private network")
        
        return v


class PriceUpdateValidator(BaseModel):
    """Validated price update."""
    product_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Product identifier"
    )
    store_id: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Store identifier"
    )
    price: float = Field(
        ...,
        ge=0,
        le=1000000,
        description="Product price"
    )
    currency: str = Field(
        default="EUR",
        pattern=r'^[A-Z]{3}$',
        description="Currency code (ISO 4217)"
    )
    availability: bool = Field(
        default=True,
        description="Product availability"
    )
    url: Optional[str] = Field(
        default=None,
        max_length=2048,
        description="Product URL"
    )
    
    @field_validator('product_id', 'store_id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        """Validate ID format."""
        # Allow only alphanumeric and underscore/hyphen
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("ID contains invalid characters")
        return v


def validate_pagination(page: int = 1, per_page: int = 10) -> tuple[int, int]:
    """
    Validate pagination parameters.
    
    Args:
        page: Page number (1-indexed)
        per_page: Results per page
    
    Returns:
        Validated (page, per_page) tuple
    
    Raises:
        ValueError: If parameters are invalid
    """
    if page < 1:
        raise ValueError("Page must be >= 1")
    
    if page > 10000:
        raise ValueError("Page number too large (max 10000)")
    
    if per_page < 1:
        raise ValueError("per_page must be >= 1")
    
    if per_page > 100:
        raise ValueError("per_page too large (max 100)")
    
    return page, per_page


def validate_email(email: str) -> bool:
    """
    Validate email address format.
    
    Args:
        email: Email address to validate
    
    Returns:
        True if valid
    """
    email_pattern = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    return bool(email_pattern.match(email))
