from app.data_access.repositories.base import BaseRepository
from app.data_access.models import SystemLog
from sqlalchemy.future import select
from sqlalchemy import func
from uuid import UUID
from typing import List, Optional
from datetime import datetime

class SystemLogRepository(BaseRepository[SystemLog]):
    def __init__(self, session):
        super().__init__(SystemLog, session)
    
    async def get_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[UUID] = None,
        action_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> tuple[List[SystemLog], int]:
        query = select(SystemLog)
        
        if user_id:
            query = query.filter(SystemLog.user_id == user_id)
        
        if action_type:
            query = query.filter(SystemLog.action_type == action_type)
        
        if start_date:
            query = query.filter(SystemLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(SystemLog.timestamp <= end_date)
        

        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.session.execute(count_query)
        total = count_result.scalar() or 0
        

        query = query.order_by(SystemLog.timestamp.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        logs = result.scalars().all()
        
        return list(logs), total

