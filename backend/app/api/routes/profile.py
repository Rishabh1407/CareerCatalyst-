from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.profile import CandidateProfile
from backend.app.schemas.profile import CandidateProfileUpdate, CandidateProfileResponse, calculate_completion_percentage
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["Candidate Profile"])

def _build_profile_response(profile: CandidateProfile) -> CandidateProfileResponse:
    profile_dict = {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.full_name or "",
        "email": profile.email or "",
        "college": profile.college or "",
        "degree": profile.degree or "",
        "specialization": profile.specialization or "",
        "current_year": profile.current_year or "",
        "graduation_year": profile.graduation_year or "",
        "technical_skills": profile.technical_skills or "",
        "programming_languages": profile.programming_languages or "",
        "projects": profile.projects or "",
        "internships": profile.internships or "",
        "certifications": profile.certifications or "",
        "achievements": profile.achievements or "",
        "work_experience": profile.work_experience or "",
        "target_role": profile.target_role or "",
        "target_company": profile.target_company or "",
        "job_description": profile.job_description or "",
        "interview_type": profile.interview_type or "Comprehensive",
        "updated_at": profile.updated_at
    }
    profile_dict["completion_percentage"] = calculate_completion_percentage(profile_dict)
    return CandidateProfileResponse(**profile_dict)

@router.get("", response_model=CandidateProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id, email=current_user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return _build_profile_response(profile)

@router.put("", response_model=CandidateProfileResponse)
def update_profile(
    payload: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value if value is not None else "")

    db.commit()
    db.refresh(profile)
    return _build_profile_response(profile)
