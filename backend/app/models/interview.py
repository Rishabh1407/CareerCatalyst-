from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    interview_type = Column(String(100), default="Comprehensive Interview")
    # 'HR Interview', 'Technical Interview', 'Project-Based Interview', 'Role-Specific Interview', 'Comprehensive Interview'
    
    difficulty = Column(String(50), default="Intermediate")
    # 'Beginner', 'Intermediate', 'Advanced'
    
    duration_minutes = Column(Integer, default=15)
    answer_method = Column(String(50), default="text")  # 'text' or 'voice'
    
    target_role = Column(String(255), default="")
    target_company = Column(String(255), default="")
    job_description = Column(Text, default="")
    total_questions_planned = Column(Integer, default=5)
    
    status = Column(String(50), default="in_progress")
    # 'in_progress', 'completed', 'terminated'
    
    overall_score = Column(Float, default=0.0)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    completed_at = Column(DateTime, nullable=True)

    # Generated Report Summaries (JSON-serialized)
    report_overview = Column(Text, default="")
    strengths_summary = Column(Text, default="[]")
    weaknesses_summary = Column(Text, default="[]")
    recommendations = Column(Text, default="[]")
    category_scores = Column(Text, default="{}")
    communication_summary = Column(Text, default="{}")

    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    questions = relationship(
        "InterviewQuestion",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="InterviewQuestion.question_order"
    )
    answers = relationship(
        "InterviewAnswer",
        back_populates="session",
        cascade="all, delete-orphan"
    )


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question_text = Column(Text, nullable=False)
    question_category = Column(String(100), default="Technical")
    difficulty = Column(String(50), default="Intermediate")
    question_order = Column(Integer, default=1)
    
    is_follow_up = Column(Boolean, default=False)
    parent_question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=True)
    
    status = Column(String(50), default="current")
    # 'current', 'answered', 'skipped'
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("interview_questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    answer_text = Column(Text, nullable=False)
    answer_method = Column(String(50), default="text")  # 'text' or 'voice'
    audio_file_path = Column(String(500), nullable=True)
    transcript = Column(Text, nullable=True)
    
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    question = relationship("InterviewQuestion", back_populates="answer")
    session = relationship("InterviewSession", back_populates="answers")
    evaluation = relationship("AnswerEvaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")
    audio_analysis = relationship("AudioAnalysis", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class AnswerEvaluation(Base):
    __tablename__ = "answer_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("interview_answers.id", ondelete="CASCADE"), unique=True, nullable=False)

    # 1-10 numerical scores
    relevance_score = Column(Float, default=0.0)
    completeness_score = Column(Float, default=0.0)
    accuracy_score = Column(Float, default=0.0)
    clarity_score = Column(Float, default=0.0)
    structure_score = Column(Float, default=0.0)
    practical_understanding_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)

    # Constructive qualitative feedback
    what_did_well = Column(Text, default="")
    missing_information = Column(Text, default="")
    incorrect_statements = Column(Text, default="")
    how_to_improve = Column(Text, default="")
    important_keywords = Column(Text, default="[]")
    suggested_answer = Column(Text, default="")

    # Relationship
    answer = relationship("InterviewAnswer", back_populates="evaluation")


class AudioAnalysis(Base):
    __tablename__ = "audio_analyses"

    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey("interview_answers.id", ondelete="CASCADE"), unique=True, nullable=False)

    speaking_duration = Column(Float, default=0.0)  # in seconds
    words_per_minute = Column(Float, default=0.0)
    filler_word_count = Column(Integer, default=0)
    filler_word_details = Column(Text, default="{}")  # JSON string {"um": 2, "like": 1}
    pause_information = Column(Text, default="")
    repeated_words = Column(Text, default="[]")  # JSON array

    # Relationship
    answer = relationship("InterviewAnswer", back_populates="audio_analysis")
