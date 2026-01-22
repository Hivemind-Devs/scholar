from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.data_access.models import University, Department
from app.schemas.university import UniversityResponse, UniversityDetailResponse, DepartmentResponse, UniversityPublicationStats
from app.data_access.repositories.university_repository import UniversityRepository
from app.services.university_service import UniversityService

router = APIRouter()

@router.get("/most-publications", response_model=List[UniversityPublicationStats])
async def get_universities_most_publications(
    limit: int = Query(10, ge=1, le=10, description="Number of universities to return (max 10)"),
    force_refresh: bool = Query(False, description="Force refresh from database, bypassing cache"),
    university_service: UniversityService = Depends(deps.get_university_service)
):
    """
    Retrieve universities ranked by their total publication count.
    
    This endpoint provides a ranked list of universities based on the number of
    publications associated with their scholars. Results are cached for improved
    performance but can be refreshed when needed.
    
    Args:
        limit: Maximum number of universities to return (between 1 and 10).
        force_refresh: If set to True, bypasses the cache and recalculates statistics
                      directly from the database.
    
    Returns:
        A list of university objects with their publication counts, sorted in
        descending order by publication count.
    """
    results = await university_service.get_top_universities_by_publication_count(limit, force_refresh=force_refresh)
    

    return [
        UniversityPublicationStats(
            **university.__dict__,
            publication_count=count
        )
        for university, count in results
    ]

@router.get("/", response_model=List[UniversityResponse])
async def list_universities(
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, description="Limit results. If null, returns all."),
    search: Optional[str] = Query(None, description="Search by university name"),
    db = Depends(deps.get_db)
):
    """
    Retrieve a list of universities with optional pagination and search functionality.
    
    This endpoint provides access to all universities in the system. You can search
    by name using partial matching, and optionally paginate results. If no limit is
    specified, all matching universities will be returned.
    
    Args:
        skip: Number of universities to skip for pagination (default: 0).
        limit: Maximum number of universities to return. If not specified, all
               matching universities are returned.
        search: Optional search term to filter universities by name (case-insensitive
                partial match).
    
    Returns:
        A list of university objects matching the specified criteria, sorted
        alphabetically by name.
    """
    query = select(University)
    
    if search:
        query = query.filter(University.name.ilike(f"%{search}%"))
    
    query = query.order_by(University.name).offset(skip)
    
    if limit:
        query = query.limit(limit)
    
    result = await db.execute(query)
    universities = result.scalars().all()
    
    return universities

@router.get("/with-departments", response_model=List[UniversityDetailResponse])
async def list_universities_with_departments(
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1),
    search: Optional[str] = Query(None, description="Search by university name"),
    db = Depends(deps.get_db)
):
    """
    Retrieve universities along with their associated departments.
    
    This endpoint returns universities with full department information included in
    each response. This is useful when you need both university and department data
    in a single request, reducing the number of API calls required.
    
    Args:
        skip: Number of universities to skip for pagination (default: 0).
        limit: Maximum number of universities to return. If not specified, all
               matching universities are returned.
        search: Optional search term to filter universities by name (case-insensitive
                partial match).
    
    Returns:
        A list of university objects with complete department information for each
        university, sorted alphabetically by name.
    """
    query = select(University).options(selectinload(University.departments))
    
    if search:
        query = query.filter(University.name.ilike(f"%{search}%"))
    
    query = query.order_by(University.name).offset(skip)
    
    if limit:
        query = query.limit(limit)
    
    result = await db.execute(query)
    universities = result.scalars().all()
    
    return universities

@router.get("/{university_id}/departments", response_model=List[DepartmentResponse])
async def get_university_departments(
    university_id: UUID,
    db = Depends(deps.get_db)
):
    """
    Retrieve all departments associated with a specific university.
    
    This endpoint provides a complete list of academic departments belonging to the
    specified university. Departments are returned in alphabetical order by name.
    
    Args:
        university_id: Unique identifier of the university whose departments are to be retrieved.
    
    Returns:
        A list of department objects containing department names, identifiers, and
        related information, sorted alphabetically.
    """
    query = select(Department).filter(Department.university_id == university_id).order_by(Department.name)
    result = await db.execute(query)
    departments = result.scalars().all()
    
    return departments

@router.get("/{university_id}", response_model=UniversityDetailResponse)
async def get_university(
    university_id: UUID,
    db = Depends(deps.get_db)
):
    """
    Retrieve comprehensive information about a specific university.
    
    This endpoint provides detailed information about a university including its
    name, location, website, and all associated departments. This is useful for
    displaying complete university profiles.
    
    Args:
        university_id: Unique identifier of the university to retrieve.
    
    Returns:
        A detailed university object containing all university information and
        a complete list of associated departments.
    
    Raises:
        HTTPException: 404 if the university with the provided ID is not found.
    """
    query = select(University).options(selectinload(University.departments)).filter(University.university_id == university_id)
    result = await db.execute(query)
    university = result.scalars().first()
    
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
        
    return university

