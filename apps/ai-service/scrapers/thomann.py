"""
Thomann.de scraper implementation.
Germany's largest musical instrument retailer.
"""

from typing import List, Optional
from scrapers.base_scraper import BaseScraper, ScrapedProduct
from scrapers.utils import sanitize_price, wait_for_rate_limit
import asyncio
import re


class ThomannScraper(BaseScraper):
    """Scraper for Thomann.de"""

    def __init__(self):
        super().__init__(store_name="thomann", store_domain="thomann.de")
        self.base_url = "https://www.thomann.de"

    async def search(self, query: str, max_results: int = 10) -> List[ScrapedProduct]:
        """
        Search for products on Thomann.de
        """
        if not self.page:
            await self.init_browser()

        search_url = (
            f"{self.base_url}/de/search_dir.html?sws={query.replace(' ', '%20')}"
        )

        try:
            await self.page.goto(
                search_url, wait_until="domcontentloaded", timeout=self.timeout
            )

            # Wait for product grid - CORRECT SELECTOR
            await self.page.wait_for_selector(".product", timeout=10000)
            await self.page.wait_for_timeout(1000)  # Wait for JS to finish

            products = []
            product_cards = await self.page.query_selector_all(".product")

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
            # Name - FIXED SELECTORS
            manufacturer_elem = await card.query_selector(".title__manufacturer")
            name_elem = await card.query_selector(".title__name")

            manufacturer = (
                await manufacturer_elem.inner_text() if manufacturer_elem else ""
            )
            name_part = await name_elem.inner_text() if name_elem else ""

            name = f"{manufacturer}{name_part}".strip()

            if not name:
                return None

            # URL - FIXED SELECTOR
            link_elem = await card.query_selector("a.product__content")
            href = await link_elem.get_attribute("href") if link_elem else None

            # Handle relative URLs
            if href:
                if href.startswith("http"):
                    url = href
                elif href.startswith("/"):
                    url = f"{self.base_url}{href}"
                else:
                    url = f"{self.base_url}/de/{href}"
            else:
                url = None

            # Price - FIXED SELECTOR
            price_elem = await card.query_selector(".fx-typography-price-primary")
            price_text = await price_elem.inner_text() if price_elem else None
            price = sanitize_price(price_text) if price_text else 0.0

            # Image - FIXED SELECTOR
            img_elem = await card.query_selector(".product__image img")
            image_url = await img_elem.get_attribute("src") if img_elem else None

            # Availability - FIXED SELECTOR
            availability = False
            avail_elem = await card.query_selector(".fx-availability--in-stock")
            if avail_elem:
                availability = True

            # Extract product ID from URL
            product_id_match = (
                re.search(r"/(\d+)\.htm|_(\d+)\.htm", url or "") if url else None
            )
            ean = (
                product_id_match.group(1) or product_id_match.group(2)
                if product_id_match
                else None
            )

            print(
                f"  ✓ Thomann: {name[:40]}... | €{price} | {url[:50] if url else 'no url'}..."
            )

            return ScrapedProduct(
                name=name.strip(),
                price=price or 0.0,
                currency="EUR",
                availability=availability,
                url=url or "",
                image_url=image_url,
                ean=ean,
                brand=manufacturer.strip() if manufacturer else None,
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
            await self.page.goto(
                url, wait_until="domcontentloaded", timeout=self.timeout
            )
            await self.page.wait_for_timeout(1000)

            # Title
            manufacturer_elem = await self.page.query_selector(".title__manufacturer")
            name_elem = await self.page.query_selector(".title__name")

            manufacturer = (
                await manufacturer_elem.inner_text() if manufacturer_elem else ""
            )
            name_part = await name_elem.inner_text() if name_elem else "Unknown"
            name = f"{manufacturer}{name_part}".strip()

            # Price
            price_elem = await self.page.query_selector(".fx-typography-price-primary")
            price_text = await price_elem.inner_text() if price_elem else None
            price = sanitize_price(price_text) if price_text else 0.0

            # Image
            img_elem = await self.page.query_selector(
                '.product__image img, img[alt*="product"]'
            )
            image_url = await img_elem.get_attribute("src") if img_elem else None

            # Availability
            availability = False
            avail_elem = await self.page.query_selector(".fx-availability--in-stock")
            if avail_elem:
                availability = True

            # Product ID
            product_id_match = re.search(r"/(\d+)\.htm|_(\d+)\.htm", url)
            ean = (
                product_id_match.group(1) or product_id_match.group(2)
                if product_id_match
                else None
            )

            # Description
            desc_elem = await self.page.query_selector(".product__description")
            description = await desc_elem.inner_text()[:500] if desc_elem else None

            return ScrapedProduct(
                name=name.strip(),
                price=price,
                currency="EUR",
                availability=availability,
                url=url,
                image_url=image_url,
                brand=manufacturer.strip() if manufacturer else None,
                ean=ean,
                description=description,
            )

        except Exception as e:
            print(f"Thomann product error: {e}")
            return None
