from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.data_access.database import AsyncSessionLocal
from app.data_access.repositories.user_repository import UserRepository
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.data_access.repositories.university_repository import UniversityRepository
from app.services.university_service import UniversityService
from app.data_access.repositories.department_repository import DepartmentRepository
from app.data_access.repositories.education_history_repository import EducationHistoryRepository
from app.data_access.repositories.academic_history_repository import AcademicHistoryRepository
from app.data_access.repositories.recommendation_repository import RecommendationRepository
from app.data_access.repositories.saved_search_repository import SavedSearchRepository
from app.data_access.repositories.edit_request_repository import EditRequestRepository
from app.data_access.repositories.admin_log_repository import AdminLogRepository
from app.data_access.repositories.system_log_repository import SystemLogRepository
from app.data_access.repositories.saved_scholar_repository import SavedScholarRepository
from app.services.log_service import LogService
from app.services.user_service import UserService
from app.services.email_service import EmailService
from app.services.scraper.service import ScraperService
from app.services.research_areas_service import ResearchAreasService
from app.services.recommendation_service import RecommendationService
from app.services.embedding_service import EmbeddingService
from app.services.scholar_vector_service import ScholarVectorService
from app.orchestrators.user_orchestrator import UserOrchestrator
from app.orchestrators.scraper_orchestrator import ScraperOrchestrator
from app.schemas.token import TokenPayload
from app.data_access.models import User
from app.core.config import settings
from app.core.security import ALGORITHM
from jose import jwt, JWTError
from fastapi import HTTPException, status
from pydantic import ValidationError
from fastapi.security import OAuth2PasswordBearer
from uuid import UUID

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)

def get_scholar_repository(session: AsyncSession = Depends(get_db)) -> ScholarRepository:
    return ScholarRepository(session)

def get_university_repository(session: AsyncSession = Depends(get_db)) -> UniversityRepository:
    return UniversityRepository(session)

def get_university_service(
    university_repo: UniversityRepository = Depends(get_university_repository)
) -> UniversityService:
    return UniversityService(university_repo)

def get_department_repository(session: AsyncSession = Depends(get_db)) -> DepartmentRepository:
    return DepartmentRepository(session)

def get_education_history_repository(session: AsyncSession = Depends(get_db)) -> EducationHistoryRepository:
    return EducationHistoryRepository(session)

def get_academic_history_repository(session: AsyncSession = Depends(get_db)) -> AcademicHistoryRepository:
    return AcademicHistoryRepository(session)

from functools import lru_cache

@lru_cache()
def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()

def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository),
    embedding_service: EmbeddingService = Depends(get_embedding_service)
) -> UserService:
    return UserService(user_repo, embedding_service)

def get_scraper_service() -> ScraperService:
    return ScraperService()

def get_email_service() -> EmailService:
    return EmailService()

def get_user_orchestrator(
    user_service: UserService = Depends(get_user_service),
    email_service: EmailService = Depends(get_email_service)
) -> UserOrchestrator:
    return UserOrchestrator(user_service, email_service)

def get_scraper_orchestrator(
    scraper_service: ScraperService = Depends(get_scraper_service),
    scholar_repo: ScholarRepository = Depends(get_scholar_repository),
    university_repo: UniversityRepository = Depends(get_university_repository),
    department_repo: DepartmentRepository = Depends(get_department_repository)
) -> ScraperOrchestrator:

    return ScraperOrchestrator(scraper_service, scholar_repo, university_repo, department_repo)

def get_recommendation_repository(session: AsyncSession = Depends(get_db)) -> RecommendationRepository:
    return RecommendationRepository(session)

def get_research_areas_service(
    scholar_repo: ScholarRepository = Depends(get_scholar_repository)
) -> ResearchAreasService:
    return ResearchAreasService(scholar_repo)

def get_recommendation_service(
    recommendation_repo: RecommendationRepository = Depends(get_recommendation_repository),
    scholar_repo: ScholarRepository = Depends(get_scholar_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    user_service: UserService = Depends(get_user_service)
) -> RecommendationService:
    return RecommendationService(recommendation_repo, scholar_repo, user_repo, embedding_service, user_service)

def get_scholar_vector_service(
    scholar_repo: ScholarRepository = Depends(get_scholar_repository),
    embedding_service: EmbeddingService = Depends(get_embedding_service)
) -> ScholarVectorService:
    return ScholarVectorService(scholar_repo, embedding_service)

def get_saved_search_repository(session: AsyncSession = Depends(get_db)) -> SavedSearchRepository:
    return SavedSearchRepository(session)

def get_edit_request_repository(session: AsyncSession = Depends(get_db)) -> EditRequestRepository:
    return EditRequestRepository(session)

def get_admin_log_repository(session: AsyncSession = Depends(get_db)) -> AdminLogRepository:
    return AdminLogRepository(session)

def get_saved_scholar_repository(session: AsyncSession = Depends(get_db)) -> SavedScholarRepository:
    return SavedScholarRepository(session)

def get_system_log_repository(session: AsyncSession = Depends(get_db)) -> SystemLogRepository:
    return SystemLogRepository(session)

def get_log_service(
    log_repo: SystemLogRepository = Depends(get_system_log_repository)
) -> LogService:
    return LogService(log_repo)


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

async def get_current_user(
    token: str = Depends(reusable_oauth2),
    user_service: UserService = Depends(get_user_service)
) -> User:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    if token_data.sub is None:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
        
    try:
        user_uuid = UUID(token_data.sub)
    except ValueError:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token subject",
        )

    user = await user_service.get_user(user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Operation not permitted"
            )
        return user
