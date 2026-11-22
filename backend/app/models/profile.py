from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Personal and educational information
    full_name = Column(String(255), default="")
    email = Column(String(255), default="")
    college = Column(String(255), default="")
    degree = Column(String(255), default="")
    specialization = Column(String(255), default="")
    current_year = Column(String(50), default="")
    graduation_year = Column(String(50), default="")

    # Professional information
    technical_skills = Column(Text, default="")
    programming_languages = Column(Text, default="")
    projects = Column(Text, default="")
    internships = Column(Text, default="")
    certifications = Column(Text, default="")
    achievements = Column(Text, default="")
    work_experience = Column(Text, default="")

    # Career preferences
    target_role = Column(String(255), default="")
    target_company = Column(String(255), default="")
    job_description = Column(Text, default="")
    interview_type = Column(String(100), default="Comprehensive")

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="profile")
