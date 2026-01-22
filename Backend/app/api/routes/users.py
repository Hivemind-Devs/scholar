from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from pydantic import BaseModel
from app.schemas.user import UserCreate, UserResponse, UserUpdate, ProfileUpdate
from app.schemas.saved_scholar import SavedScholarCreate, SavedScholarResponse
from app.schemas.scholar import ScholarListItemResponse
from app.data_access.repositories.saved_scholar_repository import SavedScholarRepository
from app.services.scholar_service import ScholarService
from app.schemas.research import UserInterestsUpdate, UserInterestsResponse, UserInterestAdd, UserInterestRemove
from app.orchestrators.user_orchestrator import UserOrchestrator
from app.services.research_areas_service import ResearchAreasService
from app.services.recommendation_service import RecommendationService
from app.services.log_service import LogService
from app.data_access.repositories.saved_search_repository import SavedSearchRepository
from app.api import deps

router = APIRouter()

@router.post("/", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    orchestrator: UserOrchestrator = Depends(deps.get_user_orchestrator)
):
    """
    Create a new user account in the system.
    
    This endpoint registers a new user with the provided information including email,
    password, and full name. The user account is created with default USER role and
    active status.
    
    Args:
        user_in: User creation data containing email, password, and full name.
    
    Returns:
        The newly created user object with all user information including assigned ID.
    
    Raises:
        HTTPException: 400 if the provided data is invalid (e.g., email already exists,
                       password does not meet requirements).
    """
    try:
        return await orchestrator.handle_create_user(user_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[UserResponse], dependencies=[Depends(deps.RoleChecker(["ADMIN"]))])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    orchestrator: UserOrchestrator = Depends(deps.get_user_orchestrator)
):
    """
    Retrieve a paginated list of all users in the system.
    
    This endpoint is restricted to administrators only and provides access to all
    registered users with pagination support. It is useful for administrative
    management and user overview purposes.
    
    Args:
        skip: Number of users to skip for pagination (default: 0).
        limit: Maximum number of users to return per page (default: 100).
    
    Returns:
        A list of user objects containing user information for the requested page.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    return await orchestrator.handle_list_users(skip=skip, limit=limit)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user = Depends(deps.get_current_active_user),
    user_service = Depends(deps.get_user_service),
    research_areas_service: ResearchAreasService = Depends(deps.get_research_areas_service),
    recommendation_service: RecommendationService = Depends(deps.get_recommendation_service),
    log_service: LogService = Depends(deps.get_log_service)
):
    """
    Update the current user's profile information.
    
    This endpoint allows authenticated users to update their profile details including
    full name, password, and research interests. When research interests are updated,
    recommendations are automatically recalculated in the background. Password changes
    are logged for security auditing purposes.
    
    Args:
        profile_data: Contains the fields to be updated (full_name, old_password,
                     new_password, researchInterests).
        request: HTTP request object for extracting client information for logging.
        background_tasks: FastAPI background tasks for asynchronous recommendation recalculation.
    
    Returns:
        The updated user object with all current profile information.
    
    Raises:
        HTTPException: 400 if the old password is incorrect, no valid fields are provided,
                       or password cannot be changed for OAuth users.
        HTTPException: 404 if the user account is not found.
        HTTPException: 500 if the update operation fails.
    """
    from app.core.security import verify_password
    
    updated_user = None
    has_updates = False
    

    if profile_data.old_password and profile_data.new_password:

        db_user = await user_service.get_user(current_user.user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        

        if not db_user.hashed_password:
            raise HTTPException(status_code=400, detail="Password cannot be changed for OAuth users")
        
        if not verify_password(profile_data.old_password, db_user.hashed_password):
            raise HTTPException(status_code=400, detail="Old password is incorrect")
        

        user_update = UserUpdate(password=profile_data.new_password)
        updated_user = await user_service.update_user(current_user.user_id, user_update)
        
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update password")
        
        has_updates = True
        

        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        await log_service.log_password_change(
            user_id=current_user.user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    

    if profile_data.full_name is not None:
        user_update = UserUpdate(full_name=profile_data.full_name)
        updated_user = await user_service.update_user(current_user.user_id, user_update)
        
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update profile")
        
        has_updates = True
    

    if profile_data.researchInterests is not None or profile_data.research_interests is not None:
        interests_str = profile_data.researchInterests or profile_data.research_interests
        if interests_str:
            import json

            try:
                interests = json.loads(interests_str) if isinstance(interests_str, str) else interests_str
                if not isinstance(interests, list):

                    interests = [i.strip() for i in interests_str.split(',') if i.strip()]
            except (json.JSONDecodeError, TypeError):

                interests = [i.strip() for i in interests_str.split(',') if i.strip()]
            
            if interests:
                valid_areas = await research_areas_service.get_unique_research_areas()
                
                interests_updated = await user_service.update_research_interests(
                    user_id=current_user.user_id,
                    interests=interests,
                    valid_areas=valid_areas
                )
                
                if interests_updated:
                    background_tasks.add_task(
                        recommendation_service.recalculate_recommendations,
                        current_user.user_id
                    )
                    
                    if not updated_user:
                        updated_user = interests_updated
                    
                    has_updates = True
    
    if not has_updates:
        raise HTTPException(status_code=400, detail="No valid profile fields to update")
    
    if not updated_user:

        updated_user = await user_service.get_user(current_user.user_id)
    
    return UserResponse(
        user_id=updated_user.user_id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        role=updated_user.role,
        research_interests=updated_user.research_interests,
        is_active=updated_user.is_active
    )

@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(deps.RoleChecker(["ADMIN"]))])
async def update_user_admin(
    user_id: UUID,
    user_in: UserUpdate,
    request: Request,
    orchestrator: UserOrchestrator = Depends(deps.get_user_orchestrator),
    log_service: LogService = Depends(deps.get_log_service),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Update any user's information (administrative function).
    
    This endpoint allows administrators to modify any user's account information including
    email, password, full name, and account status. Password changes are automatically
    logged for security auditing purposes.
    
    Args:
        user_id: Unique identifier of the user to update.
        user_in: User update data containing the fields to be modified.
        request: HTTP request object for extracting client information for logging.
    
    Returns:
        The updated user object with all current information.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
        HTTPException: 404 if the user with the provided ID is not found.
    """
    password_changed = user_in.password is not None and user_in.password != ""
    
    user = await orchestrator.handle_update_user(user_id, user_in)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    

    if password_changed:
        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        await log_service.log_password_change(
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    return user

@router.delete("/{user_id}", dependencies=[Depends(deps.RoleChecker(["ADMIN"]))])
async def delete_user_admin(
    user_id: UUID,
    orchestrator: UserOrchestrator = Depends(deps.get_user_orchestrator)
):
    """
    Permanently delete a user account from the system.
    
    This administrative endpoint allows administrators to remove user accounts from
    the system. This action is irreversible and should be used with caution.
    
    Args:
        user_id: Unique identifier of the user account to delete.
    
    Returns:
        A success message confirming that the user has been deleted.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
        HTTPException: 404 if the user with the provided ID is not found.
    """
    success = await orchestrator.handle_delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user = Depends(deps.get_current_active_user)
):
    """
    Retrieve the current authenticated user's profile information.
    
    This endpoint provides access to the authenticated user's own account information
    including email, full name, role, research interests, and account status.
    
    Returns:
        The current user's complete profile information.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
    """
    return current_user

