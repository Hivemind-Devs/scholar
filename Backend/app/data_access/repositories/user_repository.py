from sqlalchemy.future import select
from sqlalchemy import text
from app.data_access.repositories.base import BaseRepository
from app.data_access.models import User
from typing import List, Optional
import uuid

class UserRepository(BaseRepository[User]):
    def __init__(self, session):
        super().__init__(User, session)

    async def create(self, **kwargs) -> User:
        """
        Create a user instance, excluding profile_vector if it's None
        to avoid PostgreSQL vector type mismatch errors.
        """

        profile_vector = kwargs.pop('profile_vector', None)
        user_id = kwargs.pop('user_id', None)
        if user_id is None:
            user_id = uuid.uuid4()
        

        columns = ['user_id']
        param_placeholders = [':user_id']
        params = {'user_id': user_id}
        

        for key, value in kwargs.items():
            columns.append(key)
            param_name = f'param_{key}'
            param_placeholders.append(f':{param_name}')
            params[param_name] = value
        

        if profile_vector is not None:
            vector_str = '[' + ','.join(str(float(v)) for v in profile_vector) + ']'
            columns.append('profile_vector')

            param_placeholders.append(f"'{vector_str}'::vector")
        

        columns_str = ', '.join([f'"{col}"' for col in columns])
        values_str = ', '.join(param_placeholders)
        
        query = text(f"""
            INSERT INTO "user" ({columns_str})
            VALUES ({values_str})
            RETURNING user_id, created_at
        """)
        
        result = await self.session.execute(query, params)
        row = result.first()
        
        await self.session.commit()
        

        user = await self.get(user_id)
        return user

    async def get_by_email(self, email: str):
        result = await self.session.execute(select(User).filter(User.email == email))
        return result.scalars().first()
    
    async def get_by_oauth(self, provider: str, oauth_id: str):
        """Get user by OAuth provider and OAuth ID."""
        result = await self.session.execute(
            select(User).filter(
                User.oauth_provider == provider,
                User.oauth_id == oauth_id
            )
        )
        return result.scalars().first()
    
    async def update_user_vector(self, user_id, vector: Optional[List[float]]):
        try:
            if not vector:

                query = text("""
                    UPDATE "user" 
                    SET profile_vector = NULL
                    WHERE user_id = :user_id
                """)
                await self.session.execute(query, {"user_id": user_id})
                await self.session.commit()
                return await self.get(user_id)
            

            vector_str = '[' + ','.join(str(float(v)) for v in vector) + ']'
            

            query = text(f"""
                UPDATE "user" 
                SET profile_vector = '{vector_str}'::vector
                WHERE user_id = :user_id
            """)
            
            await self.session.execute(query, {"user_id": user_id})
            await self.session.commit()
            

            user = await self.get(user_id)
            return user
        except Exception as e:
            await self.session.rollback()
            raise e
