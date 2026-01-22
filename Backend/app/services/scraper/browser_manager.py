import asyncio
import logging
from typing import Optional

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright

logger = logging.getLogger(__name__)

class BrowserManager:
    """
    Manages Playwright browser instances and contexts.
    Provides methods for safe navigation, retries, and resource cleanup.
    """

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    async def start(self):
        """Starts the Playwright browser."""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=self.headless)
            self.context = await self.browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            await self.stop()
            raise

    async def stop(self):
        """Stops the Playwright browser and cleans up resources."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def create_page(self) -> Page:
        """Creates a new page in the current context."""
        if not self.context:
            raise RuntimeError("Browser context not initialized. Call start() first.")
        return await self.context.new_page()

    async def goto_with_retry(self, page: Page, url: str, retries: int = 3, timeout: int = 30000):
        """Navigates to a URL with retry logic."""
        for attempt in range(retries):
            try:
                await page.goto(url, timeout=timeout, wait_until="domcontentloaded")
                return
            except Exception as e:
                logger.warning(f"Navigation failed (attempt {attempt + 1}/{retries}): {e}")
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(2)

