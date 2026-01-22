import logging
import re
from typing import List, Dict, Any, Optional
from playwright.async_api import Page, ElementHandle
from .base_scraper import BaseScraper
from .browser_manager import BrowserManager

logger = logging.getLogger(__name__)

class DepartmentScraper(BaseScraper):
    """
    Scrapes departments from a university page and scholars from a department page.
    """

    def __init__(self):
        super().__init__()
        self.base_url = "https://akademik.yok.gov.tr"

    async def scrape(self) -> Any:
        """
        Implementation of abstract base method.
        Since this scraper has multiple specific methods (scrape_departments, scrape_scholars),
        this default scrape method is not the primary entry point but required by BaseScraper.
        """
        raise NotImplementedError("Use specific methods: scrape_departments or scrape_scholars")

    async def scrape_departments(self, department_url: str) -> List[Dict[str, str]]:
        """
        Scrapes the list of departments from a university's main academic page.
        
        Args:
            department_url: The URL of the university's department list.
            
        Returns:
            A list of dictionaries, each containing department 'name', 'full_name', and 'url'.
        """
        if not department_url:
            return []

        async with BrowserManager() as browser_manager:
            page = await browser_manager.create_page()
            
            try:

                await browser_manager.goto_with_retry(page, department_url)
                

                await self.add_delay()


                dept_links = await page.query_selector_all("a[href*='birim=']")
                departments = []

                for link in dept_links:
                    try:
                        href = await link.get_attribute("href")
                        text = await link.text_content()
                        
                        if href and "birim=" in href:
                            dept_full_url = self.base_url + href

                            clean_name = self._extract_turkish_department_name(text.strip())
                            
                            departments.append({
                                "name": clean_name,
                                "full_name": text.strip(),
                                "url": dept_full_url,
                            })
                    except Exception as e:
                        logger.warning(f"Error extracting department link: {e}")
                        continue
                
                logger.info(f"Found {len(departments)} departments for URL: {department_url}")
                return departments

            except Exception as e:
                logger.error(f"Error scraping departments from {department_url}: {e}")
                return []

    async def scrape_scholars(self, dept_url: str, university_name: str = "") -> List[Dict[str, Any]]:
        """
        Scrapes the list of scholars from a specific department page.
        Handles pagination to retrieve all scholars.
        
        Args:
            dept_url: The URL of the department page.
            university_name: The name of the university (for data enrichment).
            
        Returns:
            A list of scholar dictionaries.
        """
        async with BrowserManager() as browser_manager:
            page = await browser_manager.create_page()
            scholars = []

            try:
                await browser_manager.goto_with_retry(page, dept_url)
                
                while True:

                    try:
                        await page.wait_for_selector("table#authorlistTb", timeout=10000)
                    except Exception:
                        logger.info(f"Scholar table not found at {dept_url}, stopping.")
                        break
                    

                    rows = await page.query_selector_all("tr[id^='authorInfo_']")
                    for row in rows:
                        try:
                            scholar = await self._parse_scholar_row(row, dept_url, university_name)
                            if scholar:
                                scholars.append(scholar)
                        except Exception as e:
                            logger.warning(f"Error parsing scholar row: {e}")
                            continue
                    


                    next_button = await page.query_selector("ul.pagination li.active + li:not(.disabled) a")
                    
                    if next_button:
                        await next_button.click()

                        await page.wait_for_load_state("domcontentloaded")
                        await self.add_delay()
                    else:
                        break
                
                logger.info(f"Scraped {len(scholars)} scholars from {dept_url}")
                return scholars
                
            except Exception as e:
                logger.error(f"Error scraping scholars from {dept_url}: {e}")
                return []

    async def _parse_scholar_row(self, row: ElementHandle, dept_url: str, university_name: str) -> Optional[Dict[str, Any]]:
        """
        Parses a single row from the scholar table to extract details.
        """

        yok_id_elem = await row.query_selector("span#spid2")
        yok_id = (await yok_id_elem.text_content()).strip() if yok_id_elem else None
        
        if not yok_id:
            return None


        main_info_td = await row.query_selector("td:nth-of-type(3)")
        if not main_info_td:
            return None


        full_name_elem = await main_info_td.query_selector("h4")
        full_name = (await full_name_elem.text_content()).strip() if full_name_elem else "Unknown Name"


        h6_elements = await main_info_td.query_selector_all("h6")
        raw_title = ""
        department_path = ""
        
        if len(h6_elements) > 0:
            raw_title = (await h6_elements[0].text_content()).strip()
        if len(h6_elements) > 1:
            department_path_raw = (await h6_elements[1].text_content()).strip()

            department_path = re.sub(r'\s*PR\.\s*$', '', department_path_raw).strip().strip('/')


        title = re.sub(r'\s*\(.*\)', '', raw_title).strip()


        email_td = await row.query_selector("td:nth-of-type(4)")
        email_text = await email_td.text_content() if email_td else ""
        email = self._extract_email(email_text)


        link_elem = await main_info_td.query_selector("a[href*='AkademisyenGorevOgrenimBilgileri']")
        profile_url = self.base_url + (await link_elem.get_attribute("href")) if link_elem else ""


        blue_badges = await main_info_td.query_selector_all("span.label.label-primary")
        research_areas = [(await badge.text_content()).strip() for badge in blue_badges]


        keyword_span = await main_info_td.query_selector("span:not([class])")
        if keyword_span:
            keywords_text = (await keyword_span.text_content()).strip()

            more_keywords = filter(None, (kw.strip() for kw in keywords_text.split(';')))
            research_areas.extend(more_keywords)



        faculty = ""
        department_name = ""
        path_parts = [part.strip() for part in department_path.split('/') if part.strip()]
        
        if len(path_parts) > 1:
            faculty = path_parts[1]
        if len(path_parts) > 2:
            department_name = path_parts[2]
        
        return {
            "yok_id": yok_id,
            "full_name": full_name,
            "title": title,
            "email": email,
            "profile_url": profile_url,
            "institution": university_name,
            "department": f"{faculty} / {department_name}" if faculty else department_name,
            "research_keywords": [area for area in research_areas if area],
        }

    def _extract_email(self, text: str) -> str:
        """
        Extracts an email address from text using regex.
        Handles [at] and standard @ formats.
        """
        if not text:
            return ""
        email_pattern = r'\b([a-zA-Z0-9._%+-]+)(?:\[at\]|@)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'
        match = re.search(email_pattern, text, re.IGNORECASE)
        return f"{match.group(1)}@{match.group(2)}".lower() if match else ""

    def _extract_turkish_department_name(self, full_name: str) -> str:
        """
        Extracts the Turkish part of a department name by removing English duplicates.
        e.g., "Bilgisayar Mühendisliği Computer Engineering" -> "Bilgisayar Mühendisliği"
        """
        try:
            text = full_name.strip()
            english_keywords = ['INSTITUTE', 'FACULTY', 'DEPARTMENT', 'SCHOOL', 'COLLEGE', 'CENTER', 'RECTORATE']
            

            min_index = len(text)
            for keyword in english_keywords:
                index = text.find(keyword)
                if index != -1 and index < min_index:
                    min_index = index
            

            if min_index < len(text):
                text = text[:min_index].strip()
            

            text_len = len(text)
            

            if text_len >= 4 and text_len % 2 == 0:
                mid = text_len // 2
                first_half = text[:mid]
                second_half = text[mid:]
                if first_half == second_half:
                    return first_half.strip()


            words = text.split()
            if len(words) >= 4:
                mid_word = len(words) // 2
                first_words = words[:mid_word]
                second_words = words[mid_word:]
                if first_words == second_words:
                    return " ".join(first_words).strip()

            return text.strip() if text.strip() else full_name

        except Exception:
            return full_name
