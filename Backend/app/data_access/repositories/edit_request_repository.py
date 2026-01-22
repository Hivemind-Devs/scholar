from app.data_access.repositories.base import BaseRepository
from app.data_access.models import EditRequest

class EditRequestRepository(BaseRepository[EditRequest]):
    def __init__(self, session):
        super().__init__(EditRequest, session)

