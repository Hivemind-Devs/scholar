from typing import Any
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from app.api import deps
from app.orchestrators.scraper_orchestrator import ScraperOrchestrator

router = APIRouter()

class ScrapeRequest(BaseModel):
    university_name: str
    department_url: str

@router.post("/universities/all", status_code=202)
async def scrape_all_universities_list(
    background_tasks: BackgroundTasks,
    orchestrator: ScraperOrchestrator = Depends(deps.get_scraper_orchestrator),
    current_user = Depends(deps.RoleChecker(["ADMIN"]))
) -> Any:
    """
    Initiate a background scraping job to fetch all universities from YÖK and store them in the database.
    
    This administrative endpoint triggers an asynchronous scraping process that retrieves the complete
    list of universities from the YÖK (Higher Education Council) system and saves them to the database.
    The operation runs in the background to avoid blocking the API response.
    
    Returns:
        A confirmation message indicating that the university scraping process has been started.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    background_tasks.add_task(orchestrator.scrape_and_save_all_universities)
    return {"message": "University list scraping started in background"}

@router.post("/departments/all", status_code=202)
async def scrape_all_departments(
    background_tasks: BackgroundTasks,
    orchestrator: ScraperOrchestrator = Depends(deps.get_scraper_orchestrator),
    current_user = Depends(deps.RoleChecker(["ADMIN"]))
) -> Any:
    """
    Initiate a background scraping job to retrieve departments for all universities in the database.
    
    This administrative endpoint triggers an asynchronous scraping process that iterates through
    all universities stored in the database and extracts their associated academic departments.
    The operation runs in the background to prevent API blocking during the potentially lengthy process.
    
    Returns:
        A confirmation message indicating that the department scraping process has been started.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    background_tasks.add_task(orchestrator.scrape_and_save_all_departments)
    return {"message": "Full department scraping started in background"}

@router.post("/scholar/all", status_code=202)
async def scrape_all_scholars(
    background_tasks: BackgroundTasks,
    orchestrator: ScraperOrchestrator = Depends(deps.get_scraper_orchestrator),
    current_user = Depends(deps.RoleChecker(["ADMIN"]))
) -> Any:
    """
    Initiate a background scraping job to retrieve scholars for all departments in the database.
    
    This administrative endpoint triggers an asynchronous scraping process that iterates through
    all academic departments stored in the database and extracts their associated scholars or
    academic staff members. The operation runs in the background as it may take a considerable
    amount of time to complete.
    
    Returns:
        A confirmation message indicating that the scholar scraping process has been started.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    background_tasks.add_task(orchestrator.scrape_and_save_all_scholars)
    return {"message": "Full scholar scraping started in background"}
