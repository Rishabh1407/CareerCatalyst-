from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CandidateProfileBase(BaseModel):
    # Personal and educational
    full_name: Optional[str] = ""
    email: Optional[str] = ""
    college: Optional[str] = ""
    degree: Optional[str] = ""
    specialization: Optional[str] = ""
    current_year: Optional[str] = ""
    graduation_year: Optional[str] = ""

    # Professional
    technical_skills: Optional[str] = ""
    programming_languages: Optional[str] = ""
    projects: Optional[str] = ""
    internships: Optional[str] = ""
    certifications: Optional[str] = ""
    achievements: Optional[str] = ""
    work_experience: Optional[str] = ""

    # Career preferences
    target_role: Optional[str] = ""
    target_company: Optional[str] = ""
    job_description: Optional[str] = ""
    interview_type: Optional[str] = "Comprehensive"

class CandidateProfileUpdate(CandidateProfileBase):
    pass

class CandidateProfileResponse(CandidateProfileBase):
    id: int
    user_id: int
    completion_percentage: int = 0
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

def calculate_completion_percentage(profile_dict: dict) -> int:
    """Calculates profile completion percentage based on filled key fields."""
    key_fields = [
        "full_name",
        "college",
        "degree",
        "specialization",
        "graduation_year",
        "technical_skills",
        "programming_languages",
        "projects",
        "internships",
        "certifications",
        "target_role",
        "target_company"
    ]
    filled = 0
    for field in key_fields:
        val = profile_dict.get(field)
        if val and str(val).strip():
            filled += 1
    return int((filled / len(key_fields)) * 100)
