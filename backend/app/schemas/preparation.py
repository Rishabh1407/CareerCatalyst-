import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator

class ScriptStatusUpdate(BaseModel):
    is_learned: Optional[bool] = None
    notes: Optional[str] = None

class PreparationGenerateRequest(BaseModel):
    target_role: Optional[str] = None
    target_company: Optional[str] = None
    interview_type: Optional[str] = None
    job_description: Optional[str] = None

class PreparationScriptResponse(BaseModel):
    id: int
    preparation_set_id: int
    category: str
    difficulty: str
    question: str
    suggested_answer: str
    important_keywords: List[str] = []
    explanation: str
    key_points: List[str] = []
    is_learned: bool
    notes: Optional[str] = ""
    created_at: datetime

    @field_validator("important_keywords", mode="before")
    def parse_keywords(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return [k.strip() for k in v.split(",") if k.strip()]
        return v or []

    @field_validator("key_points", mode="before")
    def parse_key_points(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return [k.strip() for k in v.split("\n") if k.strip()]
        return v or []

    class Config:
        from_attributes = True

class PreparationSetResponse(BaseModel):
    id: int
    user_id: int
    title: str
    target_role: str
    target_company: str
    interview_type: str
    overview: str
    created_at: datetime
    scripts: List[PreparationScriptResponse] = []
    total_questions: int = 0
    learned_questions: int = 0

    class Config:
        from_attributes = True

class PreparationSummary(BaseModel):
    total_sets: int
    total_questions: int
    learned_questions: int
    progress_percentage: int
    recent_sets: List[PreparationSetResponse] = []
