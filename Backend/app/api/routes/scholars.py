import json
import re
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from app.services.scholar_service import ScholarService
from app.schemas.scholar import (
    ScholarProfileResponse, 
    PublicationResponse,
    ScholarListItemResponse,
    ScholarsListResponse
)
from app.data_access.repositories.scholar_repository import ScholarRepository
from app.api import deps

router = APIRouter()


@router.get("/titles", response_model=List[str])
async def get_unique_titles(
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository)
):
    """
    Retrieve a list of all unique academic titles available in the system.
    
    Returns:
        A list of distinct academic titles (e.g., Professor, Associate Professor, Assistant Professor).
    """
    return await scholar_repo.get_unique_titles()

@router.get("/research-interests", response_model=List[str])
async def get_research_interests(
    search: Optional[str] = Query(None, description="Search term to filter research interests"),
    top: Optional[int] = Query(None, ge=1, le=50, description="Get top N interests by scholar count"),
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository),
    research_areas_service = Depends(deps.get_research_areas_service)
):
    """
    Retrieve all unique research interests or areas from scholars in the system.
    
    This endpoint provides access to research interests with optional filtering capabilities.
    You can search for specific interests or retrieve the most popular research areas.
    
    Args:
        search: An optional search term to filter research interests by name (partial match).
        top: An optional parameter to retrieve the top N most popular research interests 
             based on the number of scholars associated with each interest. Results are cached 
             for improved performance. Must be between 1 and 50.
    
    Returns:
        A list of unique research interest names, optionally filtered or limited based on 
        the provided parameters.
    """
    if top:
        top_interests = await research_areas_service.get_top_research_areas(limit=top)
        return [item["interest"] for item in top_interests]
    
    return await scholar_repo.get_unique_research_areas(search=search)

@router.get("/", response_model=ScholarsListResponse)
async def list_scholars(
    search: Optional[str] = Query(None, description="Search term for name or research areas"),
    field: Optional[str] = Query(None, description="Filter by research field/interest (exact match)"),
    interests: Optional[str] = Query(None, description="Filter by research interests (comma-separated, partial match)"),
    institution: Optional[str] = Query(None, description="Filter by institution"),
    university_id: Optional[UUID] = Query(None, description="Filter by university ID"),
    department_id: Optional[UUID] = Query(None, description="Filter by department ID"),
    minHIndex: Optional[int] = Query(None, alias="minHIndex", description="Minimum H-index"),
    maxHIndex: Optional[int] = Query(None, alias="maxHIndex", description="Maximum H-index"),
    minCitations: Optional[int] = Query(None, alias="minCitations", description="Minimum citations"),
    sortBy: Optional[str] = Query(None, alias="sortBy", description="Sort by: citations, publications, name"),
    title: Optional[str] = Query(None, description="Filter by academic title"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository)
):
    """
    Retrieve a paginated list of scholars with comprehensive filtering and sorting options.
    
    This endpoint allows you to search and filter scholars based on various criteria including
    name, research interests, institution, academic metrics, and more. Results are paginated
    for efficient data retrieval.
    
    Args:
        search: Search term to match against scholar names or research areas (partial match).
        field: Filter scholars by a specific research field or interest (exact match required).
        interests: Comma-separated list of research interests for partial matching.
        institution: Filter by institution name.
        university_id: Filter by specific university identifier.
        department_id: Filter by specific department identifier.
        minHIndex: Minimum H-index threshold for filtering results.
        maxHIndex: Maximum H-index threshold for filtering results.
        minCitations: Minimum citation count threshold for filtering results.
        sortBy: Sort order for results - options include 'citations', 'publications', 'name', or 'hIndex'.
        title: Filter by academic title (e.g., Professor, Associate Professor).
        page: Page number for pagination (starts from 1).
        limit: Number of items to return per page (between 1 and 100).
    
    Returns:
        A paginated response containing a list of scholars matching the specified criteria,
        along with pagination metadata including total count and total pages.
    """
    skip = (page - 1) * limit
    
    interests_list = None
    if interests:
        interests_list = [interest.strip() for interest in interests.split(",") if interest.strip()]
    
    scholars, total = await scholar_repo.list_scholars(
        skip=skip,
        limit=limit,
        search=search,
        field=field,
        interests=interests_list,
        institution=institution,
        university_id=university_id,
        department_id=department_id,
        min_h_index=minHIndex,
        max_h_index=maxHIndex,
        min_citations=minCitations,
        sort_by=sortBy,
        title=title
    )
    
    scholar_items = []
    for scholar in scholars:
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
        
        if minHIndex is not None and h_index < minHIndex:
            continue
        if maxHIndex is not None and h_index > maxHIndex:
            continue
        if minCitations is not None and citation_count < minCitations:
            continue
        
        scholar_items.append(ScholarListItemResponse(
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
        ))
    
    if sortBy == "citations":
        scholar_items.sort(key=lambda x: x.citation_count or 0, reverse=True)
    elif sortBy == "publications":
        scholar_items.sort(key=lambda x: x.publication_count or 0, reverse=True)
    elif sortBy == "hIndex":
        scholar_items.sort(key=lambda x: x.h_index or 0, reverse=True)
    else:
        scholar_items.sort(key=lambda x: x.full_name)
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return ScholarsListResponse(
        scholars=scholar_items,
        total=total,
        page=page,
        total_pages=total_pages
    )


