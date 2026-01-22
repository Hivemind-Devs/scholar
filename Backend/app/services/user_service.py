from typing import Optional, List
from uuid import UUID
import json
from app.data_access.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.services.embedding_service import EmbeddingService

class UserService:
    def __init__(self, user_repo: UserRepository, embedding_service: Optional[EmbeddingService] = None):
        self.user_repo = user_repo
        self.embedding_service = embedding_service or EmbeddingService()

    async def create_user(self, user_in: UserCreate):
        existing_user = await self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        hashed_password = get_password_hash(user_in.password)
        
        return await self.user_repo.create(
            email=user_in.email,
            hashed_password=hashed_password,
            full_name=user_in.full_name,
            is_active=user_in.is_active,
            role="USER"
        )

    async def get_user(self, user_id: UUID):
        return await self.user_repo.get(user_id)
    
    async def get_by_email(self, email: str):
        return await self.user_repo.get_by_email(email)
    
    async def get_by_oauth(self, provider: str, oauth_id: str):
        """Get user by OAuth provider and OAuth ID."""
        return await self.user_repo.get_by_oauth(provider, oauth_id)
    
    async def create_oauth_user(
        self, 
        email: str, 
        full_name: str, 
        provider: str, 
        oauth_id: str
    ):
        """Create a new user from OAuth authentication."""

        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:

            if not existing_user.oauth_provider:
                existing_user.oauth_provider = provider
                existing_user.oauth_id = oauth_id
                await self.user_repo.session.commit()
                await self.user_repo.session.refresh(existing_user)
            return existing_user
        

        existing_oauth_user = await self.user_repo.get_by_oauth(provider, oauth_id)
        if existing_oauth_user:
            return existing_oauth_user
        

        return await self.user_repo.create(
            email=email,
            full_name=full_name,
            oauth_provider=provider,
            oauth_id=oauth_id,
            hashed_password=None,
            role="USER",
            is_active=True
        )

    async def get_users(self, skip: int = 0, limit: int = 100):
        return await self.user_repo.get_all(skip, limit)
    
    async def authenticate(self, email: str, password: str):
        user = await self.user_repo.get_by_email(email)
        if not user:
            return None

        if not user.hashed_password:
             return None
             
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    async def update_user(self, user_id: UUID, user_in: UserUpdate):
        user = await self.user_repo.get(user_id)
        if not user:
            return None
        
        update_data = user_in.model_dump(exclude_unset=True)
        
        if "password" in update_data and update_data["password"]:
            hashed_password = get_password_hash(update_data["password"])
            update_data["hashed_password"] = hashed_password
            del update_data["password"]
            
        return await self.user_repo.update(user_id, **update_data)

    async def delete_user(self, user_id: UUID) -> bool:
        return await self.user_repo.delete(user_id)

    async def update_research_interests(
        self, 
        user_id: UUID, 
        interests: List[str],
        valid_areas: List[str]
    ):
        valid_areas_lower = {area.lower(): area for area in valid_areas}
        invalid_interests = []
        normalized_interests = []
        
        for interest in interests:
            interest_lower = interest.lower()
            if interest_lower in valid_areas_lower:
                normalized_interests.append(valid_areas_lower[interest_lower])
            else:
                invalid_interests.append(interest)
        
        if invalid_interests:
            raise ValueError(
                f"Invalid research interests: {', '.join(invalid_interests)}. "
                f"Please select from the available research areas."
            )
        
        interests_json = json.dumps(normalized_interests)
        
        updated_user = await self.user_repo.update(user_id, research_interests=interests_json)
        
        if updated_user and normalized_interests:
            user_vector = self.embedding_service.generate_embedding_from_list(normalized_interests)
            if user_vector:
                await self.user_repo.update_user_vector(user_id, user_vector)
        
        return updated_user
    
    def get_user_interests(self, user) -> List[str]:
        if not user.research_interests:
            return []
        
        try:
            return json.loads(user.research_interests)
        except (json.JSONDecodeError, TypeError):
            return []
    
    async def add_research_interest(
        self,
        user_id: UUID,
        interest: str,
        valid_areas: List[str]
    ):
        """Add a single research interest to user's existing interests."""
        user = await self.user_repo.get(user_id)
        if not user:
            return None
        

        current_interests = self.get_user_interests(user)
        

        interest_clean = interest.strip()
        if not interest_clean:
            raise ValueError("Interest cannot be empty")
        
        valid_areas_lower = {area.lower(): area for area in valid_areas}
        interest_lower = interest_clean.lower()
        
        if interest_lower not in valid_areas_lower:
            raise ValueError(
                f"Invalid research interest: '{interest_clean}'. "
                f"Please select from the available research areas."
            )
        

        normalized_interest = valid_areas_lower[interest_lower]
        if normalized_interest.lower() in [i.lower() for i in current_interests]:
            raise ValueError(f"Research interest '{normalized_interest}' is already in your list")
        

        updated_interests = current_interests + [normalized_interest]
        

        if len(updated_interests) > 15:
            raise ValueError("Maximum 15 research interests allowed")
        
        interests_json = json.dumps(updated_interests)
        updated_user = await self.user_repo.update(user_id, research_interests=interests_json)
        
        if updated_user:
            user_vector = self.embedding_service.generate_embedding_from_list(updated_interests)
            if user_vector:
                await self.user_repo.update_user_vector(user_id, user_vector)
        
        return updated_user
    
    async def remove_research_interest(
        self,
        user_id: UUID,
        interest: str
    ):
        """Remove a single research interest from user's existing interests."""
        user = await self.user_repo.get(user_id)
        if not user:
            return None
        

        current_interests = self.get_user_interests(user)
        
        if not current_interests:
            raise ValueError("No research interests to remove")
        

        interest_clean = interest.strip()
        interest_lower = interest_clean.lower()
        
        updated_interests = [
            i for i in current_interests
            if i.lower() != interest_lower
        ]
        
        if len(updated_interests) == len(current_interests):
            raise ValueError(f"Research interest '{interest_clean}' not found in your list")
        
        interests_json = json.dumps(updated_interests)
        updated_user = await self.user_repo.update(user_id, research_interests=interests_json)
        
        if updated_user:
            if updated_interests:
                user_vector = self.embedding_service.generate_embedding_from_list(updated_interests)
                if user_vector:
                    await self.user_repo.update_user_vector(user_id, user_vector)
            else:

                await self.user_repo.update_user_vector(user_id, None)
        
        return updated_user