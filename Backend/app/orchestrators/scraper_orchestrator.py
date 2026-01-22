import logging
from typing import List, Dict, Any
from app.services.scraper.service import ScraperService
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.data_access.repositories.university_repository import UniversityRepository
from app.data_access.repositories.department_repository import DepartmentRepository
from app.data_access.models import Scholar, University, Department

logger = logging.getLogger(__name__)

class ScraperOrchestrator:
    def __init__(
        self, 
        scraper_service: ScraperService, 
        scholar_repo: ScholarRepository,
        university_repo: UniversityRepository,
        department_repo: DepartmentRepository
    ):
        self.scraper_service = scraper_service
        self.scholar_repo = scholar_repo
        self.university_repo = university_repo
        self.department_repo = department_repo

    async def scrape_and_save_all_universities(self):
        """
        Scrapes the main university list and saves all found universities to the database.
        """
        logger.info("Starting to scrape all universities list...")
        universities_data = await self.scraper_service.scrape_universities()
        results = {
            "universities_found": len(universities_data),
            "universities_saved": 0,
            "errors": []
        }

        for uni_data in universities_data:
            try:
                name = uni_data.get("university_name")

                

                university = await self.university_repo.get_by_name(name)
                if not university:
                    await self.university_repo.create(
                        name=name,
                        location=uni_data.get("city_name"),
                        website_url=uni_data.get("department_url")
                    )
                    results["universities_saved"] += 1
            except Exception as e:
                error_msg = f"Error saving {uni_data.get('university_name')}: {str(e)}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        logger.info(f"Finished scraping universities. Saved {results['universities_saved']} new universities.")
        return results

    async def scrape_and_save_all_departments(self):
        """
        Iterates through all universities in the database, scrapes their departments,
        and saves them to the database.
        """
        logger.info("Starting to scrape departments for all universities...")
        universities = await self.university_repo.get_all(limit=1000)
        
        if not universities:
            logger.warning("No universities found in database. Please run university list scraper first.")
            return {"error": "No universities found in database. Run /scraper/universities/list first."}

        results = {
            "universities_processed": 0,
            "departments_found": 0,
            "departments_saved": 0,
            "errors": []
        }

        for university in universities:
            if not university.website_url:
                logger.warning(f"Skipping {university.name} - No website URL")
                continue
            
            try:
                logger.info(f"Scraping departments for: {university.name} ({university.website_url})")
                departments_data = await self.scraper_service.scrape_university_departments(university.website_url)
                
                if not departments_data:
                    logger.warning(f"No departments found for {university.name}")
                
                results["departments_found"] += len(departments_data)
                
                for dept_data in departments_data:
                    dept_name = dept_data["name"]
                    dept_url = dept_data["url"]


                    department = await self.department_repo.get_by_name_and_university(dept_name, university.university_id)
                    if not department:
                        await self.department_repo.create(
                            name=dept_name, 
                            university_id=university.university_id,
                            url=dept_url
                        )
                        results["departments_saved"] += 1
                
                results["universities_processed"] += 1
                
            except Exception as e:
                error_msg = f"Error processing {university.name}: {str(e)}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        logger.info(f"Finished scraping departments. Processed {results['universities_processed']} universities.")
        return results

    async def scrape_and_save_all_scholars(self):
        """
        Iterates through all DEPARTMENTS in the database, scrapes their scholars,
        and saves them to the database.
        """
        logger.info("Starting to scrape scholars for all departments...")

        departments = await self.department_repo.get_all(limit=10000) 
        
        if not departments:
            logger.warning("No departments found in database. Please run department scraper first.")
            return {"error": "No departments found in database."}

        results = {
            "departments_processed": 0,
            "scholars_found": 0,
            "scholars_saved": 0,
            "errors": []
        }
        
        logger.info(f"Scraping scholars for {len(departments)} departments")

        for department in departments:
            if not department.url:
                continue
            

            university_name = ""
            if department.university:
                 university_name = department.university.name
            
            try:

                scholars_data = await self.scraper_service.scrape_department_scholars(department.url, university_name)
                
                results["scholars_found"] += len(scholars_data)
                
                for s_data in scholars_data:
                    try:
                        yok_id = s_data.get("yok_id")
                        if not yok_id:
                            logger.warning(f"Skipping scholar without YOK ID: {s_data.get('full_name')}")
                            continue


                        existing_scholar = await self.scholar_repo.get_by_yok_id(yok_id)
                        
                        scholar_data = {
                            "yok_id": yok_id,
                            "full_name": s_data.get("full_name"),
                            "title": s_data.get("title"),
                            "department_id": department.department_id,
                            "institution": s_data.get("institution", university_name),
                            "department": s_data.get("department", department.name),
                            "research_areas": s_data.get("research_keywords", []),
                            "email": s_data.get("email"),
                            "profile_url": s_data.get("profile_url")
                        }

                        if existing_scholar:
                            await self.scholar_repo.update(existing_scholar.scholar_id, **scholar_data)
                        else:
                            await self.scholar_repo.create(**scholar_data)
                            results["scholars_saved"] += 1
                        
                    except Exception as e:
                        logger.error(f"Error saving scholar {s_data.get('full_name')}: {e}")
                
                results["departments_processed"] += 1
                
            except Exception as e:
                error_msg = f"Error processing department {department.name}: {str(e)}"
                logger.error(error_msg)
                results["errors"].append(error_msg)

        logger.info(f"Finished scraping scholars. Saved/Updated {results['scholars_saved']} scholars.")
        return results

    async def scrape_and_save_university(self, university_name: str, department_url_base: str):
        """
        Orchestrates the scraping of a university:
        1. Ensure University exists in DB
        2. Find departments
        3. Ensure Departments exist in DB
        4. For each department, find scholars
        5. Save scholars to DB, linked to Department
        """


        pass
