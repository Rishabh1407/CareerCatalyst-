from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class PreparationSet(Base):
    __tablename__ = "preparation_sets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    target_role = Column(String(255), default="")
    target_company = Column(String(255), default="")
    interview_type = Column(String(100), default="Comprehensive")
    overview = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="preparations")
    scripts = relationship(
        "PreparationScript",
        back_populates="preparation_set",
        cascade="all, delete-orphan",
        order_by="PreparationScript.id"
    )

class PreparationScript(Base):
    __tablename__ = "preparation_scripts"

    id = Column(Integer, primary_key=True, index=True)
    preparation_set_id = Column(Integer, ForeignKey("preparation_sets.id", ondelete="CASCADE"), nullable=False, index=True)
    
    category = Column(String(100), nullable=False, index=True)
    # Categories: 'Self-Introduction', 'HR & Behavioral', 'Technical', 'Project-Based', 'Role-Specific', 'Company-Oriented'
    
    difficulty = Column(String(50), default="Intermediate")
    # 'Beginner', 'Intermediate', 'Advanced'

    question = Column(Text, nullable=False)
    suggested_answer = Column(Text, nullable=False)
    important_keywords = Column(Text, default="[]")  # JSON string array
    explanation = Column(Text, default="")
    key_points = Column(Text, default="[]")  # JSON string array
    
    is_learned = Column(Boolean, default=False, index=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    preparation_set = relationship("PreparationSet", back_populates="scripts")
