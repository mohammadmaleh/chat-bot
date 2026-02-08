"""
Abstract base class for all web scrapers.
Enforces consistent interface and provides common functionality.
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
from playwright.async_api import async_playwright, Browser, Page
import os


@dataclass
class ScrapedProduct:
    """Data class for scraped product information."""
    name: str
    price: float
    currency: str
    availability: bool
    url: str
    image_url: Optional[str] = None
    brand: Optional[str] = None
    ean: Optional[str] = None
    description: Optional[str] = None
    scraped_at: datetime = None
    
    def __post_init__(self):
        if self.scraped_at is None:
            self.scraped_at = datetime.utcnow()


class BaseScraper(ABC):
    """
    Abstract base scraper class.
    All store-specific scrapers must inherit from this.
    """
    
    def __init__(self, store_name: str, store_domain: str):
        """
        Initialize scraper.
        
        Args:
            store_name: Name of the store (e.g., 'amazon')
            store_domain: Domain of the store (e.g., 'amazon.de')
        """
        self.store_name = store_name
        self.store_domain = store_domain
        self.timeout = int(os.getenv('SCRAPER_TIMEOUT_MS', 30000))
        self.max_retries = int(os.getenv('SCRAPER_MAX_RETRIES', 3))
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
    
    async def __aenter__(self):
        """Context manager entry - initialize browser."""
        await self.init_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - cleanup browser."""
        await self.close()
    
    async def init_browser(self):
        """Initialize Playwright browser with stealth settings."""
        playwright = await async_playwright().start()
        
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        )
        
        # Create new context with realistic settings
        context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent=self._get_user_agent(),
            locale='de-DE',
            timezone_id='Europe/Berlin'
        )
        
        self.page = await context.new_page()
        
        # Set extra headers
        await self.page.set_extra_http_headers({
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        })
    
    async def close(self):
        """Close browser and cleanup resources."""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
    
    def _get_user_agent(self) -> str:
        """Get user agent for browser. Override in subclasses if needed."""
        from .utils import get_chrome_user_agent
        return get_chrome_user_agent()
    
    @abstractmethod
    async def search(self, query: str, max_results: int = 10) -> List[ScrapedProduct]:
        """
        Search for products on the store.
        
        Args:
            query: Search query string
            max_results: Maximum number of results to return
        
        Returns:
            List of ScrapedProduct objects
        """
        pass
    
    @abstractmethod
    async def get_product(self, url: str) -> Optional[ScrapedProduct]:
        """
        Get detailed product information from URL.
        
        Args:
            url: Product page URL
        
        Returns:
            ScrapedProduct object or None if failed
        """
        pass
    
    async def get_price(self, url: str) -> Optional[float]:
        """
        Quick price fetch from URL.
        
        Args:
            url: Product page URL
        
        Returns:
            Price as float or None
        """
        product = await self.get_product(url)
        return product.price if product else None
