from app.data_access.repositories.base import BaseRepository
from app.data_access.models import Scholar, Department, Publication
from app.services.embedding_service import EmbeddingService
from sqlalchemy.future import select
from sqlalchemy import func, distinct, text, String, or_
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from uuid import UUID

class ScholarRepository(BaseRepository[Scholar]):
    def __init__(self, session):
        super().__init__(Scholar, session)
    
    def _get_vector_service(self):
        from app.services.scholar_vector_service import ScholarVectorService
        return ScholarVectorService(self, EmbeddingService())
    
    async def update(self, id: UUID, **kwargs) -> Optional[Scholar]:
        result = await super().update(id, **kwargs)
        if result and ('research_areas' in kwargs or 'research_keywords' in kwargs):
            vector_service = self._get_vector_service()
            await vector_service.generate_vector_for_scholar(id)
        return result
    
    async def create(self, **kwargs) -> Scholar:
        instance = await super().create(**kwargs)
        if instance:
            vector_service = self._get_vector_service()
            await vector_service.generate_vector_for_scholar(instance.scholar_id)
        return instance

    async def get_by_yok_id(self, yok_id: str):
        result = await self.session.execute(select(Scholar).filter(Scholar.yok_id == yok_id))
        return result.scalars().first()
    
    async def get_unique_research_areas(self, search: Optional[str] = None) -> list[str]:
        if search:
            search_term = f"%{search.lower()}%"
            query = text("""
                SELECT DISTINCT area
                FROM (
                    SELECT unnest(research_areas) as area
                    FROM scholar
                    WHERE research_areas IS NOT NULL
                ) AS areas
                WHERE LOWER(area) LIKE :search_term
                ORDER BY area
            """)
            result = await self.session.execute(query, {"search_term": search_term})
        else:
            query = text("""
                SELECT DISTINCT unnest(research_areas) as area
                FROM scholar
                WHERE research_areas IS NOT NULL
                ORDER BY area
            """)
            result = await self.session.execute(query)
        
        areas = [row[0] for row in result.fetchall()]
        return [area for area in areas if area and area.strip()]
    
    async def get_top_research_areas(self, limit: int = 10) -> list[dict]:
        """Get top research areas by scholar count."""
        query = text("""
            SELECT 
                area,
                COUNT(*) as scholar_count
            FROM (
                SELECT unnest(research_areas) as area, scholar_id
                FROM scholar
                WHERE research_areas IS NOT NULL
            ) AS areas
            WHERE area IS NOT NULL AND area != ''
            GROUP BY area
            ORDER BY scholar_count DESC, area ASC
            LIMIT :limit
        """)
        result = await self.session.execute(query, {"limit": limit})
        rows = result.fetchall()
        return [
            {"interest": row[0], "count": row[1]}
            for row in rows if row[0] and row[0].strip()
        ]
    
    async def get_unique_titles(self) -> list[str]:
        query = select(distinct(Scholar.title)).where(Scholar.title.isnot(None)).order_by(Scholar.title)
        result = await self.session.execute(query)
        titles = result.scalars().all()
        return [title for title in titles if title and title.strip()]
    
    async def get_scholars_with_vectors(self, skip: int = 0, limit: int = 100) -> List[Scholar]:
        result = await self.session.execute(
            select(Scholar)
            .filter(Scholar.profile_vector.isnot(None))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_all_scholars_with_vectors(self) -> List[Scholar]:
        result = await self.session.execute(
            select(Scholar).filter(Scholar.profile_vector.isnot(None))
        )
        return result.scalars().all()
    
    async def get_scholars_without_vectors(self, limit: int = None) -> List[Scholar]:
        query = select(Scholar).filter(
            Scholar.profile_vector.is_(None),
            Scholar.research_areas.isnot(None)
        )
        if limit:
            query = query.limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_all_scholars(self) -> List[Scholar]:
        result = await self.session.execute(select(Scholar))
        return result.scalars().all()
    
    async def update_scholar_vector(self, scholar_id, vector: List[float]):
        if not vector:
            return None
        
        try:

            vector_str = '[' + ','.join(str(float(v)) for v in vector) + ']'
            

            query = text(f"""
                UPDATE scholar 
                SET profile_vector = '{vector_str}'::vector
                WHERE scholar_id = :scholar_id
            """)
            
            await self.session.execute(query, {"scholar_id": scholar_id})
            await self.session.commit()
            

            scholar = await self.get(scholar_id)
            return scholar
        except Exception as e:
            await self.session.rollback()
            raise e
    
    async def bulk_update_scholar_vectors(self, scholar_vector_map: dict):
        """
        Bulk update vectors for multiple scholars.
        scholar_vector_map: {scholar_id: vector_list}
        Returns the number of updated rows.
        """
        if not scholar_vector_map:
            return 0
        
        try:


            updated_count = 0
            for scholar_id, vector in scholar_vector_map.items():
                if vector:
                    vector_str = '[' + ','.join(str(float(v)) for v in vector) + ']'
                    query = text(f"""
                        UPDATE scholar 
                        SET profile_vector = '{vector_str}'::vector
                        WHERE scholar_id = :scholar_id
                    """)
                    await self.session.execute(query, {"scholar_id": scholar_id})
                    updated_count += 1
            
            if updated_count > 0:
                await self.session.commit()
            
            return updated_count
        except Exception as e:
            await self.session.rollback()
            raise e
    
    async def get_scholar_profile(self, scholar_id: UUID) -> Optional[Scholar]:
        result = await self.session.execute(
            select(Scholar)
            .options(
                joinedload(Scholar.image),
                selectinload(Scholar.publications),
                selectinload(Scholar.education_history),
                selectinload(Scholar.academic_history),
                selectinload(Scholar.courses),
                selectinload(Scholar.thesis_supervisions),
                selectinload(Scholar.administrative_duties),
                joinedload(Scholar.department_rel).joinedload(Department.university)
            )
            .filter(Scholar.scholar_id == scholar_id)
        )
        return result.scalars().first()
    
    async def list_scholars(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        field: Optional[str] = None,
        interests: Optional[List[str]] = None,
        institution: Optional[str] = None,
        university_id: Optional[UUID] = None,
        department_id: Optional[UUID] = None,
        min_h_index: Optional[int] = None,
        max_h_index: Optional[int] = None,
        min_citations: Optional[int] = None,
        sort_by: Optional[str] = None,
        title: Optional[str] = None
    ) -> tuple[List[Scholar], int]:
        query = select(Scholar).options(
            joinedload(Scholar.image),
            selectinload(Scholar.publications),
            joinedload(Scholar.department_rel).joinedload(Department.university)
        )
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                func.lower(Scholar.full_name).like(search_term)
                | func.lower(Scholar.research_areas.cast(String)).like(search_term)
            )
        
        if field:
            query = query.filter(Scholar.research_areas.contains([field]))
        
        if interests:


            interest_filters = []
            for interest in interests:
                interest_clean = interest.strip()
                if not interest_clean:
                    continue


                interest_lower = f"%{interest_clean.lower()}%"
                interest_filters.append(
                    func.lower(func.array_to_string(Scholar.research_areas, '|')).like(interest_lower)
                )
            if interest_filters:
                query = query.filter(or_(*interest_filters))
        
        if institution:
            inst_term = f"%{institution.lower()}%"
            query = query.filter(
                func.lower(Scholar.institution).like(inst_term)
            )

        if title:
            query = query.filter(Scholar.title == title)

        if university_id:


            






            


            query = query.join(Scholar.department_rel)
            query = query.filter(Department.university_id == university_id)

        if department_id:
            query = query.filter(Scholar.department_id == department_id)
        
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0
        
        if sort_by == "citations":





            query = query.order_by(Scholar.full_name)
        elif sort_by == "publications":


             pub_count_stmt = (
                 select(Publication.scholar_id, func.count(Publication.pub_id).label("pub_count"))
                 .group_by(Publication.scholar_id)
                 .subquery()
             )
             
             query = query.outerjoin(pub_count_stmt, Scholar.scholar_id == pub_count_stmt.c.scholar_id)
             query = query.order_by(pub_count_stmt.c.pub_count.desc().nulls_last())
        elif sort_by == "name_desc":
            query = query.order_by(Scholar.full_name.desc())
        else:

            query = query.order_by(Scholar.full_name.asc())
        
        query = query.offset(skip).limit(limit)
        
        result = await self.session.execute(query)
        scholars = result.scalars().unique().all()
        
        return list(scholars), total