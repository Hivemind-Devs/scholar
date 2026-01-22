from app.data_access.repositories.base import BaseRepository
from app.data_access.models import Collaboration

class CollaborationRepository(BaseRepository[Collaboration]):
    def __init__(self, session):
        super().__init__(Collaboration, session)

