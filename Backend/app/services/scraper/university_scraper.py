import asyncio
import logging
from typing import Dict, List, Optional

from playwright.async_api import Page
from .base_scraper import BaseScraper
from .browser_manager import BrowserManager

logger = logging.getLogger(__name__)

class UniversityScraper(BaseScraper):
    """
    Scrapes the main list of universities from YÖK Akademik.
    It navigates to the university list view and extracts details for each institution.
    """
    

    UNIVERSITY_LIST_URL = "https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp"

    async def scrape(self) -> List[Dict]:
        """
        Main method to orchestrate the scraping process for universities.
        
        Returns:
            A list of dictionaries containing university details.
        """
        logger.info("Starting university list scraping.")
        all_universities = []

        async with BrowserManager() as browser_manager:
            page = await browser_manager.create_page()

            try:

                await browser_manager.goto_with_retry(page, self.UNIVERSITY_LIST_URL)
                logger.info("Navigated to university list page.")


                await self.add_delay()


                current_url = page.url
                if "universityListview" in current_url or "akademik" in current_url.lower():
                    logger.info("Successfully reached university list page.")
                    

                    universities_on_page = await self.extract_universities_from_page(page)
                    
                    if universities_on_page:
                        all_universities.extend(universities_on_page)
                        logger.info(f"Found {len(universities_on_page)} universities on the page.")
                    else:
                        logger.warning("No universities found on the list page.")
                else:
                    logger.warning("Did not reach the expected university list page.")

            except Exception as e:
                logger.error(f"Error scraping university list: {e}")

                return []

        logger.info(f"Scraping completed. Total universities found: {len(all_universities)}")
        return all_universities

    async def extract_universities_from_page(self, page: Page) -> List[Dict]:
        """
        Extracts university data from the table on the current page.
        
        Args:
            page: The Playwright page object.
            
        Returns:
            A list of dictionaries representing each university.
        """
        html_content = await page.content()
        tree = self.parse_html(html_content)
        universities_found = []


        possible_selectors = [
            "#universiteListTable tbody tr",
            ".table tbody tr",
            "table tbody tr"
        ]

        rows = []
        for selector in possible_selectors:
            rows = tree.css(selector)
            if rows:
                logger.debug(f"Found table using selector: {selector}")
                break

        if not rows:
            logger.warning("No table rows found with known selectors.")
            return universities_found

        logger.debug(f"Processing {len(rows)} table rows...")
        
        for row in rows:


            department_link_node = (
                row.css_first("td:nth-child(2) a") or
                row.css_first("td a") or
                row.css_first("a")
            )

            if not department_link_node:
                continue

            department_url = department_link_node.attributes.get('href', '')



            university_name = await self.safe_get_text(row, "td:nth-child(1)")

            city_name = await self.safe_get_text(row, "td:nth-child(2)")

            university_type = await self.safe_get_text(row, "td:nth-child(3)")

            year_text = await self.safe_get_text(row, "td:nth-child(4)", default="0")
            
            try:
                establishment_year = int(year_text)
            except ValueError:
                establishment_year = 0


            full_url = f"https://akademik.yok.gov.tr{department_url}" if department_url else ""

            data = {
                "university_name": university_name,
                "city_name": city_name,
                "university_type": university_type,
                "establishment_year": establishment_year,
                "department_url": full_url
            }
            universities_found.append(data)

        return universities_found
