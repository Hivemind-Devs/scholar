from typing import List, Dict, Any
from app.services.scraper.university_scraper import UniversityScraper
from app.services.scraper.department_scraper import DepartmentScraper

class ScraperService:
    """
    Service layer for handling scraping operations.
    Delegates the actual scraping logic to specialized scraper classes.
    """

    def __init__(self):
        pass

    async def scrape_universities(self) -> List[Dict[str, Any]]:
        """
        Scrapes the list of all universities from the main academic search page.
        
        Returns:
            A list of dictionaries containing university details.
        """
        scraper = UniversityScraper()
        return await scraper.scrape()

    async def scrape_university_departments(self, department_url: str) -> List[Dict[str, str]]:
        """
        Scrapes the departments of a specific university.
        
        Args:
            department_url: The URL listing the university's departments.
            
        Returns:
            A list of departments with their names and URLs.
        """
        scraper = DepartmentScraper()
        return await scraper.scrape_departments(department_url)

    async def scrape_department_scholars(self, dept_url: str, university_name: str = "") -> List[Dict[str, Any]]:
        """
        Scrapes all scholars from a specific department page.
        
        Args:
            dept_url: The URL of the department page.
            university_name: The name of the university (for context).
            
        Returns:
            A list of dictionaries containing scholar information.
        """
        scraper = DepartmentScraper()
        return await scraper.scrape_scholars(dept_url, university_name)