@router.get("/{scholar_id}", response_model=ScholarProfileResponse)
async def get_scholar_profile(
    scholar_id: UUID,
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository)
):
    """
    Retrieve comprehensive profile information for a specific scholar.
    
    This endpoint provides detailed information about a scholar including their academic
    background, publications, research interests, education history, and professional
    achievements. The response includes calculated metrics such as H-index and citation counts.
    
    Args:
        scholar_id: Unique identifier of the scholar to retrieve.
    
    Returns:
        Complete scholar profile containing personal information, academic metrics,
        publications list, education history, academic positions, courses taught,
        thesis supervisions, and administrative duties.
    
    Raises:
        HTTPException: 404 if the scholar with the provided ID is not found.
    """
    scholar = await scholar_repo.get_scholar_profile(scholar_id)
    
    if not scholar:
        raise HTTPException(status_code=404, detail="Scholar not found")
    
    image_data = None
    if scholar.image:
        image_data = scholar.image.image_data
    
    institution = scholar.institution
    department = scholar.department
    
    if scholar.department_id and scholar.department_rel:
        if scholar.department_rel.university:
            institution = scholar.department_rel.university.name
        department = scholar.department_rel.name
    
    publications = []
    for pub in scholar.publications:
        authors = None
        if pub.authors_json:
            if isinstance(pub.authors_json, list):
                authors = pub.authors_json
            elif isinstance(pub.authors_json, str):
                try:
                    authors = json.loads(pub.authors_json)
                except (json.JSONDecodeError, TypeError):
                    authors = None
        
        publications.append(PublicationResponse(
            pub_id=pub.pub_id,
            title=pub.title,
            year=pub.year,
            doi=pub.doi,
            venue=pub.venue,
            type=pub.type,
            publication_index=pub.publication_index,
            category=pub.category,
            authors=authors
        ))
    
    citation_count = ScholarService.estimate_citation_count(scholar.publications)
    h_index = ScholarService.calculate_h_index(scholar.publications)
    
    return ScholarProfileResponse(
        scholar_id=scholar.scholar_id,
        yok_id=scholar.yok_id,
        full_name=scholar.full_name,
        title=scholar.title,
        orcid=scholar.orcid,
        profile_url=scholar.profile_url,
        email=scholar.email,
        research_areas=scholar.research_areas if scholar.research_areas else [],
        institution=institution,
        department=department,
        image=image_data,
        h_index=h_index,
        citation_count=citation_count,
        publications=publications,
        education=[edu for edu in scholar.education_history],
        academic_history=[acad for acad in scholar.academic_history],
        courses=[course for course in scholar.courses],
        thesis_supervisions=[thesis for thesis in scholar.thesis_supervisions],
        administrative_duties=[duty for duty in scholar.administrative_duties]
    )


