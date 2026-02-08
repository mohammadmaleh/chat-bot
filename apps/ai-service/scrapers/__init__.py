"""
Price scraping modules for German e-commerce stores.
"""

from .base_scraper import BaseScraper, ScrapedProduct
from .amazon import AmazonScraper
from .thomann import ThomannScraper
from .utils import (
    get_random_user_agent,
    get_chrome_user_agent,
    sanitize_price,
    extract_asin,
    is_valid_german_url,
    wait_for_rate_limit,
)

__all__ = [
    "BaseScraper",
    "ScrapedProduct",
    "AmazonScraper",
    "ThomannScraper",
    "get_random_user_agent",
    "get_chrome_user_agent",
    "sanitize_price",
    "extract_asin",
    "is_valid_german_url",
    "wait_for_rate_limit",
]
