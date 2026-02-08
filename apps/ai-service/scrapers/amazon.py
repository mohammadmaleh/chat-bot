"""
Amazon.de scraper implementation.
Handles product search and detail extraction from Amazon Germany.
"""
from typing import List, Optional
from .base_scraper import BaseScraper, ScrapedProduct
from .utils import sanitize_price, extract_asin, wait_for_rate_limit
import asyncio


class AmazonScraper(BaseScraper):
    """Scraper for Amazon.de"""
    
    def __init__(self):
        super().__init__(store_name='amazon', store_domain='amazon.de')
        self.base_url = 'https://www.amazon.de'
    
    async def search(self, query: str, max_results: int = 10) -> List[ScrapedProduct]:
        """
        Search for products on Amazon.de
        
        Args:
            query: Search term
            max_results: Maximum products to return
        
        Returns:
            List of ScrapedProduct objects
        """
        if not self.page:
            await self.init_browser()
        
        search_url = f"{self.base_url}/s?k={query.replace(' ', '+')}"
        
        try:
            # Navigate to search results
            await self.page.goto(search_url, wait_until='domcontentloaded', timeout=self.timeout)
            
            # Wait for product grid to load
            await self.page.wait_for_selector('[data-component-type="s-search-result"]', timeout=10000)
            
            # Extract product cards
            products = []
            product_cards = await self.page.query_selector_all('[data-component-type="s-search-result"]')
            
            for card in product_cards[:max_results]:
                try:
                    product = await self._extract_search_result(card)
                    if product:
                        products.append(product)
                        
                        # Respect rate limits
                        wait_for_rate_limit(self.store_name)
                except Exception as e:
                    print(f"Error extracting product card: {e}")
                    continue
            
            return products
            
        except Exception as e:
            print(f"Amazon search error: {e}")
            return []
    
    async def _extract_search_result(self, card) -> Optional[ScrapedProduct]:
        """Extract product info from search result card."""
        try:
            # Title/Name
            title_elem = await card.query_selector('h2 a span')
            name = await title_elem.inner_text() if title_elem else None
            
            if not name:
                return None
            
            # URL
            link_elem = await card.query_selector('h2 a')
            href = await link_elem.get_attribute('href') if link_elem else None
            url = f"{self.base_url}{href}" if href else None
            
            # Price
            price_whole = await card.query_selector('.a-price-whole')
            price_fraction = await card.query_selector('.a-price-fraction')
            
            price = None
            if price_whole and price_fraction:
                whole = await price_whole.inner_text()
                fraction = await price_fraction.inner_text()
                price_str = f"{whole}{fraction}"
                price = sanitize_price(price_str)
            
            # Image
            img_elem = await card.query_selector('img.s-image')
            image_url = await img_elem.get_attribute('src') if img_elem else None
            
            # Availability check (if no price, likely unavailable)
            availability = price is not None
            
            # Extract ASIN for EAN lookup later
            asin = extract_asin(url) if url else None
            
            return ScrapedProduct(
                name=name.strip(),
                price=price or 0.0,
                currency='EUR',
                availability=availability,
                url=url or '',
                image_url=image_url,
                ean=asin,  # Use ASIN as identifier
                brand=None  # Extract in detail page
            )
            
        except Exception as e:
            print(f"Error extracting search result: {e}")
            return None
    
    async def get_product(self, url: str) -> Optional[ScrapedProduct]:
        """
        Get detailed product information from Amazon product page.
        
        Args:
            url: Amazon product URL
        
        Returns:
            ScrapedProduct with detailed info
        """
        if not self.page:
            await self.init_browser()
        
        try:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=self.timeout)
            
            # Wait for main content
            await self.page.wait_for_selector('#productTitle', timeout=10000)
            
            # Extract title
            title_elem = await self.page.query_selector('#productTitle')
            name = await title_elem.inner_text() if title_elem else 'Unknown'
            
            # Extract price
            price = None
            price_selectors = [
                '.a-price .a-offscreen',
                '#priceblock_ourprice',
                '#priceblock_dealprice',
                '.a-price-whole'
            ]
            
            for selector in price_selectors:
                price_elem = await self.page.query_selector(selector)
                if price_elem:
                    price_text = await price_elem.inner_text()
                    price = sanitize_price(price_text)
                    if price:
                        break
            
            # Extract brand
            brand = None
            brand_elem = await self.page.query_selector('#bylineInfo')
            if brand_elem:
                brand_text = await brand_elem.inner_text()
                # Remove "Besuche den " or "Brand: " prefixes
                brand = brand_text.replace('Besuche den ', '').replace('Brand: ', '').replace('-Store', '').strip()
            
            # Extract image
            image_url = None
            img_elem = await self.page.query_selector('#landingImage, #imgTagWrapperId img')
            if img_elem:
                image_url = await img_elem.get_attribute('src')
            
            # Extract description
            description = None
            desc_elem = await self.page.query_selector('#productDescription p')
            if desc_elem:
                description = await desc_elem.inner_text()
            
            # Availability
            availability_elem = await self.page.query_selector('#availability span')
            availability = True
            if availability_elem:
                availability_text = await availability_elem.inner_text()
                availability = 'nicht verfügbar' not in availability_text.lower()
            
            # Extract ASIN
            asin = extract_asin(url)
            
            return ScrapedProduct(
                name=name.strip(),
                price=price or 0.0,
                currency='EUR',
                availability=availability,
                url=url,
                image_url=image_url,
                brand=brand,
                ean=asin,
                description=description[:500] if description else None  # Limit description length
            )
            
        except Exception as e:
            print(f"Amazon product detail error: {e}")
            return None
