"""
Utility functions for web scraping.
Handles user agents, retries, and rate limiting.
"""
import random
import time
from typing import Optional
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential
import os

# Initialize user agent generator
ua = UserAgent()


def get_random_user_agent() -> str:
    """Get a random desktop user agent string."""
    return ua.random


def get_chrome_user_agent() -> str:
    """Get a Chrome user agent specifically."""
    return ua.chrome


def get_firefox_user_agent() -> str:
    """Get a Firefox user agent specifically."""
    return ua.firefox


def get_rate_limit(store_name: str) -> int:
    """
    Get rate limit (requests per minute) for a specific store.
    
    Args:
        store_name: Name of the store (amazon, thomann, mediamarkt)
    
    Returns:
        int: Requests per minute allowed
    """
    env_key = f"RATE_LIMIT_{store_name.upper()}"
    return int(os.getenv(env_key, 20))  # Default to 20 rpm


def wait_for_rate_limit(store_name: str):
    """
    Wait to respect rate limit for a store.
    
    Args:
        store_name: Name of the store
    """
    rpm = get_rate_limit(store_name)
    # Calculate delay in seconds between requests
    delay = 60 / rpm
    # Add small random jitter to avoid patterns
    jitter = random.uniform(0, 0.5)
    time.sleep(delay + jitter)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def retry_on_failure(func):
    """
    Decorator to retry function on failure.
    Uses exponential backoff: 2s, 4s, 8s (max 10s)
    """
    return func


def sanitize_price(price_str: str) -> Optional[float]:
    """
    Extract numeric price from string.
    
    Examples:
        "€29,99" -> 29.99
        "49.90 EUR" -> 49.90
        "1.234,56 €" -> 1234.56
    
    Args:
        price_str: Price string from website
    
    Returns:
        float: Numeric price or None if invalid
    """
    if not price_str:
        return None
    
    # Remove currency symbols and whitespace
    clean = price_str.replace('€', '').replace('EUR', '').strip()
    
    # Handle German format (1.234,56 -> 1234.56)
    if ',' in clean and '.' in clean:
        # German format: 1.234,56
        clean = clean.replace('.', '').replace(',', '.')
    elif ',' in clean:
        # Simple comma: 29,99
        clean = clean.replace(',', '.')
    
    try:
        return float(clean)
    except ValueError:
        return None


def extract_asin(url: str) -> Optional[str]:
    """
    Extract ASIN from Amazon URL.
    
    Example:
        https://www.amazon.de/dp/B08N5WRWNW/ -> B08N5WRWNW
    
    Args:
        url: Amazon product URL
    
    Returns:
        str: ASIN or None
    """
    import re
    match = re.search(r'/dp/([A-Z0-9]{10})', url)
    return match.group(1) if match else None


def is_valid_german_url(url: str, store_domain: str) -> bool:
    """
    Validate if URL belongs to German store.
    
    Args:
        url: URL to validate
        store_domain: Expected domain (e.g., 'amazon.de')
    
    Returns:
        bool: True if valid German store URL
    """
    return store_domain in url.lower()
