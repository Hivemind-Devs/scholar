from typing import Dict, Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, BackgroundTasks, Query, HTTPException
from pydantic import BaseModel
from app.services.scholar_vector_service import ScholarVectorService
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.data_access.repositories.edit_request_repository import EditRequestRepository
from app.data_access.repositories.admin_log_repository import AdminLogRepository
from app.data_access.repositories.system_log_repository import SystemLogRepository
from app.data_access.repositories.user_repository import UserRepository
from app.data_access.models import SystemLog
from app.services.embedding_service import EmbeddingService
from app.api import deps
from sqlalchemy.future import select
from sqlalchemy import func, or_
from app.data_access.models import EditRequest, AdminLog, Scholar, User

router = APIRouter()

@router.post("/generate-scholar-vectors", response_model=Dict[str, Any])
async def generate_scholar_vectors(
    force_regenerate: bool = Query(False, description="Force regenerate vectors for all scholars"),
    batch_size: int = Query(100, ge=1, le=1000, description="Number of scholars to process per batch"),
    background_tasks: BackgroundTasks = None,
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository),
    embedding_service: EmbeddingService = Depends(deps.get_embedding_service)
):
    """
    Generate or regenerate embedding vectors for scholar profiles.
    
    This administrative endpoint initiates the generation of embedding vectors for scholar
    profiles, which are used for similarity matching and recommendation algorithms. The
    process can be executed synchronously or asynchronously in the background. Vectors
    are typically generated based on scholar research areas and publication content.
    
    Args:
        force_regenerate: If True, regenerates vectors for all scholars even if they already exist.
        batch_size: Number of scholars to process in each batch (between 1 and 1000).
        background_tasks: FastAPI background tasks handler. If provided, processing runs asynchronously.
    
    Returns:
        A dictionary containing a status message and either generation statistics (if synchronous)
        or confirmation that background processing has started (if asynchronous).
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    from app.services.scholar_vector_service import ScholarVectorService
    
    vector_service = ScholarVectorService(scholar_repo, embedding_service)
    
    if background_tasks:
        background_tasks.add_task(
            vector_service.generate_vectors_for_all_scholars,
            batch_size=batch_size,
            force_regenerate=force_regenerate
        )
        return {
            "message": "Vector generation started in background",
            "force_regenerate": force_regenerate,
            "batch_size": batch_size
        }
    else:
        stats = await vector_service.generate_vectors_for_all_scholars(
            batch_size=batch_size,
            force_regenerate=force_regenerate
        )
        return {
            "message": "Vector generation completed",
            "stats": stats
        }


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


class EditApprovalRequest(BaseModel):
    reason: Optional[str] = None


@router.get("/edits", response_model=List[EditRequestResponse])
async def get_edit_requests(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, APPROVED, REJECTED"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    edit_repo: EditRequestRepository = Depends(deps.get_edit_request_repository)
):
    """
    Retrieve all edit requests submitted by users with optional filtering.
    
    This administrative endpoint provides access to all edit requests in the system,
    allowing administrators to review and manage user-submitted changes to scholar
    profiles. Results can be filtered by status and are paginated for efficient browsing.
    
    Args:
        status: Optional filter to show only requests with a specific status
               (PENDING, APPROVED, or REJECTED).
        skip: Number of requests to skip for pagination (default: 0).
        limit: Maximum number of requests to return per page (between 1 and 100).
    
    Returns:
        A list of edit request objects, sorted by submission date in descending order,
        optionally filtered by status.
    
    Raises:
        HTTPException: 400 if an invalid status value is provided.
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    from sqlalchemy import desc
    
    query = select(EditRequest)
    
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