@router.put("/interests", response_model=UserInterestsResponse)
async def update_user_interests(
    interests_update: UserInterestsUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user = Depends(deps.get_current_active_user),
    user_service = Depends(deps.get_user_service),
    research_areas_service: ResearchAreasService = Depends(deps.get_research_areas_service),
    recommendation_service: RecommendationService = Depends(deps.get_recommendation_service),
    log_service: LogService = Depends(deps.get_log_service)
):
    """
    Update the current user's research interests list.
    
    This endpoint allows users to replace their entire research interests list with
    a new set of interests. The update is validated against available research areas,
    and upon successful update, recommendations are automatically recalculated in the
    background. The action is logged for tracking purposes.
    
    Args:
        interests_update: Contains the new list of research interests to set.
        background_tasks: FastAPI background tasks for asynchronous recommendation recalculation.
        request: HTTP request object for extracting client information for logging.
    
    Returns:
        The updated list of research interests for the current user.
    
    Raises:
        HTTPException: 400 if any of the provided interests are not valid research areas.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the user account is not found.
        HTTPException: 500 if the update operation fails.
    """
    try:
        valid_areas = await research_areas_service.get_unique_research_areas()
        
        updated_user = await user_service.update_research_interests(
            user_id=current_user.user_id,
            interests=interests_update.interests,
            valid_areas=valid_areas
        )
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        

        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        interests = user_service.get_user_interests(updated_user)
        await log_service.log_interest_update(
            user_id=current_user.user_id,
            action="UPDATE",
            interests=interests,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        background_tasks.add_task(
            recommendation_service.recalculate_recommendations,
            current_user.user_id
        )
        
        return UserInterestsResponse(interests=interests)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update interests: {str(e)}")

@router.get("/me/interests", response_model=UserInterestsResponse)
async def get_user_interests(
    current_user = Depends(deps.get_current_active_user),
    user_service = Depends(deps.get_user_service)
):
    """
    Retrieve the current user's research interests.
    
    This endpoint provides access to the authenticated user's list of research interests
    or areas of focus. The interests are used for generating personalized scholar
    recommendations.
    
    Returns:
        A response object containing the user's current research interests list.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
    """
    interests = user_service.get_user_interests(current_user)
    return UserInterestsResponse(interests=interests)

@router.post("/me/interests", response_model=UserInterestsResponse)
async def add_user_interest(
    interest_data: UserInterestAdd,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user = Depends(deps.get_current_active_user),
    user_service = Depends(deps.get_user_service),
    research_areas_service: ResearchAreasService = Depends(deps.get_research_areas_service),
    recommendation_service: RecommendationService = Depends(deps.get_recommendation_service),
    log_service: LogService = Depends(deps.get_log_service)
):
    """
    Add a single research interest to the current user's interests list.
    
    This endpoint allows users to add one new research interest to their existing list.
    The interest is validated against available research areas, and if successfully added,
    recommendations are automatically recalculated in the background. The action is logged
    for tracking purposes.
    
    Args:
        interest_data: Contains the research interest name to be added.
        background_tasks: FastAPI background tasks for asynchronous recommendation recalculation.
        request: HTTP request object for extracting client information for logging.
    
    Returns:
        The updated list of research interests including the newly added interest.
    
    Raises:
        HTTPException: 400 if the provided interest is not a valid research area or already exists.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the user account is not found.
        HTTPException: 500 if the operation fails.
    """
    try:
        valid_areas = await research_areas_service.get_unique_research_areas()
        
        updated_user = await user_service.add_research_interest(
            user_id=current_user.user_id,
            interest=interest_data.interest,
            valid_areas=valid_areas
        )
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        

        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        interests = user_service.get_user_interests(updated_user)
        await log_service.log_interest_update(
            user_id=current_user.user_id,
            action="ADD",
            interests=interests,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        background_tasks.add_task(
            recommendation_service.recalculate_recommendations,
            current_user.user_id
        )
        
        return UserInterestsResponse(interests=interests)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add interest: {str(e)}")

@router.delete("/me/interests", response_model=UserInterestsResponse)
async def remove_user_interest(
    request: Request,
    interest: str = Query(..., description="Research interest to remove"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user = Depends(deps.get_current_active_user),
    user_service = Depends(deps.get_user_service),
    recommendation_service: RecommendationService = Depends(deps.get_recommendation_service),
    log_service: LogService = Depends(deps.get_log_service)
):
    """
    Remove a single research interest from the current user's interests list.
    
    This endpoint allows users to remove one research interest from their existing list.
    The interest is removed from the user's profile, and recommendations are automatically
    recalculated in the background. The action is logged for tracking purposes.
    
    Args:
        interest: The name of the research interest to be removed (provided as query parameter).
        background_tasks: FastAPI background tasks for asynchronous recommendation recalculation.
        request: HTTP request object for extracting client information for logging.
    
    Returns:
        The updated list of research interests after removal.
    
    Raises:
        HTTPException: 400 if the provided interest does not exist in the user's interests.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the user account is not found.
        HTTPException: 500 if the operation fails.
    """
    try:
        updated_user = await user_service.remove_research_interest(
            user_id=current_user.user_id,
            interest=interest
        )
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        

        ip_address = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        interests = user_service.get_user_interests(updated_user)
        await log_service.log_interest_update(
            user_id=current_user.user_id,
            action="REMOVE",
            interests=interests,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        background_tasks.add_task(
            recommendation_service.recalculate_recommendations,
            current_user.user_id
        )
        
        return UserInterestsResponse(interests=interests)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove interest: {str(e)}")


class SavedSearchCreate(BaseModel):
    name: Optional[str] = None
    query_params: Dict[str, Any]
    result_snapshot: Optional[int] = None


class SavedSearchResponse(BaseModel):
    search_id: UUID
    user_id: UUID
    name: Optional[str] = None
    query_params: Dict[str, Any]
    result_snapshot: Optional[int] = None
    created_at: str

    class Config:
        from_attributes = True


class SavedSearchUpdate(BaseModel):
    name: Optional[str] = None
    query_params: Optional[Dict[str, Any]] = None
    result_snapshot: Optional[int] = None


@router.get("/saved-searches", response_model=List[SavedSearchResponse])
async def get_saved_searches(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    current_user = Depends(deps.get_current_active_user),
    saved_search_repo: SavedSearchRepository = Depends(deps.get_saved_search_repository)
):
    """
    Retrieve all saved searches for the current authenticated user.
    
    This endpoint provides access to the user's saved search queries, allowing them to
    quickly access previously used search parameters. Results are paginated and ordered
    by creation date with the most recent searches appearing first.
    
    Args:
        skip: Number of saved searches to skip for pagination (default: 0).
        limit: Maximum number of saved searches to return per page (between 1 and 100).
    
    Returns:
        A list of saved search objects containing search parameters, names, result snapshots,
        and creation timestamps.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
    """
    searches = await saved_search_repo.get_by_user(current_user.user_id, skip=skip, limit=limit)
    
    return [
        SavedSearchResponse(
            search_id=search.search_id,
            user_id=search.user_id,
            name=search.name,
            query_params=search.query_params if search.query_params else {},
            result_snapshot=search.result_snapshot,
            created_at=search.created_at.isoformat() if search.created_at else ""
        )
        for search in searches
    ]


@router.get("/saved-searches/{search_id}", response_model=SavedSearchResponse)
async def get_saved_search(
    search_id: UUID,
    current_user = Depends(deps.get_current_active_user),
    saved_search_repo: SavedSearchRepository = Depends(deps.get_saved_search_repository)
):
    """
    Retrieve detailed information about a specific saved search.
    
    This endpoint provides access to a single saved search identified by its unique ID.
    Users can only access their own saved searches, ensuring data privacy and security.
    
    Args:
        search_id: Unique identifier of the saved search to retrieve.
    
    Returns:
        The complete saved search object with all search parameters and metadata.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the saved search is not found or does not belong to the current user.
    """
    search = await saved_search_repo.get_by_user_and_id(current_user.user_id, search_id)
    
    if not search:
        raise HTTPException(status_code=404, detail="Saved search not found")
    
    return SavedSearchResponse(
        search_id=search.search_id,
        user_id=search.user_id,
        name=search.name,
        query_params=search.query_params if search.query_params else {},
        result_snapshot=search.result_snapshot,
        created_at=search.created_at.isoformat() if search.created_at else ""
    )


@router.post("/saved-searches", response_model=SavedSearchResponse)
async def create_saved_search(
    search_data: SavedSearchCreate,
    current_user = Depends(deps.get_current_active_user),
    saved_search_repo: SavedSearchRepository = Depends(deps.get_saved_search_repository)
):
    """
    Create a new saved search for the current user.
    
    This endpoint allows users to save their search queries with optional names and
    result snapshots. Saved searches enable users to quickly repeat previous searches
    without manually re-entering all search parameters.
    
    Args:
        search_data: Contains the search parameters, optional name, and optional
                    result snapshot count to be saved.
    
    Returns:
        The newly created saved search object with assigned ID and creation timestamp.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
    """
    from app.data_access.models import SavedSearch
    
    new_search = SavedSearch(
        user_id=current_user.user_id,
        name=search_data.name,
        query_params=search_data.query_params,
        result_snapshot=search_data.result_snapshot
    )
    
    saved_search_repo.session.add(new_search)
    await saved_search_repo.session.commit()
    await saved_search_repo.session.refresh(new_search)
    
    return SavedSearchResponse(
        search_id=new_search.search_id,
        user_id=new_search.user_id,
        name=new_search.name,
        query_params=new_search.query_params if new_search.query_params else {},
        result_snapshot=new_search.result_snapshot,
        created_at=new_search.created_at.isoformat() if new_search.created_at else ""
    )


@router.delete("/saved-searches/{search_id}")
async def delete_saved_search(
    search_id: UUID,
    current_user = Depends(deps.get_current_active_user),
    saved_search_repo: SavedSearchRepository = Depends(deps.get_saved_search_repository)
):
    """
    Delete a saved search by its unique identifier.
    
    This endpoint allows users to remove saved searches they no longer need. Only the
    user who owns the saved search can delete it, ensuring proper access control.
    
    Args:
        search_id: Unique identifier of the saved search to delete.
    
    Returns:
        A success message confirming that the saved search has been deleted.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the saved search is not found or does not belong to the current user.
    """
    search = await saved_search_repo.get_by_user_and_id(current_user.user_id, search_id)
    
    if not search:
        raise HTTPException(status_code=404, detail="Saved search not found")
    
    await saved_search_repo.session.delete(search)
    await saved_search_repo.session.commit()
    
    return {"message": "Saved search deleted successfully"}


@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: UUID,
    orchestrator: UserOrchestrator = Depends(deps.get_user_orchestrator),
    current_user = Depends(deps.get_current_active_user)
):
    """
    Retrieve user information for a specific user by ID.
    
    This endpoint allows authenticated users to access user profile information for
    a specified user. The exact information returned may vary based on user permissions
    and privacy settings.
    
    Args:
        user_id: Unique identifier of the user whose information is to be retrieved.
    
    Returns:
        The user object containing profile information including email, full name,
        role, and research interests.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the user with the provided ID is not found.
    """
    user = await orchestrator.handle_get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user




@router.get("/me/saved-scholars", response_model=List[SavedScholarResponse])
async def get_saved_scholars(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
    saved_scholar_repo: SavedScholarRepository = Depends(deps.get_saved_scholar_repository)
):
    """
    Retrieve all scholars saved by the current authenticated user.
    
    This endpoint provides access to the user's saved scholar list with complete scholar
    information including academic metrics, publications, and images. Results are paginated
    to manage large collections efficiently.
    
    Args:
        skip: Number of saved scholars to skip for pagination (default: 0).
        limit: Maximum number of saved scholars to return per page (default: 100).
    
    Returns:
        A list of saved scholar objects containing complete scholar information along with
        user notes and save timestamps.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
    """
    saved_scholars = await saved_scholar_repo.get_by_user(current_user.user_id, skip, limit)
    
    response = []
    for saved in saved_scholars:
        scholar = saved.scholar
        if not scholar:
            continue
            

        image_data = None
        if scholar.image:
            image_data = scholar.image.image_data
        
        institution_name = scholar.institution
        department_name = scholar.department
        
        if scholar.department_rel:
            if scholar.department_rel.university:
                institution_name = scholar.department_rel.university.name
            department_name = scholar.department_rel.name
        
        publications = scholar.publications if scholar.publications else []
        publication_count = len(publications)
        citation_count = ScholarService.estimate_citation_count(publications)
        h_index = ScholarService.calculate_h_index(publications)
        
        scholar_item = ScholarListItemResponse(
            scholar_id=scholar.scholar_id,
            yok_id=scholar.yok_id,
            full_name=scholar.full_name,
            title=scholar.title,
            email=scholar.email,
            research_areas=scholar.research_areas if scholar.research_areas else [],
            institution=institution_name,
            department=department_name,
            image=image_data,
            h_index=h_index,
            citation_count=citation_count,
            publication_count=publication_count
        )
        
        response.append(SavedScholarResponse(
            saved_scholar_id=saved.saved_scholar_id,
            user_id=saved.user_id,
            scholar_id=saved.scholar_id,
            note=saved.note,
            created_at=saved.created_at,
            scholar=scholar_item
        ))
        
    return response

@router.post("/me/saved-scholars", response_model=SavedScholarResponse)
async def save_scholar(
    data: SavedScholarCreate,
    current_user = Depends(deps.get_current_active_user),
    saved_scholar_repo: SavedScholarRepository = Depends(deps.get_saved_scholar_repository),
    scholar_repo = Depends(deps.get_scholar_repository)
):
    """
    Save a scholar to the current user's saved scholars list.
    
    This endpoint allows authenticated users to add scholars to their personal saved list
    for quick access later. An optional note can be included with each saved scholar for
    personal organization purposes.
    
    Args:
        data: Contains the scholar ID to save and an optional note.
    
    Returns:
        The created saved scholar object with assigned ID and creation timestamp.
    
    Raises:
        HTTPException: 400 if the scholar is already saved by the user.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the specified scholar is not found in the system.
    """
    scholar = await scholar_repo.get(data.scholar_id)
    if not scholar:
        raise HTTPException(status_code=404, detail="Scholar not found")
        

    existing = await saved_scholar_repo.get_by_user_and_scholar(current_user.user_id, data.scholar_id)
    if existing:
        raise HTTPException(status_code=400, detail="Scholar already saved")
    
    saved = await saved_scholar_repo.create(
        user_id=current_user.user_id,
        scholar_id=data.scholar_id,
        note=data.note
    )
    



    

    saved_list = await saved_scholar_repo.get_by_user_and_scholar(current_user.user_id, data.scholar_id)



    




    
    return SavedScholarResponse(
        saved_scholar_id=saved.saved_scholar_id,
        user_id=saved.user_id,
        scholar_id=saved.scholar_id,
        note=saved.note,
        created_at=saved.created_at,
        scholar=None
    )

@router.delete("/me/saved-scholars/{scholar_id}")
async def unsave_scholar(
    scholar_id: UUID,
    current_user = Depends(deps.get_current_active_user),
    saved_scholar_repo: SavedScholarRepository = Depends(deps.get_saved_scholar_repository)
):
    """
    Remove a scholar from the current user's saved scholars list.
    
    This endpoint allows users to remove scholars from their saved list when they are
    no longer needed or relevant to their research interests.
    
    Args:
        scholar_id: Unique identifier of the scholar to remove from the saved list.
    
    Returns:
        A success message confirming that the scholar has been removed from the saved list.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the scholar is not found in the user's saved list.
    """
    existing = await saved_scholar_repo.get_by_user_and_scholar(current_user.user_id, scholar_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Saved scholar not found")
        
    await saved_scholar_repo.delete(existing.saved_scholar_id)
    return {"message": "Scholar removed from saved list"}

@router.get("/me/saved-scholars/{scholar_id}/check")
async def check_is_saved(
    scholar_id: UUID,
    current_user = Depends(deps.get_current_active_user),
    saved_scholar_repo: SavedScholarRepository = Depends(deps.get_saved_scholar_repository)
):
    """
    Check whether a specific scholar is saved in the current user's saved scholars list.
    
    This endpoint provides a quick way to determine if a scholar has already been saved
    by the authenticated user, which is useful for UI state management and preventing
    duplicate saves.
    
    Args:
        scholar_id: Unique identifier of the scholar to check.
    
    Returns:
        A dictionary containing a boolean 'is_saved' field indicating whether the scholar
        is present in the user's saved list.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
    """
    existing = await saved_scholar_repo.get_by_user_and_scholar(current_user.user_id, scholar_id)
    return {"is_saved": existing is not None}

@router.patch("/saved-searches/{search_id}", response_model=SavedSearchResponse)
async def update_saved_search(
    search_id: UUID,
    update_data: SavedSearchUpdate,
    current_user = Depends(deps.get_current_active_user),
    saved_search_repo: SavedSearchRepository = Depends(deps.get_saved_search_repository)
):
    """
    Update an existing saved search with new information.
    
    This endpoint allows users to modify their saved searches by updating the name,
    search query parameters, or result snapshot count. Only the fields provided in
    the update data will be modified.
    
    Args:
        search_id: Unique identifier of the saved search to update.
        update_data: Contains the fields to be updated (name, query_params, result_snapshot).
                    Fields not provided will remain unchanged.
    
    Returns:
        The updated saved search object with all current information.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the saved search is not found or does not belong to the current user.
    """
    search = await saved_search_repo.get_by_user_and_id(current_user.user_id, search_id)
    
    if not search:
        raise HTTPException(status_code=404, detail="Saved search not found")
    

    if update_data.name is not None:
        search.name = update_data.name
    
    if update_data.query_params is not None:
        search.query_params = update_data.query_params
    
    if update_data.result_snapshot is not None:
        search.result_snapshot = update_data.result_snapshot
    
    await saved_search_repo.session.commit()
    await saved_search_repo.session.refresh(search)
    
    return SavedSearchResponse(
        search_id=search.search_id,
        user_id=search.user_id,
        name=search.name,
        query_params=search.query_params if search.query_params else {},
        result_snapshot=search.result_snapshot,
        created_at=search.created_at.isoformat() if search.created_at else ""
    )
