from typing import Optional
from datetime import datetime, timedelta
import random
from app.data_access.repositories.user_repository import UserRepository
from app.core.security import get_password_hash
from app.services.email_service import EmailService


class PasswordResetService:
    def __init__(self, user_repo: UserRepository, email_service: Optional[EmailService] = None):
        self.user_repo = user_repo
        self.email_service = email_service or EmailService()
        self.code_length = 6
        self.code_expiry_minutes = 15

    def generate_reset_code(self) -> str:
        """Generate a random 6-digit code."""
        return ''.join([str(random.randint(0, 9)) for _ in range(self.code_length)])

    async def request_password_reset(self, email: str) -> bool:
        """
        Generate a password reset code and send it via email.
        Returns True if user exists and email was sent, False otherwise.
        """
        user = await self.user_repo.get_by_email(email)
        if not user:

            return True
        

        reset_code = self.generate_reset_code()
        expires_at = datetime.utcnow() + timedelta(minutes=self.code_expiry_minutes)
        

        from sqlalchemy import text
        try:
            query = text("""
                UPDATE "user" 
                SET password_reset_code = :code, password_reset_expires = :expires
                WHERE user_id = :user_id
            """)
            await self.user_repo.session.execute(query, {
                'code': reset_code,
                'expires': expires_at,
                'user_id': user.user_id
            })
            await self.user_repo.session.commit()
        except Exception as e:
            await self.user_repo.session.rollback()
            raise Exception(f"Failed to save reset code: {str(e)}")
        

        try:
            user_name = user.full_name or email.split('@')[0]
            await self.email_service.send_password_reset_email(
                recipient_name=user_name,
                recipient_email=email,
                reset_code=reset_code
            )
            return True
        except Exception as e:
            print(f"Failed to send password reset email: {e}")
            return False

    async def verify_reset_code(self, email: str, code: str) -> bool:
        """
        Verify if the reset code is valid for the given email.
        Returns True if code is valid, False otherwise.
        """
        user = await self.user_repo.get_by_email(email)
        if not user:
            return False
        
        if not user.password_reset_code or not user.password_reset_expires:
            return False
        

        if user.password_reset_code != code:
            return False
        

        if datetime.utcnow() > user.password_reset_expires:
            return False
        
        return True

    async def reset_password(self, email: str, code: str, new_password: str) -> bool:
        """
        Reset the user's password using the verification code.
        Returns True if successful, False otherwise.
        """

        if not await self.verify_reset_code(email, code):
            return False
        
        user = await self.user_repo.get_by_email(email)
        if not user:
            return False
        

        hashed_password = get_password_hash(new_password)
        from sqlalchemy import text
        try:
            query = text("""
                UPDATE "user" 
                SET hashed_password = :password, 
                    password_reset_code = NULL, 
                    password_reset_expires = NULL
                WHERE user_id = :user_id
            """)
            await self.user_repo.session.execute(query, {
                'password': hashed_password,
                'user_id': user.user_id
            })
            await self.user_repo.session.commit()
        except Exception as e:
            await self.user_repo.session.rollback()
            raise
        
        return True

