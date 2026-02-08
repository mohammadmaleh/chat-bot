"""
Thomann.de scraper implementation.
Germany's largest musical instrument retailer.
"""
from typing import List, Optional
from scrapers.base_scraper import BaseScraper, ScrapedProduct
from scrapers.utils import sanitize_price, extract_asin, wait_for_rate_limit
import asyncio
import re


class ThomannScraper(BaseScraper):
    """Scraper for Thomann.de"""
    
    def __init__(self):
        super().__init__(store_name='thomann', store_domain='thomann.de')
        self.base_url = 'https://www.thomann.de'
    
    async def search(self, query: str, max_results: int = 10) -> List[ScrapedProduct]:
        """
        Search for products on Thomann.de
        """
        if not self.page:
            await self.init_browser()
        
        search_url = f"{self.base_url}/de/search_dir.html?sws={query.replace(' ', '%20')}"
        
        try:
            await self.page.goto(search_url, wait_until='domcontentloaded', timeout=self.timeout)
            
            # FIXED: Updated selectors for 2026 Thomann layout
            await self.page.wait_for_selector('article[class*="product"], .product-item, .ga-product', timeout=10000)
            
            products = []
            # FIXED: Multiple selector strategy
            product_cards = await self.page.query_selector_all('article[class*="product"], .product-item, .ga-product, [data-testid*="product"]')
            
            print(f"Found {len(product_cards)} Thomann product cards")
            
            for card in product_cards[:max_results]:
                try:
                    product = await self._extract_search_result(card)
                    if product:
                        products.append(product)
                        wait_for_rate_limit(self.store_name)
                except Exception as e:
                    print(f"Error extracting Thomann product: {e}")
                    continue
            
            return products
            
        except Exception as e:
            print(f"Thomann search error: {e}")
            return []
    
    async def _extract_search_result(self, card) -> Optional[ScrapedProduct]:
        """Extract product info from Thomann search result."""
        try:
            # FIXED: Multiple name selectors
            name_selectors = [
                '.product-title a span',
                '.productbox-title a span',
                'h3 a span',
                '[data-testid="product-title"] span',
                '.ga-product-title a span'
            ]
            name_elem = None
            for selector in name_selectors:
                name_elem = await card.query_selector(selector)
                if name_elem:
                    break
            
            name = await name_elem.inner_text() if name_elem else None
            
            if not name or not name.strip():
                return None
            
            # URL
            link_elem = await card.query_selector('a[href*="/de/"]')
            href = await link_elem.get_attribute('href') if link_elem else None
            url = f"{self.base_url}{href}" if href and href.startswith('/') else href
            
            # FIXED: Multiple price selectors
            price_selectors = [
                '.price',
                '.price-tag',
                '.current-price',
                '[class*="price"] .price-value',
                '.ga-product-price'
            ]
            price_elem = None
            for selector in price_selectors:
                price_elem = await card.query_selector(selector)
                if price_elem:
                    break
            
            price_text = await price_elem.inner_text() if price_elem else None
            price = sanitize_price(price_text) if price_text else 0.0
            
            # FIXED: Multiple image selectors
            img_selectors = [
                '.productbox-image img',
                '.product-image img',
                '[data-testid="product-image"] img'
            ]
            img_elem = None
            for selector in img_selectors:
                img_elem = await card.query_selector(selector)
                if img_elem:
                    break
            
            image_url = await img_elem.get_attribute('src') if img_elem else None
            
            # FIXED: Multiple sold-out selectors
            sold_out_selectors = ['.sold_out', '.out_of_stock', '[class*="sold-out"]']
            availability = True
            for selector in sold_out_selectors:
                sold_out_elem = await card.query_selector(selector)
                if sold_out_elem:
                    availability = False
                    break
            
            # Extract product ID from URL
            product_id_match = re.search(r'/(\d+)\.html', url or '')
            ean = product_id_match.group(1) if product_id_match else None
            
            print(f"  ✓ Thomann: {name[:40]}... | €{price} | {url[:50] if url else 'no url'}...")
            
            return ScrapedProduct(
                name=name.strip(),
                price=price,
                currency='EUR',
                availability=availability,
                url=url or '',
                image_url=image_url,
                ean=ean,
                brand=None
            )
            
        except Exception as e:
            print(f"  ✗ Thomann extract error: {e}")
            return None
    
    async def get_product(self, url: str) -> Optional[ScrapedProduct]:
        """
        Get detailed product information from Thomann product page.
        """
        if not self.page:
            await self.init_browser()
        
        try:
            await self.page.goto(url, wait_until='domcontentloaded', timeout=self.timeout)
            
            # FIXED: Multiple title selectors
            title_selectors = ['h1', '[data-testid="product-title"]']
            title_elem = None
            for selector in title_selectors:
                title_elem = await self.page.query_selector(selector)
                if title_elem:
                    break
            
            name = await title_elem.inner_text() if title_elem else 'Unknown'
            
            # FIXED: Multiple price selectors
            price_selectors = ['.price', '.current-price', '.price-tag']
            price_elem = None
            for selector in price_selectors:
                price_elem = await self.page.query_selector(selector)
                if price_elem:
                    break
            
            price_text = await price_elem.inner_text() if price_elem else None
            price = sanitize_price(price_text) if price_text else 0.0
            
            # Brand
            brand_elem = await self.page.query_selector('.brand-name, .manufacturer, [class*="brand"]')
            brand = await brand_elem.inner_text() if brand_elem else None
            
            # Image
            img_selectors = ['#product-main-image img', '.product-image img']
            img_elem = None
            for selector in img_selectors:
                img_elem = await self.page.query_selector(selector)
                if img_elem:
                    break
            
            image_url = await img_elem.get_attribute('src') if img_elem else None
            
            # Availability
            availability = True
            sold_out_elem = await self.page.query_selector('.sold_out, .out_of_stock')
            if sold_out_elem:
                availability = False
            
            # Product ID
            product_id_match = re.search(r'/(\d+)\.html', url)
            ean = product_id_match.group(1) if product_id_match else None
            
            # Description
            desc_elem = await self.page.query_selector('.product-description, [class*="description"]')
            description = await desc_elem.inner_text()[:500] if desc_elem else None
            
            return ScrapedProduct(
                name=name.strip(),
                price=price,
                currency='EUR',
                availability=availability,
                url=url,
                image_url=image_url,
                brand=brand,
                ean=ean,
                description=description
            )
            
        except Exception as e:
            print(f"Thomann product error: {e}")
            return None
