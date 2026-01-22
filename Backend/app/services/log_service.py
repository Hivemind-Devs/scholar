from typing import Optional, Dict, Any
from uuid import UUID
import json
from app.data_access.repositories.system_log_repository import SystemLogRepository
from app.data_access.models import SystemLog

class LogService:
    def __init__(self, log_repo: SystemLogRepository):
        self.log_repo = log_repo
    
    async def log_action(
        self,
        action_type: str,
        user_id: Optional[UUID] = None,
        target_entity: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log a system action."""
        details_str = None
        if details:
            try:
                details_str = json.dumps(details)
            except (TypeError, ValueError):
                details_str = str(details)
        
        log = SystemLog(
            user_id=user_id,
            action_type=action_type,
            target_entity=target_entity,
            details=details_str,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.log_repo.session.add(log)
        await self.log_repo.session.commit()
        return log
    
    async def log_login(self, user_id: UUID, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        """Log user login."""
        return await self.log_action(
            action_type="LOGIN",
            user_id=user_id,
            target_entity="User",
            details={"event": "user_login"},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def log_password_change(self, user_id: UUID, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        """Log password change."""
        return await self.log_action(
            action_type="PASSWORD_CHANGE",
            user_id=user_id,
            target_entity="User",
            details={"event": "password_changed"},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def log_interest_update(self, user_id: UUID, action: str, interests: list, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        """Log research interest update (add/remove/update)."""
        return await self.log_action(
            action_type=f"INTEREST_{action.upper()}",
            user_id=user_id,
            target_entity="User",
            details={"event": f"interest_{action.lower()}", "interests": interests},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def log_profile_update(self, user_id: UUID, updated_fields: list, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        """Log profile update."""
        return await self.log_action(
            action_type="PROFILE_UPDATE",
            user_id=user_id,
            target_entity="User",
            details={"event": "profile_updated", "updated_fields": updated_fields},
            ip_address=ip_address,
            user_agent=user_agent
        )

