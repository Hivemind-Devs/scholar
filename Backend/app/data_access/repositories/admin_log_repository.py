from app.data_access.repositories.base import BaseRepository
from app.data_access.models import AdminLog

class AdminLogRepository(BaseRepository[AdminLog]):
    def __init__(self, session):
        super().__init__(AdminLog, session)