@router.get("/{scholar_id}/publications", response_model=List[PublicationResponse])
async def get_scholar_publications(
    scholar_id: UUID,
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository)
):
    """
    Retrieve all publications associated with a specific scholar.
    
    This endpoint returns a complete list of publications authored or co-authored by
    the specified scholar. Each publication includes details such as title, year,
    DOI, venue, publication type, and author information.
    
    Args:
        scholar_id: Unique identifier of the scholar whose publications are to be retrieved.
    
    Returns:
        A list of publication objects containing detailed information about each
        publication including metadata and author lists.
    
    Raises:
        HTTPException: 404 if the scholar with the provided ID is not found.
    """
    scholar = await scholar_repo.get_scholar_profile(scholar_id)
    
    if not scholar:
        raise HTTPException(status_code=404, detail="Scholar not found")
    
    publications = []
    for pub in scholar.publications:
        authors = None
        if pub.authors_json:
            if isinstance(pub.authors_json, list):
                authors = pub.authors_json
            elif isinstance(pub.authors_json, str):
                try:
                    authors = json.loads(pub.authors_json)
                except (json.JSONDecodeError, TypeError):
                    authors = None
        
        publications.append(PublicationResponse(
            pub_id=pub.pub_id,
            title=pub.title,
            year=pub.year,
            doi=pub.doi,
            venue=pub.venue,
            type=pub.type,
            publication_index=pub.publication_index,
            category=pub.category,
            authors=authors
        ))
    
    return publications


