"""
Security Middleware
Implements comprehensive security features including:
- Security headers (CSP, HSTS, X-Frame-Options)
- Request size limits
- Input sanitization
- Request logging
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import time
import logging
import re
from html import escape

logger = logging.getLogger(__name__)

# Maximum request body size (10 MB)
MAX_REQUEST_SIZE = 10 * 1024 * 1024

# SQL injection patterns to detect
SQL_INJECTION_PATTERNS = [
    r"(\bunion\b.*\bselect\b)",
    r"(\bselect\b.*\bfrom\b)",
    r"(\bdrop\b.*\btable\b)",
    r"(\binsert\b.*\binto\b)",
    r"(\bdelete\b.*\bfrom\b)",
    r"(\bupdate\b.*\bset\b)",
    r"(--|#|/\*|\*/)",
    r"(\bor\b.*=.*)",
    r"(\band\b.*=.*)",
    r"('.*or.*'.*=.*')",
]

# XSS patterns to detect
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe",
    r"<object",
    r"<embed",
]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Process request
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://api.groq.com; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Limit request body size to prevent DoS attacks."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Check content length
        content_length = request.headers.get("content-length")
        
        if content_length:
            content_length = int(content_length)
            if content_length > MAX_REQUEST_SIZE:
                logger.warning(
                    f"Request size too large: {content_length} bytes from {request.client.host}"
                )
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={
                        "error": "Request body too large",
                        "max_size": f"{MAX_REQUEST_SIZE / 1024 / 1024} MB"
                    }
                )
        
        return await call_next(request)


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """Sanitize and validate input to prevent injection attacks."""
    
    def _check_sql_injection(self, text: str) -> bool:
        """Check if text contains SQL injection patterns."""
        text_lower = text.lower()
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        return False
    
    def _check_xss(self, text: str) -> bool:
        """Check if text contains XSS patterns."""
        for pattern in XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _sanitize_dict(self, data: dict) -> dict:
        """Recursively sanitize dictionary values."""
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                # Check for injection attacks
                if self._check_sql_injection(value):
                    logger.warning(f"SQL injection attempt detected in field '{key}'")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid input: Potential SQL injection detected"
                    )
                
                if self._check_xss(value):
                    logger.warning(f"XSS attempt detected in field '{key}'")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid input: Potential XSS detected"
                    )
                
                # HTML escape for safety
                sanitized[key] = escape(value)
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_dict(item) if isinstance(item, dict)
                    else escape(item) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Only process POST, PUT, PATCH requests with JSON body
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            
            if "application/json" in content_type:
                try:
                    # Read and parse body
                    body = await request.body()
                    if body:
                        import json
                        data = json.loads(body)
                        
                        # Sanitize input
                        sanitized_data = self._sanitize_dict(data)
                        
                        # Replace request body with sanitized version
                        request._body = json.dumps(sanitized_data).encode()
                
                except json.JSONDecodeError:
                    logger.error("Invalid JSON in request body")
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"error": "Invalid JSON format"}
                    )
                except HTTPException as e:
                    return JSONResponse(
                        status_code=e.status_code,
                        content={"error": e.detail}
                    )
                except Exception as e:
                    logger.error(f"Error sanitizing input: {e}")
        
        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests for security monitoring."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.time()
        
        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else "unknown",
                "user_agent": request.headers.get("user-agent", "unknown"),
            }
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        logger.info(
            f"Request completed: {request.method} {request.url.path} - {response.status_code} - {duration:.3f}s",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration": duration,
                "client": request.client.host if request.client else "unknown",
            }
        )
        
        return response


def sanitize_search_query(query: str, max_length: int = 200) -> str:
    """
    Sanitize search query to prevent injection attacks.
    
    Args:
        query: Raw search query
        max_length: Maximum allowed length
    
    Returns:
        Sanitized query string
    
    Raises:
        ValueError: If query is invalid or dangerous
    """
    if not query or not isinstance(query, str):
        raise ValueError("Query must be a non-empty string")
    
    # Trim whitespace
    query = query.strip()
    
    # Check length
    if len(query) > max_length:
        raise ValueError(f"Query too long (max {max_length} characters)")
    
    # Check for SQL injection
    query_lower = query.lower()
    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, query_lower, re.IGNORECASE):
            raise ValueError("Invalid query: Potential SQL injection detected")
    
    # Remove potentially dangerous characters
    # Allow: letters, numbers, spaces, and basic punctuation
    sanitized = re.sub(r'[^\w\s\-.,!?äöüßÄÖÜ]', '', query)
    
    return sanitized


def validate_url(url: str) -> bool:
    """
    Validate URL to prevent SSRF attacks.
    
    Args:
        url: URL to validate
    
    Returns:
        True if URL is valid and safe
    """
    if not url:
        return False
    
    # Check URL format
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )
    
    if not url_pattern.match(url):
        return False
    
    # Prevent access to private IP ranges
    private_ip_patterns = [
        r'localhost',
        r'127\.',
        r'192\.168\.',
        r'10\.',
        r'172\.(1[6-9]|2[0-9]|3[0-1])\.',
        r'169\.254\.',
    ]
    
    for pattern in private_ip_patterns:
        if re.search(pattern, url, re.IGNORECASE):
            return False
    
    return True
