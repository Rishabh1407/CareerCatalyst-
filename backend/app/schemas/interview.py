import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class InterviewStartRequest(BaseModel):
    interview_type: str = Field(default="Comprehensive Interview")
    difficulty: str = Field(default="Intermediate")
    duration_minutes: int = Field(default=15)
    answer_method: str = Field(default="text")  # 'text' or 'voice'
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    job_description: Optional[str] = None
    total_questions: int = Field(default=5, ge=3, le=10)

class AnswerSubmitRequest(BaseModel):
    answer_text: str = Field(..., min_length=1)
    answer_method: str = Field(default="text")
    audio_file_path: Optional[str] = None
    transcript: Optional[str] = None
    speaking_duration: Optional[float] = None

class AudioAnalysisResponse(BaseModel):
    speaking_duration: float = 0.0
    words_per_minute: float = 0.0
    filler_word_count: int = 0
    filler_word_details: Dict[str, int] = {}
    pause_information: str = ""
    repeated_words: List[str] = []

    @field_validator("filler_word_details", mode="before")
    def parse_details(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v or {}

    @field_validator("repeated_words", mode="before")
    def parse_repeated(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v or []

    class Config:
        from_attributes = True

class AnswerEvaluationResponse(BaseModel):
    id: Optional[int] = None
    relevance_score: float = 0.0
    completeness_score: float = 0.0
    accuracy_score: float = 0.0
    clarity_score: float = 0.0
    structure_score: float = 0.0
    practical_understanding_score: float = 0.0
    overall_score: float = 0.0
    what_did_well: str = ""
    missing_information: str = ""
    incorrect_statements: str = ""
    how_to_improve: str = ""
    important_keywords: List[str] = []
    suggested_answer: str = ""

    @field_validator("important_keywords", mode="before")
    def parse_keywords(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return [k.strip() for k in v.split(",") if k.strip()]
        return v or []

    class Config:
        from_attributes = True

class InterviewQuestionResponse(BaseModel):
    id: int
    session_id: int
    question_text: str
    question_category: str
    difficulty: str
    question_order: int
    is_follow_up: bool
    parent_question_id: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewAnswerDetailResponse(BaseModel):
    id: int
    question_id: int
    answer_text: str
    answer_method: str
    transcript: Optional[str] = None
    submitted_at: datetime
    evaluation: Optional[AnswerEvaluationResponse] = None
    audio_analysis: Optional[AudioAnalysisResponse] = None

    class Config:
        from_attributes = True

class QuestionWithAnswerResponse(BaseModel):
    question: InterviewQuestionResponse
    answer: Optional[InterviewAnswerDetailResponse] = None

class InterviewSessionResponse(BaseModel):
    id: int
    user_id: int
    interview_type: str
    difficulty: str
    duration_minutes: int
    answer_method: str
    target_role: str
    target_company: str
    total_questions_planned: int
    status: str
    overall_score: float
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_question: Optional[InterviewQuestionResponse] = None
    questions_completed: int = 0
    questions_total: int = 0

    class Config:
        from_attributes = True

class AnswerSubmissionResult(BaseModel):
    evaluation: AnswerEvaluationResponse
    audio_analysis: Optional[AudioAnalysisResponse] = None
    next_question: Optional[InterviewQuestionResponse] = None
    is_completed: bool = False
    session_status: str = "in_progress"
    message: str = ""

class QuestionEvaluationItem(BaseModel):
    question_order: int
    category: str
    difficulty: str
    question: str
    candidate_answer: str
    answer_method: str
    score: float
    evaluation: Optional[AnswerEvaluationResponse] = None
    audio_analysis: Optional[AudioAnalysisResponse] = None

class CategoryScoreItem(BaseModel):
    category: str
    score: float
    questions_count: int

class InterviewReportResponse(BaseModel):
    session_id: int
    interview_type: str
    difficulty: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_minutes: int
    actual_duration_seconds: int = 0
    answer_method: str
    target_role: str
    target_company: str

    # Overall Performance
    overall_score: float  # out of 100
    average_answer_score: float  # out of 10
    total_questions: int
    completed_questions: int
    skipped_questions: int

    # Categories & Detailed answers
    category_scores: List[CategoryScoreItem] = []
    answers_evaluation: List[QuestionEvaluationItem] = []

    # Qualitative Performance
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    communication_analysis: Dict[str, Any] = {}
    next_steps: List[str] = []

class InterviewSummaryStats(BaseModel):
    total_interviews: int = 0
    average_score: float = 0.0
    best_score: float = 0.0
    total_questions_answered: int = 0
    recent_sessions: List[InterviewSessionResponse] = []
    category_performance: Dict[str, float] = {}
    score_trend: List[Dict[str, Any]] = []