@router.get("/edits/pending", response_model=List[EditRequestResponse])
async def get_pending_edits(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    edit_repo: EditRequestRepository = Depends(deps.get_edit_request_repository)
):
    """
    Retrieve all pending edit requests requiring administrative review.
    
    This administrative endpoint provides a convenient way to access only the edit
    requests that are awaiting review. It is particularly useful for administrators
    to quickly identify requests that need attention.
    
    Args:
        skip: Number of requests to skip for pagination (default: 0).
        limit: Maximum number of requests to return per page (between 1 and 100).
    
    Returns:
        A list of pending edit request objects, sorted by submission date in
        descending order (most recent first).
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    from sqlalchemy import desc
    
    result = await edit_repo.session.execute(
        select(EditRequest)
        .filter(EditRequest.status == 'PENDING')
        .order_by(desc(EditRequest.submitted_at))
        .offset(skip)
        .limit(limit)
    )
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


@router.put("/edits/{edit_id}/approve", response_model=EditRequestResponse)
async def approve_edit(
    edit_id: UUID,
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    edit_repo: EditRequestRepository = Depends(deps.get_edit_request_repository),
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository),
    admin_log_repo: AdminLogRepository = Depends(deps.get_admin_log_repository)
):
    """
    Approve an edit request and apply the proposed changes to the scholar profile.
    
    This administrative endpoint allows administrators to review and approve edit requests
    submitted by users. Upon approval, the proposed changes are applied to the scholar's
    profile, and the action is logged for auditing purposes.
    
    Args:
        edit_id: Unique identifier of the edit request to approve.
    
    Returns:
        The updated edit request object with status changed to 'APPROVED' and
        the reviewer ID set to the current administrator.
    
    Raises:
        HTTPException: 400 if the edit request is not in PENDING status.
        HTTPException: 403 if the current user does not have administrator privileges.
        HTTPException: 404 if the edit request or associated scholar is not found.
    """
    result = await edit_repo.session.execute(
        select(EditRequest).filter(EditRequest.request_id == edit_id)
    )
    edit_request = result.scalar_one_or_none()
    
    if not edit_request:
        raise HTTPException(status_code=404, detail="Edit request not found")
    
    if edit_request.status != 'PENDING':
        raise HTTPException(status_code=400, detail="Edit request is not pending")
    
    scholar = await scholar_repo.get(edit_request.scholar_id)
    if not scholar:
        raise HTTPException(status_code=404, detail="Scholar not found")
    
    changes = edit_request.changes_json if edit_request.changes_json else {}

    for key, value in changes.items():
        if key != '_reason' and hasattr(scholar, key):
            setattr(scholar, key, value)
    
    edit_request.status = 'APPROVED'
    edit_request.admin_reviewer_id = current_user.user_id
    
    admin_log = AdminLog(
        admin_id=current_user.user_id,
        action_type='APPROVE_EDIT',
        target_entity='EditRequest',
        details=f"Approved edit request {edit_id} for scholar {edit_request.scholar_id}"
    )
    admin_log_repo.session.add(admin_log)
    
    await edit_repo.session.commit()
    await edit_repo.session.refresh(edit_request)
    
    return EditRequestResponse(
        request_id=edit_request.request_id,
        user_id=edit_request.user_id,
        scholar_id=edit_request.scholar_id,
        changes_json=edit_request.changes_json if edit_request.changes_json else {},
        status=edit_request.status,
        submitted_at=edit_request.submitted_at.isoformat() if edit_request.submitted_at else "",
        admin_reviewer_id=edit_request.admin_reviewer_id
    )


@router.put("/edits/{edit_id}/reject", response_model=EditRequestResponse)
async def reject_edit(
    edit_id: UUID,
    rejection_data: EditApprovalRequest,
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    edit_repo: EditRequestRepository = Depends(deps.get_edit_request_repository),
    admin_log_repo: AdminLogRepository = Depends(deps.get_admin_log_repository)
):
    """
    Reject an edit request with an optional reason.
    
    This administrative endpoint allows administrators to reject edit requests that
    do not meet approval criteria. An optional rejection reason can be provided to
    explain why the request was denied. The action is logged for auditing purposes.
    
    Args:
        edit_id: Unique identifier of the edit request to reject.
        rejection_data: Optional rejection reason to be stored with the request.
    
    Returns:
        The updated edit request object with status changed to 'REJECTED' and
        the reviewer ID set to the current administrator.
    
    Raises:
        HTTPException: 400 if the edit request is not in PENDING status.
        HTTPException: 403 if the current user does not have administrator privileges.
        HTTPException: 404 if the edit request is not found.
    """
    result = await edit_repo.session.execute(
        select(EditRequest).filter(EditRequest.request_id == edit_id)
    )
    edit_request = result.scalar_one_or_none()
    
    if not edit_request:
        raise HTTPException(status_code=404, detail="Edit request not found")
    
    if edit_request.status != 'PENDING':
        raise HTTPException(status_code=400, detail="Edit request is not pending")
    
    edit_request.status = 'REJECTED'
    edit_request.admin_reviewer_id = current_user.user_id
    

    if rejection_data.reason:
        changes_json = edit_request.changes_json if edit_request.changes_json else {}
        changes_json["_rejection_reason"] = rejection_data.reason
        edit_request.changes_json = changes_json
    
    reason = rejection_data.reason or "No reason provided"
    admin_log = AdminLog(
        admin_id=current_user.user_id,
        action_type='REJECT_EDIT',
        target_entity='EditRequest',
        details=f"Rejected edit request {edit_id} for scholar {edit_request.scholar_id}. Reason: {reason}"
    )
    admin_log_repo.session.add(admin_log)
    
    await edit_repo.session.commit()
    await edit_repo.session.refresh(edit_request)
    
    return EditRequestResponse(
        request_id=edit_request.request_id,
        user_id=edit_request.user_id,
        scholar_id=edit_request.scholar_id,
        changes_json=edit_request.changes_json if edit_request.changes_json else {},
        status=edit_request.status,
        submitted_at=edit_request.submitted_at.isoformat() if edit_request.submitted_at else "",
        admin_reviewer_id=edit_request.admin_reviewer_id
    )


class DuplicateScholarResponse(BaseModel):
    scholar_id: UUID
    full_name: str
    yok_id: Optional[str]
    institution: Optional[str]
    similarity_score: float


@router.get("/duplicates", response_model=List[List[DuplicateScholarResponse]])
async def get_duplicate_scholars(
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository)
):
    """
    Identify and retrieve groups of duplicate scholar records in the system.
    
    This administrative endpoint uses an optimized database query to efficiently detect
    duplicate scholar records based on normalized name matching and institution or
    identification number comparison. Results are grouped by duplicate clusters for
    easy review and merging operations.
    
    Returns:
        A list of duplicate groups, where each group is a list of scholar records
        that are considered duplicates. Scholars are grouped based on matching
        normalized names and either matching institutions or matching identification numbers.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    from sqlalchemy import text
    


    query = text("""
        WITH normalized_scholars AS (
            -- Normalize names and institutions for comparison
            SELECT 
                scholar_id,
                full_name,
                yok_id,
                institution,
                LOWER(TRIM(full_name)) as normalized_name,
                LOWER(TRIM(institution)) as normalized_institution
            FROM scholar
            WHERE full_name IS NOT NULL
        ),
        duplicate_pairs AS (
            -- Find pairs of scholars that are duplicates
            -- Criteria: Same normalized name AND (same institution OR same yok_id)
            SELECT DISTINCT
                LEAST(s1.scholar_id, s2.scholar_id) as group_leader_id,
                s1.scholar_id,
                s1.full_name,
                s1.yok_id,
                s1.institution
            FROM normalized_scholars s1
            INNER JOIN normalized_scholars s2 
                ON s1.normalized_name = s2.normalized_name
                AND s1.scholar_id != s2.scholar_id
            WHERE 
                -- Same normalized name (already matched in JOIN)
                -- AND either same institution or same yok_id
                (
                    (s1.normalized_institution = s2.normalized_institution 
                     AND s1.normalized_institution IS NOT NULL 
                     AND s2.normalized_institution IS NOT NULL)
                    OR 
                    (s1.yok_id = s2.yok_id 
                     AND s1.yok_id IS NOT NULL 
                     AND s2.yok_id IS NOT NULL)
                )
        )
        -- Group by group_leader_id and return all scholars in each duplicate group
        SELECT 
            dp.group_leader_id,
            dp.scholar_id,
            dp.full_name,
            dp.yok_id,
            dp.institution
        FROM duplicate_pairs dp
        ORDER BY dp.group_leader_id, dp.full_name
    """)
    
    result = await scholar_repo.session.execute(query)
    rows = result.all()
    

    groups = {}
    for row in rows:
        group_id = row.group_leader_id
        if group_id not in groups:
            groups[group_id] = []
        
        groups[group_id].append(DuplicateScholarResponse(
            scholar_id=row.scholar_id,
            full_name=row.full_name,
            yok_id=row.yok_id,
            institution=row.institution,
            similarity_score=0.9
        ))
    

    duplicates = [group for group in groups.values() if len(group) > 1]
    
    return duplicates


