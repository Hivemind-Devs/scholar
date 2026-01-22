import uuid
from typing import List, Optional
from sqlalchemy import Column, String, Boolean, Text, TIMESTAMP, ForeignKey, Integer, Float, CheckConstraint, JSON, UniqueConstraint, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY as PG_ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.data_access.database import Base


class Vector(TypeDecorator):
    impl = Text
    cache_ok = True
    
    def __init__(self, dimensions=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dimensions = dimensions
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(Text)
        return self.impl
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == 'postgresql':
            if isinstance(value, list):
                return '[' + ','.join(str(float(v)) for v in value) + ']'
            return value
        return str(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == 'postgresql':
            if isinstance(value, str):
                value = value.strip('[]')
                return [float(x) for x in value.split(',') if x.strip()]
            return value
        return value

class User(Base):
    __tablename__ = "user"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(Text, nullable=True) 
    full_name = Column(String(200), nullable=False)
    role = Column(String(20), CheckConstraint("role IN ('GUEST', 'USER', 'ADMIN')"), default='USER')
    oauth_provider = Column(String(50), nullable=True)
    oauth_id = Column(String(200), nullable=True)
    research_interests = Column(Text, nullable=True)
    profile_vector = Column(Vector(384), nullable=True)
    is_active = Column(Boolean, default=True)
    password_reset_code = Column(String(6), nullable=True)
    password_reset_expires = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    saved_searches = relationship("SavedSearch", back_populates="user")
    saved_scholars = relationship("SavedScholar", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user")
    edit_requests = relationship("EditRequest", back_populates="user", foreign_keys="[EditRequest.user_id]")
    admin_logs = relationship("AdminLog", back_populates="admin")


class University(Base):
    __tablename__ = "university"

    university_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    location = Column(String(255), nullable=True)
    website_url = Column(String(500), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    departments = relationship("Department", back_populates="university")


class Department(Base):
    __tablename__ = "department"

    department_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    university_id = Column(UUID(as_uuid=True), ForeignKey("university.university_id"), nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=True, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('university_id', 'name', name='uq_department_university_name'),
    )

    university = relationship("University", back_populates="departments")
    scholars = relationship("Scholar", back_populates="department_rel")


class Scholar(Base):
    __tablename__ = "scholar"

    scholar_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    yok_id = Column(String(50), unique=True, nullable=True)
    full_name = Column(String(200), nullable=False)
    title = Column(String(100), nullable=True)
    
    department_id = Column(UUID(as_uuid=True), ForeignKey("department.department_id"), nullable=True)
    
    institution = Column(String(255), nullable=True) 
    department = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    profile_url = Column(String(500), nullable=True)
    
    orcid = Column(String(50), nullable=True)
    
    research_areas = Column(PG_ARRAY(Text), nullable=True)
    
    last_updated = Column(TIMESTAMP, server_default=func.now())
    profile_vector = Column(Vector(384), nullable=True)

    department_rel = relationship("Department", back_populates="scholars")
    
    image = relationship("ScholarImage", uselist=False, back_populates="scholar", cascade="all, delete-orphan")

    education_history = relationship("EducationHistory", back_populates="scholar", cascade="all, delete-orphan")
    academic_history = relationship("AcademicHistory", back_populates="scholar", cascade="all, delete-orphan")
    
    publications = relationship("Publication", back_populates="scholar", cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="scholar", cascade="all, delete-orphan")
    thesis_supervisions = relationship("ThesisSupervision", back_populates="scholar", cascade="all, delete-orphan")
    administrative_duties = relationship("AdministrativeDuty", back_populates="scholar", cascade="all, delete-orphan")
    
    collaborations_a = relationship("Collaboration", back_populates="scholar_a", foreign_keys="[Collaboration.scholar_a_id]")
    collaborations_b = relationship("Collaboration", back_populates="scholar_b", foreign_keys="[Collaboration.scholar_b_id]")


class ScholarImage(Base):
    __tablename__ = "scholar_image"
    
    image_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), unique=True, nullable=False)
    image_data = Column(Text, nullable=False)
    
    scholar = relationship("Scholar", back_populates="image")


class EducationHistory(Base):
    __tablename__ = "education_history"

    edu_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    year_range = Column(String(50), nullable=True)
    degree = Column(String(100), nullable=True)
    university = Column(String(255), nullable=True)
    department_info = Column(String(255), nullable=True)
    thesis_title = Column(Text, nullable=True)

    scholar = relationship("Scholar", back_populates="education_history")


class AcademicHistory(Base):
    __tablename__ = "academic_history"

    acad_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    year = Column(String(50), nullable=True)
    position = Column(String(100), nullable=True)
    university = Column(String(255), nullable=True)
    department_info = Column(String(255), nullable=True)

    scholar = relationship("Scholar", back_populates="academic_history")


class Publication(Base):
    __tablename__ = "publication"

    pub_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=True)
    
    title = Column(Text, nullable=False)
    year = Column(String(20), nullable=True)
    doi = Column(String(255), nullable=True) 
    venue = Column(Text, nullable=True)
    
    type = Column(String(100), nullable=True)
    publication_index = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)
    
    authors_json = Column(JSONB, nullable=True)
    
    scholar = relationship("Scholar", back_populates="publications")


