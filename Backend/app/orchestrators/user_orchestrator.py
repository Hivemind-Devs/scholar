from app.services.user_service import UserService
from app.services.email_service import EmailService
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from uuid import UUID
from typing import Optional

class UserOrchestrator:
    def __init__(self, user_service: UserService, email_service: Optional[EmailService] = None):
        self.user_service = user_service
        self.email_service = email_service or EmailService()

    async def handle_create_user(self, user_in: UserCreate) -> UserResponse:

        user = await self.user_service.create_user(user_in)
        


        try:
            user_name = user_in.full_name or user_in.email.split('@')[0]
            await self.email_service.send_welcome_email(
                recipient_name=user_name,
                recipient_email=user_in.email
            )
        except Exception as e:

            print(f"Failed to send welcome email to {user_in.email}: {e}")
        
        return user

    async def handle_update_user(self, user_id: UUID, user_in: UserUpdate) -> UserResponse:
        return await self.user_service.update_user(user_id, user_in)

    async def handle_delete_user(self, user_id: UUID) -> bool:
        return await self.user_service.delete_user(user_id)

    async def handle_get_user(self, user_id: UUID):
        return await self.user_service.get_user(user_id)

    async def handle_list_users(self, skip: int, limit: int):
        return await self.user_service.get_users(skip, limit)
