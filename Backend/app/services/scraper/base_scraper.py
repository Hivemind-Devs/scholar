import asyncio
import logging
import random
import re
from abc import ABC, abstractmethod
from typing import Any, List, Optional
from urllib.parse import parse_qs, urlparse

from playwright.async_api import Page
from selectolax.parser import HTMLParser, Node

from app.core.config import settings

logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    """
    An abstract base class for all scrapers.
    Provides common utilities for parsing, data extraction, and human-like delays.
    """

    def __init__(self):
        self.logger = logger
        self.delay = settings.request_delay

    @abstractmethod
    async def scrape(self) -> Any:
        """
        The main method to be implemented by all subclasses.
        This method should contain the core scraping logic.
        """
        raise NotImplementedError

    def parse_html(self, html_content: str) -> HTMLParser:
        """Parses HTML content using Selectolax for fast CSS selections."""
        try:
            return HTMLParser(html_content)
        except Exception as e:
            self.logger.error(f"Failed to parse HTML content: {e}")

            return HTMLParser("")

    async def safe_get_text(self, node: Node, selector: str, default: str = "") -> str:
        """Safely extracts and cleans text from a node using a CSS selector."""
        try:
            element = node.css_first(selector)
            if element:
                return self.clean_text(element.text(strip=True))
        except Exception as e:
            self.logger.debug(f"safe_get_text failed for selector '{selector}': {e}")
        return default

    async def safe_get_attribute(self, node: Node, selector: str, attribute: str, default: str = "") -> str:
        """Safely extracts an attribute value from a node using a CSS selector."""
        try:
            element = node.css_first(selector)
            if element and attribute in element.attributes:
                return element.attributes[attribute]
        except Exception as e:
            self.logger.debug(f"safe_get_attribute failed for selector '{selector}' and attribute '{attribute}': {e}")
        return default

    async def add_delay(self):
        """Adds a human-like delay with random jitter to avoid rate-limiting."""
        jitter = random.uniform(-0.5, 0.5)
        sleep_time = max(0.5, self.delay + jitter)
        self.logger.debug(f"Adding a delay of {sleep_time:.2f} seconds.")
        await asyncio.sleep(sleep_time)

    async def scroll_to_bottom(self, page: Page):
        """Scrolls the page to the bottom to load dynamically loaded content."""
        self.logger.info("Scrolling to the bottom of the page...")
        last_height = await page.evaluate("document.body.scrollHeight")
        while True:
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
            await asyncio.sleep(2)
            new_height = await page.evaluate("document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        self.logger.info("Finished scrolling.")

    def clean_text(self, text: Optional[str]) -> str:
        """Cleans a string by stripping whitespace and removing multiple spaces."""
        if text is None:
            return ""

        return re.sub(r'\s+', ' ', text).strip()

    def extract_yok_id(self, url: str) -> Optional[str]:
        """Parses the 'authorId' from a YÖK profile URL."""
        if not url:
            return None
        try:
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)
            author_id = query_params.get('authorId', [None])[0]
            if author_id:
                return author_id
        except Exception as e:
            self.logger.error(f"Could not extract YÖK ID from URL '{url}': {e}")
        return None