class Course(Base):
    __tablename__ = "course"
    
    course_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    
    academic_year = Column(String(50), nullable=True)
    name = Column(String(255), nullable=True)
    language = Column(String(50), nullable=True)
    hours = Column(String(20), nullable=True)
    
    scholar = relationship("Scholar", back_populates="courses")


class ThesisSupervision(Base):
    __tablename__ = "thesis_supervision"
    
    thesis_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    
    year = Column(String(20), nullable=True)
    student_name = Column(String(255), nullable=True)
    title = Column(Text, nullable=True)
    institution = Column(String(255), nullable=True)
    
    scholar = relationship("Scholar", back_populates="thesis_supervisions")


class AdministrativeDuty(Base):
    __tablename__ = "administrative_duty"
    
    duty_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    
    year_range = Column(String(50), nullable=True)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    
    scholar = relationship("Scholar", back_populates="administrative_duties")


class Authorship(Base):
    """
    Connects existing Scholars to Publications for graph analysis.
    This is populated via a background process that matches 'authors_json' names to 'Scholar' records.
    """
    __tablename__ = "authorship"

    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id", ondelete="CASCADE"), primary_key=True)
    pub_id = Column(UUID(as_uuid=True), ForeignKey("publication.pub_id", ondelete="CASCADE"), primary_key=True)


class Collaboration(Base):
    __tablename__ = "collaboration"

    collab_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scholar_a_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    scholar_b_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    strength_score = Column(Integer, nullable=True)
    shared_pub_count = Column(Integer, nullable=True)

    scholar_a = relationship("Scholar", foreign_keys=[scholar_a_id], back_populates="collaborations_a")
    scholar_b = relationship("Scholar", foreign_keys=[scholar_b_id], back_populates="collaborations_b")


class SavedSearch(Base):
    __tablename__ = "saved_search"

    search_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=False)
    name = Column(String(200), nullable=True)
    query_params = Column(JSONB, nullable=True)
    result_snapshot = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="saved_searches")


class SavedScholar(Base):
    __tablename__ = "saved_scholar"

    saved_scholar_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=False)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    note = Column(Text, nullable=True)

    user = relationship("User", back_populates="saved_scholars")
    scholar = relationship("Scholar")

    __table_args__ = (
        UniqueConstraint('user_id', 'scholar_id', name='uq_saved_scholar_user_scholar'),
    )


class Recommendation(Base):
    __tablename__ = "recommendation"

    rec_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=False)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=False)
    similarity_score = Column(Float, nullable=True)
    explanation = Column(JSONB, nullable=True)
    is_dismissed = Column(Boolean, default=False)
    generated_at = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", back_populates="recommendations")
    scholar = relationship("Scholar")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'scholar_id', name='uq_recommendation_user_scholar'),
    )


class EditRequest(Base):
    __tablename__ = "edit_request"

    request_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=True)
    scholar_id = Column(UUID(as_uuid=True), ForeignKey("scholar.scholar_id"), nullable=True)
    changes_json = Column(JSONB, nullable=True)
    status = Column(String(30), CheckConstraint("status IN ('PENDING', 'APPROVED', 'REJECTED')"), default='PENDING')
    submitted_at = Column(TIMESTAMP, server_default=func.now())
    admin_reviewer_id = Column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="edit_requests")
    scholar = relationship("Scholar")
    admin_reviewer = relationship("User", foreign_keys=[admin_reviewer_id])


class AdminLog(Base):
    __tablename__ = "admin_log"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=False)
    action_type = Column(String(100), nullable=True)
    target_entity = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(TIMESTAMP, server_default=func.now())

    admin = relationship("User", back_populates="admin_logs")


class SystemLog(Base):
    __tablename__ = "system_log"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.user_id"), nullable=True)
    action_type = Column(String(100), nullable=False)
    target_entity = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(TIMESTAMP, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
