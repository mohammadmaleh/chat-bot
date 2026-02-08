"""
Improved Base Scraper
Enhanced version with:
- Retry logic with exponential backoff
- Timeout management
- Resource cleanup
- Error handling
- Rate limiting
"""
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
from dataclasses import dataclass
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
import asyncio
import logging
import random
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


@dataclass
class ScrapedProduct:
    """Product data scraped from store."""
    name: str
    price: float
    currency: str
    availability: bool
    url: str
    image_url: Optional[str] = None
    brand: Optional[str] = None
    ean: Optional[str] = None
    description: Optional[str] = None


class ScraperError(Exception):
    """Base exception for scraper errors."""
    pass


class ScraperTimeout(ScraperError):
    """Scraper timeout exception."""
    pass


class ScraperRateLimited(ScraperError):
    """Rate limit exceeded exception."""
    pass


class BaseScraperImproved(ABC):
    """Enhanced base scraper with robust error handling."""
    
    def __init__(
        self,
        store_name: str,
        store_domain: str,
        timeout: int = 30000,
        max_retries: int = 3,
        retry_delay: int = 2
    ):
        """
        Initialize scraper.
        
        Args:
            store_name: Store identifier
            store_domain: Store domain name
            timeout: Request timeout in milliseconds
            max_retries: Maximum retry attempts
            retry_delay: Initial retry delay in seconds
        """
        self.store_name = store_name
        self.store_domain = store_domain
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        
        # Rate limiting
        self._last_request_time = None
        self._min_request_interval = 1.0  # seconds
        
        logger.info(f"Initialized {store_name} scraper")
    
    async def __aenter__(self):
        """Context manager entry."""
        await self.init_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit with cleanup."""
        await self.close()
    
    async def init_browser(self):
        """Initialize browser with security settings."""
        if self.playwright:
            return
        
        try:
            self.playwright = await async_playwright().start()
            
            # Launch browser with security settings
            self.browser = await self.playwright.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process'
                ]
            )
            
            # Create context with realistic settings
            context = await self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent=self._get_random_user_agent(),
                locale='de-DE',
                timezone_id='Europe/Berlin',
                permissions=[],
                java_script_enabled=True,
                bypass_csp=True,
            )
            
            # Create page
            self.page = await context.new_page()
            
            # Set default timeout
            self.page.set_default_timeout(self.timeout)
            
            logger.info(f"Browser initialized for {self.store_name}")
        
        except Exception as e:
            logger.error(f"Failed to initialize browser: {e}")
            raise ScraperError(f"Browser initialization failed: {e}")
    
    async def close(self):
        """Clean up resources."""
        try:
            if self.page:
                await self.page.close()
                self.page = None
            
            if self.browser:
                await self.browser.close()
                self.browser = None
            
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
            
            logger.info(f"Cleaned up {self.store_name} scraper resources")
        
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    def _get_random_user_agent(self) -> str:
        """Get random user agent string."""
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        ]
        return random.choice(user_agents)
    
    async def _rate_limit(self):
        """Enforce rate limiting between requests."""
        if self._last_request_time:
            elapsed = datetime.now() - self._last_request_time
            if elapsed.total_seconds() < self._min_request_interval:
                wait_time = self._min_request_interval - elapsed.total_seconds()
                logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
                await asyncio.sleep(wait_time)
        
        self._last_request_time = datetime.now()
    
    async def _retry_with_backoff(self, func, *args, **kwargs) -> Any:
        """
        Execute function with retry logic and exponential backoff.
        
        Args:
            func: Async function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments
        
        Returns:
            Function result
        
        Raises:
            ScraperError: If all retries fail
        """
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                # Rate limit
                await self._rate_limit()
                
                # Execute with timeout
                result = await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=self.timeout / 1000  # Convert to seconds
                )
                
                logger.debug(f"Request succeeded on attempt {attempt + 1}")
                return result
            
            except asyncio.TimeoutError:
                last_error = ScraperTimeout(f"Request timeout after {self.timeout}ms")
                logger.warning(f"Timeout on attempt {attempt + 1}/{self.max_retries}")
            
            except PlaywrightTimeout:
                last_error = ScraperTimeout("Playwright timeout")
                logger.warning(f"Playwright timeout on attempt {attempt + 1}/{self.max_retries}")
            
            except Exception as e:
                last_error = e
                logger.warning(f"Error on attempt {attempt + 1}/{self.max_retries}: {e}")
            
            # Calculate backoff delay
            if attempt < self.max_retries - 1:
                delay = self.retry_delay * (2 ** attempt) + random.uniform(0, 1)
                logger.info(f"Retrying in {delay:.2f}s...")
                await asyncio.sleep(delay)
        
        # All retries failed
        logger.error(f"All {self.max_retries} attempts failed")
        raise ScraperError(f"Failed after {self.max_retries} attempts: {last_error}")
    
    @abstractmethod
    async def search(self, query: str, max_results: int = 10) -> List[ScrapedProduct]:
        """
        Search for products.
        
        Args:
            query: Search query
            max_results: Maximum number of results
        
        Returns:
            List of scraped products
        """
        pass
    
    @abstractmethod
    async def get_product(self, url: str) -> Optional[ScrapedProduct]:
        """
        Get detailed product information.
        
        Args:
            url: Product URL
        
        Returns:
            Scraped product or None
        """
        pass
    
    async def search_with_retry(self, query: str, max_results: int = 10) -> List[ScrapedProduct]:
        """
        Search with automatic retry.
        
        Args:
            query: Search query
            max_results: Maximum results
        
        Returns:
            List of products
        """
        return await self._retry_with_backoff(self.search, query, max_results)
    
    async def get_product_with_retry(self, url: str) -> Optional[ScrapedProduct]:
        """
        Get product with automatic retry.
        
        Args:
            url: Product URL
        
        Returns:
            Product or None
        """
        return await self._retry_with_backoff(self.get_product, url)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get scraper statistics."""
        return {
            'store_name': self.store_name,
            'store_domain': self.store_domain,
            'timeout': self.timeout,
            'max_retries': self.max_retries,
            'browser_active': self.browser is not None,
            'page_active': self.page is not None,
        }


async def scrape_with_timeout(
    scraper: BaseScraperImproved,
    query: str,
    max_results: int = 10,
    timeout: int = 60
) -> List[ScrapedProduct]:
    """
    Scrape with global timeout.
    
    Args:
        scraper: Scraper instance
        query: Search query
        max_results: Maximum results
        timeout: Global timeout in seconds
    
    Returns:
        List of products
    
    Raises:
        ScraperTimeout: If timeout is exceeded
    """
    try:
        result = await asyncio.wait_for(
            scraper.search_with_retry(query, max_results),
            timeout=timeout
        )
        return result
    except asyncio.TimeoutError:
        raise ScraperTimeout(f"Scraping timeout after {timeout}s")
