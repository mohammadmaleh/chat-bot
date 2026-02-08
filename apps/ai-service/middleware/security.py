"""
Security Middleware
Implements rate limiting, CORS validation, input sanitization, and security headers.
"""
from fastapi import Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import time
import re
import html
from config import settings


# ============================================
# RATE LIMITER
# ============================================
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
    enabled=settings.rate_limit_enabled,
    storage_uri=settings.redis_url,
    strategy="fixed-window",  # or "moving-window" for more accurate limiting
)


def setup_rate_limiter(app):
    """Configure rate limiter for FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    return limiter


# ============================================
# CORS MIDDLEWARE
# ============================================
def setup_cors(app):
    """Configure CORS with secure defaults."""
    
    # In production, use explicit origins
    if settings.is_production:
        origins = settings.allowed_origins
        allow_credentials = True
        allow_all = False
    else:
        # Development: more permissive
        origins = settings.allowed_origins + ["*"]
        allow_credentials = True
        allow_all = True
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if not allow_all else ["*"],
        allow_credentials=allow_credentials,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "*",
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "X-CSRF-Token",
        ],
        expose_headers=["X-Total-Count", "X-Page", "X-Per-Page"],
        max_age=3600,  # Cache preflight requests for 1 hour
    )
    
    print(f"✅ CORS configured - Origins: {origins}")


# ============================================
# SECURITY HEADERS MIDDLEWARE
# ============================================
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )
        
        # Content Security Policy (CSP)
        if settings.is_production:
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
        
        # Strict Transport Security (HSTS) - only in production with HTTPS
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        return response


# ============================================
# REQUEST TIMING MIDDLEWARE
# ============================================
class RequestTimingMiddleware(BaseHTTPMiddleware):
    """Log request duration for monitoring."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        
        # Log slow requests
        if process_time > 1.0:  # Slower than 1 second
            print(f"⚠️  Slow request: {request.method} {request.url.path} - {process_time:.2f}s")
        
        return response


# ============================================
# INPUT SANITIZATION
# ============================================
class InputSanitizer:
    """Sanitize user input to prevent injection attacks."""
    
    # Dangerous patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)",
        r"(--|#|/\*|\*/)",
        r"(\bOR\b.*=.*)",
        r"(\bAND\b.*=.*)",
        r"(\bUNION\b.*\bSELECT\b)",
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"onerror\s*=",
        r"onload\s*=",
        r"<iframe[^>]*>",
    ]
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000) -> str:
        """Sanitize string input."""
        if not text:
            return text
        
        # Truncate
        text = text[:max_length]
        
        # HTML escape
        text = html.escape(text)
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Normalize whitespace
        text = ' '.join(text.split())
        
        return text
    
    @classmethod
    def detect_sql_injection(cls, text: str) -> bool:
        """Detect potential SQL injection attempts."""
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def detect_xss(cls, text: str) -> bool:
        """Detect potential XSS attempts."""
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def validate_input(cls, text: str, field_name: str = "input") -> str:
        """Validate and sanitize input."""
        if not text:
            return text
        
        # Check for attacks
        if cls.detect_sql_injection(text):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {field_name}: potential SQL injection detected"
            )
        
        if cls.detect_xss(text):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {field_name}: potential XSS detected"
            )
        
        # Sanitize
        return cls.sanitize_string(text)


# ============================================
# REQUEST VALIDATION MIDDLEWARE
# ============================================
class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Validate incoming requests."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Check Content-Type for POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            
            if not content_type.startswith("application/json") and \
               not content_type.startswith("multipart/form-data"):
                return JSONResponse(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    content={
                        "detail": "Content-Type must be application/json or multipart/form-data"
                    }
                )
        
        # Check request size (prevent DoS)
        content_length = request.headers.get("content-length")
        if content_length:
            if int(content_length) > 10 * 1024 * 1024:  # 10MB limit
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={"detail": "Request body too large (max 10MB)"}
                )
        
        return await call_next(request)


# ============================================
# ERROR HANDLER
# ============================================
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Custom error handler for better error messages."""
    
    # Log error (don't expose internal details in production)
    if settings.is_production:
        detail = exc.detail if exc.status_code < 500 else "Internal server error"
    else:
        detail = exc.detail
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "status": exc.status_code,
                "message": detail,
                "timestamp": int(time.time()),
            }
        },
    )


# ============================================
# SETUP ALL SECURITY MIDDLEWARE
# ============================================
def setup_security(app):
    """Configure all security middleware."""
    
    # 1. CORS
    setup_cors(app)
    
    # 2. Rate Limiting
    setup_rate_limiter(app)
    
    # 3. Security Headers
    app.add_middleware(SecurityHeadersMiddleware)
    
    # 4. Request Timing
    app.add_middleware(RequestTimingMiddleware)
    
    # 5. Request Validation
    app.add_middleware(RequestValidationMiddleware)
    
    # 6. Custom error handler
    app.add_exception_handler(HTTPException, custom_http_exception_handler)
    
    print("✅ Security middleware configured")
    print(f"   - Rate limiting: {settings.rate_limit_per_minute}/min")
    print(f"   - CORS origins: {len(settings.allowed_origins)} configured")
    print(f"   - Input sanitization: enabled")
    print(f"   - Security headers: enabled")