@router.get("/{scholar_id}/collaborations")
async def get_scholar_collaborations(
    scholar_id: UUID,
    scholar_repo: ScholarRepository = Depends(deps.get_scholar_repository)
):
    """
    Retrieve the collaboration network graph for a specific scholar.
    
    This endpoint analyzes the scholar's publications to identify co-authors and
    builds a network graph representation of their academic collaborations. The graph
    includes nodes representing scholars and links representing collaboration relationships,
    with weights indicating the frequency of collaboration.
    
    The endpoint automatically processes author names, removes date patterns, normalizes
    names for duplicate detection, and consolidates multiple entries for the same person.
    Scholar images are included in the response when available.
    
    Args:
        scholar_id: Unique identifier of the scholar whose collaboration network is to be analyzed.
    
    Returns:
        A dictionary containing:
        - nodes: List of scholar nodes with their IDs, names, images, and group assignments.
                 Group 1 represents the main scholar, group 2 represents collaborators.
        - links: List of collaboration links with source, target, and weight (collaboration frequency).
    
    Raises:
        HTTPException: 404 if the scholar with the provided ID is not found.
    """
    from sqlalchemy.future import select
    from app.data_access.models import Scholar
    
    def clean_author_name(name: str) -> str:
        """Remove date patterns like (17.06.2025 - 20.06.2025) and clean the name."""
        if not name or not isinstance(name, str):
            return ""
        
        date_pattern = r'\s*\([^)]*\d{2}\.\d{2}\.\d{4}[^)]*\)\s*'
        cleaned = re.sub(date_pattern, '', name, flags=re.IGNORECASE)
        
        cleaned = ' '.join(cleaned.split())
        return cleaned.strip()
    
    def normalize_name(name: str) -> str:
        """Normalize name for comparison (lowercase, remove extra spaces)."""
        return ' '.join(name.lower().split())
    
    scholar = await scholar_repo.get_scholar_profile(scholar_id)
    
    if not scholar:
        raise HTTPException(status_code=404, detail="Scholar not found")
    
    if not scholar.publications:
        return {"nodes": [{"id": str(scholar_id), "name": scholar.full_name}], "links": []}

    co_author_counts = {}
    
    normalized_to_original = {}
    
    scholar_name_normalized = normalize_name(scholar.full_name)
    
    for pub in scholar.publications:
        if not pub.authors_json:
            continue
            
        authors = []
        if isinstance(pub.authors_json, list):
            authors = pub.authors_json
        elif isinstance(pub.authors_json, str):
            try:
                authors = json.loads(pub.authors_json)
            except (json.JSONDecodeError, TypeError):
                continue
        
        for author_name in authors:
            if not isinstance(author_name, str):
                continue
            
            cleaned_name = clean_author_name(author_name)
            if not cleaned_name:
                continue
            
            normalized = normalize_name(cleaned_name)
            
            if normalized == scholar_name_normalized:
                continue
            
            if normalized not in normalized_to_original:
                normalized_to_original[normalized] = cleaned_name
            
            original_cleaned = normalized_to_original[normalized]
            co_author_counts[original_cleaned] = co_author_counts.get(original_cleaned, 0) + 1

    if not co_author_counts:
        return {"nodes": [{"id": str(scholar_id), "name": scholar.full_name}], "links": []}

    potential_names = list(co_author_counts.keys())
    
    author_normalized_lookup = {}
    for name in potential_names:
        norm = normalize_name(name)
        if norm not in author_normalized_lookup:
            author_normalized_lookup[norm] = []
        author_normalized_lookup[norm].append(name)
    
    from sqlalchemy import func, or_
    from sqlalchemy.orm import joinedload
    
    conditions = []
    for name in potential_names:
        conditions.append(func.lower(Scholar.full_name) == func.lower(name))
    
    if not conditions:
        image_data = None
        if scholar.image:
            image_data = scholar.image.image_data
        return {
            "nodes": [{"id": str(scholar_id), "name": scholar.full_name, "image": image_data}],
            "links": []
        }
    
    stmt = select(Scholar).options(
        joinedload(Scholar.image)
    ).filter(
        or_(*conditions)
    )
    
    result = await scholar_repo.session.execute(stmt)
    found_scholars = result.scalars().unique().all()
    
    name_based_collaborations = {}
    
    for scholar_obj in found_scholars:
        s_id = str(scholar_obj.scholar_id)
        s_name = scholar_obj.full_name
        
        if s_id == str(scholar_id):
            continue
        
        s_name_normalized = normalize_name(s_name)
        
        matched_author_names = []
        
        if s_name_normalized in author_normalized_lookup:
            matched_author_names.extend(author_normalized_lookup[s_name_normalized])
        
        for orig_name in potential_names:
            orig_norm = normalize_name(orig_name)
            if orig_norm == s_name_normalized and orig_name not in matched_author_names:
                matched_author_names.append(orig_name)
        
        total_weight = 0
        for matched_name in matched_author_names:
            total_weight += co_author_counts.get(matched_name, 0)
        
        if total_weight > 0:
            image_data = None
            if scholar_obj.image:
                image_data = scholar_obj.image.image_data
            
            if s_name_normalized in name_based_collaborations:
                name_based_collaborations[s_name_normalized]['weight'] += total_weight
                if image_data and not name_based_collaborations[s_name_normalized].get('image'):
                    name_based_collaborations[s_name_normalized]['image'] = image_data
            else:
                name_based_collaborations[s_name_normalized] = {
                    'id': s_id,
                    'name': s_name,
                    'image': image_data,
                    'weight': total_weight
                }
    
    main_scholar_image = None
    if scholar.image:
        main_scholar_image = scholar.image.image_data
    
    nodes = [{
        "id": str(scholar.scholar_id),
        "name": scholar.full_name,
        "image": main_scholar_image,
        "group": 1
    }]
    links = []
    
    seen_normalized_names = {normalize_name(scholar.full_name)}
    
    for normalized_name, collab_data in name_based_collaborations.items():
        if normalized_name not in seen_normalized_names:
            nodes.append({
                "id": collab_data['id'],
                "name": collab_data['name'],
                "image": collab_data.get('image'),
                "group": 2
            })
            seen_normalized_names.add(normalized_name)
        
        links.append({
            "source": str(scholar_id),
            "target": collab_data['id'],
            "weight": collab_data['weight']
        })
    
    return {
        "nodes": nodes,
        "links": links
    }

