from app.data_access.repositories.base import BaseRepository
from app.data_access.models import EducationHistory

class EducationHistoryRepository(BaseRepository[EducationHistory]):
    def __init__(self, session):
        super().__init__(EducationHistory, session)

