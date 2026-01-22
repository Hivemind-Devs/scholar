from app.data_access.repositories.base import BaseRepository
from app.data_access.models import AcademicHistory

class AcademicHistoryRepository(BaseRepository[AcademicHistory]):
    def __init__(self, session):
        super().__init__(AcademicHistory, session)

