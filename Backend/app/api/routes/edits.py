from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.data_access.repositories.edit_request_repository import EditRequestRepository
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.api import deps
from sqlalchemy.future import select
from sqlalchemy import desc
from app.data_access.models import EditRequest

router = APIRouter()


class EditRequestCreate(BaseModel):
    scholarId: UUID
    changes: Dict[str, Any]
    reason: Optional[str] = None


class EditRequestResponse(BaseModel):
    request_id: UUID
    user_id: UUID
    scholar_id: UUID
    changes_json: Dict[str, Any]
    status: str
    submitted_at: str
    admin_reviewer_id: Optional[UUID] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=EditRequestResponse)
async def submit_edit(
    edit_data: EditRequestCreate,
    current_user = Depends(deps.get_current_active_user),
    edit_repo: EditRequestRepository = Depends(deps.get_edit_request_repository),
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository)
):
    """
    Submit an edit request for a scholar's information.
    
    This endpoint allows authenticated users to propose changes to scholar profiles.
    Submitted requests are reviewed by administrators before being applied to the
    scholar's record. Users can optionally provide a reason for their proposed changes.
    
    Args:
        edit_data: Contains the scholar ID, proposed changes as key-value pairs,
                  and an optional reason for the edit request.
    
    Returns:
        The created edit request object with status 'PENDING' and all request details.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the specified scholar is not found in the system.
    """
    scholar = await scholar_repo.get(edit_data.scholarId)
    if not scholar:
        raise HTTPException(status_code=404, detail="Scholar not found")
    

    changes_json = edit_data.changes.copy() if edit_data.changes else {}
    if edit_data.reason:
        changes_json["_reason"] = edit_data.reason
    
    new_request = EditRequest(
        user_id=current_user.user_id,
        scholar_id=edit_data.scholarId,
        changes_json=changes_json,
        status='PENDING'
    )
    
    edit_repo.session.add(new_request)
    await edit_repo.session.commit()
    await edit_repo.session.refresh(new_request)
    
    return EditRequestResponse(
        request_id=new_request.request_id,
        user_id=new_request.user_id,
        scholar_id=new_request.scholar_id,
        changes_json=new_request.changes_json if new_request.changes_json else {},
        status=new_request.status,
        submitted_at=new_request.submitted_at.isoformat() if new_request.submitted_at else "",
        admin_reviewer_id=new_request.admin_reviewer_id
    )


@router.get("/me", response_model=List[EditRequestResponse])
async def get_my_edit_requests(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, REJECTED"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    current_user = Depends(deps.get_current_active_user),
    edit_repo: EditRequestRepository = Depends(deps.get_edit_request_repository)
):
    """
    Retrieve all edit requests submitted by the current authenticated user.
    
    This endpoint provides access to the user's own edit request history with
    optional filtering by status. Results are paginated and sorted by submission
    date in descending order (most recent first).
    
    Args:
        status: Optional filter to show only requests with a specific status
               (PENDING, APPROVED, or REJECTED).
        skip: Number of requests to skip for pagination (default: 0).
        limit: Maximum number of requests to return per page (between 1 and 100).
    
    Returns:
        A list of edit request objects belonging to the current user, optionally
        filtered by status and paginated.
    
    Raises:
        HTTPException: 400 if an invalid status value is provided.
        HTTPException: 401 if the user is not authenticated.
    """
    query = select(EditRequest).filter(EditRequest.user_id == current_user.user_id)
    
    if status:
        if status.upper() not in ['PENDING', 'APPROVED', 'REJECTED']:
            raise HTTPException(status_code=400, detail="Invalid status. Must be PENDING, APPROVED, or REJECTED")
        query = query.filter(EditRequest.status == status.upper())
    
    query = query.order_by(desc(EditRequest.submitted_at)).offset(skip).limit(limit)
    
    result = await edit_repo.session.execute(query)
    requests = result.scalars().all()
    
    return [
        EditRequestResponse(
            request_id=req.request_id,
            user_id=req.user_id,
            scholar_id=req.scholar_id,
            changes_json=req.changes_json if req.changes_json else {},
            status=req.status,
            submitted_at=req.submitted_at.isoformat() if req.submitted_at else "",
            admin_reviewer_id=req.admin_reviewer_id
        )
        for req in requests
    ]


@router.get("/{request_id}", response_model=EditRequestResponse)
async def get_edit_request(
    request_id: UUID,
    current_user = Depends(deps.get_current_active_user),
    edit_repo: EditRequestRepository = Depends(deps.get_edit_request_repository)
):
    """
    Retrieve detailed information about a specific edit request.
    
    This endpoint provides complete details of an edit request including its status,
    proposed changes, submission date, and review information. Users can only access
    their own edit requests, ensuring privacy and data security.
    
    Args:
        request_id: Unique identifier of the edit request to retrieve.
    
    Returns:
        The complete edit request object with all details including status and changes.
    
    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 403 if the edit request does not belong to the current user.
        HTTPException: 404 if the edit request with the provided ID is not found.
    """
    result = await edit_repo.session.execute(
        select(EditRequest).filter(EditRequest.request_id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Edit request not found")
    

    if request.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only view your own edit requests")
    
    return EditRequestResponse(
        request_id=request.request_id,
        user_id=request.user_id,
        scholar_id=request.scholar_id,
        changes_json=request.changes_json if request.changes_json else {},
        status=request.status,
        submitted_at=request.submitted_at.isoformat() if request.submitted_at else "",
        admin_reviewer_id=request.admin_reviewer_id
    )