class MergeScholarsRequest(BaseModel):
    primaryId: UUID
    duplicateIds: List[UUID]


@router.post("/merge")
async def merge_scholars(
    merge_data: MergeScholarsRequest,
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository),
    admin_log_repo: AdminLogRepository = Depends(deps.get_admin_log_repository)
):
    """
    Merge duplicate scholar records into a primary scholar record.
    
    This administrative endpoint consolidates duplicate scholar records by transferring
    all publications from duplicate records to the primary scholar record. The duplicate
    records remain in the database but are effectively merged by reassigning their
    publications. The action is logged for auditing purposes.
    
    Args:
        merge_data: Contains the primary scholar ID and a list of duplicate scholar IDs
                   to be merged into the primary record.
    
    Returns:
        A success message confirming the number of duplicate records merged.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
        HTTPException: 404 if the primary scholar or any duplicate scholar is not found.
    """
    primary = await scholar_repo.get(merge_data.primaryId)
    if not primary:
        raise HTTPException(status_code=404, detail="Primary scholar not found")
    
    duplicates = []
    for dup_id in merge_data.duplicateIds:
        dup = await scholar_repo.get(dup_id)
        if not dup:
            raise HTTPException(status_code=404, detail=f"Duplicate scholar {dup_id} not found")
        duplicates.append(dup)
    
    for dup in duplicates:
        for pub in dup.publications:
            pub.scholar_id = primary.scholar_id
        
    admin_log = AdminLog(
        admin_id=current_user.user_id,
        action_type='MERGE_SCHOLARS',
        target_entity='Scholar',
        details=f"Merged {len(duplicates)} duplicate scholars into {primary.scholar_id}"
    )
    admin_log_repo.session.add(admin_log)
    
    await scholar_repo.session.commit()
    
    return {"message": f"Successfully merged {len(duplicates)} scholars into primary scholar"}


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    role_data: Dict[str, str],
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    user_repo: UserRepository = Depends(deps.get_user_repository),
    admin_log_repo: AdminLogRepository = Depends(deps.get_admin_log_repository)
):
    """
    Update a user's role in the system.
    
    This administrative endpoint allows administrators to change user roles between
    GUEST, USER, and ADMIN. The role change is logged for auditing and security purposes.
    
    Args:
        user_id: Unique identifier of the user whose role is to be updated.
        role_data: Dictionary containing the new role value (key: "role").
    
    Returns:
        A success message confirming the role change from the old role to the new role.
    
    Raises:
        HTTPException: 400 if the provided role is not valid (must be GUEST, USER, or ADMIN).
        HTTPException: 403 if the current user does not have administrator privileges.
        HTTPException: 404 if the user with the provided ID is not found.
    """
    user = await user_repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_role = role_data.get("role")
    if new_role not in ["GUEST", "USER", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    old_role = user.role
    user.role = new_role
    
    admin_log = AdminLog(
        admin_id=current_user.user_id,
        action_type='UPDATE_USER_ROLE',
        target_entity='User',
        details=f"Changed user {user_id} role from {old_role} to {new_role}"
    )
    admin_log_repo.session.add(admin_log)
    
    await user_repo.session.commit()
    
    return {"message": f"User role updated from {old_role} to {new_role}"}


class ActivityLogResponse(BaseModel):
    log_id: UUID
    admin_id: UUID
    action_type: str
    target_entity: str
    details: str
    timestamp: str

    class Config:
        from_attributes = True


@router.get("/logs", response_model=List[ActivityLogResponse])
async def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    admin_log_repo: AdminLogRepository = Depends(deps.get_admin_log_repository)
):
    """
    Retrieve administrative activity logs with pagination.
    
    This endpoint provides access to a comprehensive log of all administrative actions
    performed in the system. Logs include actions such as edit approvals, user role changes,
    and scholar merges. Results are sorted by timestamp in descending order.
    
    Args:
        skip: Number of log entries to skip for pagination (default: 0).
        limit: Maximum number of log entries to return per page (between 1 and 1000).
    
    Returns:
        A list of activity log entries containing details about administrative actions
        including admin ID, action type, target entity, details, and timestamp.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    result = await admin_log_repo.session.execute(
        select(AdminLog)
        .order_by(AdminLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    logs = result.scalars().all()
    
    return [
        ActivityLogResponse(
            log_id=log.log_id,
            admin_id=log.admin_id,
            action_type=log.action_type,
            target_entity=log.target_entity,
            details=log.details,
            timestamp=log.timestamp.isoformat() if log.timestamp else ""
        )
        for log in logs
    ]


class SystemLogResponse(BaseModel):
    log_id: UUID
    user_id: Optional[UUID]
    action_type: str
    target_entity: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    timestamp: str

    class Config:
        from_attributes = True


class SystemLogsListResponse(BaseModel):
    logs: List[SystemLogResponse]
    total: int
    page: int
    total_pages: int
    limit: int


@router.get("/system-logs", response_model=SystemLogsListResponse)
async def get_system_logs(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=500, description="Items per page"),
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    current_user = Depends(deps.RoleChecker(["ADMIN"])),
    system_log_repo: SystemLogRepository = Depends(deps.get_system_log_repository)
):
    """
    Retrieve system logs with pagination and optional filtering capabilities.
    
    This endpoint provides access to system-wide activity logs including user login events,
    password changes, interest updates, and other system-level actions. Logs can be filtered
    by user ID or action type, and results are paginated for efficient browsing.
    
    Args:
        page: Page number for pagination (starts from 1).
        limit: Number of log entries per page (between 1 and 500).
        user_id: Optional filter to show only logs associated with a specific user.
        action_type: Optional filter to show only logs of a specific action type
                    (e.g., LOGIN, PASSWORD_CHANGE, INTEREST_UPDATE).
    
    Returns:
        A paginated response containing system log entries with associated metadata including
        user information, action details, IP addresses, timestamps, and pagination information.
    
    Raises:
        HTTPException: 403 if the current user does not have administrator privileges.
    """
    skip = (page - 1) * limit
    
    logs, total = await system_log_repo.get_logs(
        skip=skip,
        limit=limit,
        user_id=user_id,
        action_type=action_type
    )
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return SystemLogsListResponse(
        logs=[
            SystemLogResponse(
                log_id=log.log_id,
                user_id=log.user_id,
                action_type=log.action_type,
                target_entity=log.target_entity,
                details=log.details,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                timestamp=log.timestamp.isoformat() if log.timestamp else ""
            )
            for log in logs
        ],
        total=total,
        page=page,
        total_pages=total_pages,
        limit=limit
    )


