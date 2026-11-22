import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.profile import CandidateProfile
from backend.app.models.preparation import PreparationSet, PreparationScript
from backend.app.schemas.preparation import (
    PreparationGenerateRequest,
    PreparationSetResponse,
    PreparationScriptResponse,
    PreparationSummary,
    ScriptStatusUpdate
)
from backend.app.services.gemini_service import generate_interview_preparation_gemini as generate_interview_preparation
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/preparation", tags=["AI Interview Preparation"])

def _format_prep_set_response(prep_set: PreparationSet) -> PreparationSetResponse:
    scripts_data = []
    learned_count = 0
    for s in prep_set.scripts:
        if s.is_learned:
            learned_count += 1
        scripts_data.append(PreparationScriptResponse(
            id=s.id,
            preparation_set_id=s.preparation_set_id,
            category=s.category,
            difficulty=s.difficulty,
            question=s.question,
            suggested_answer=s.suggested_answer,
            important_keywords=s.important_keywords,
            explanation=s.explanation,
            key_points=s.key_points,
            is_learned=s.is_learned,
            notes=s.notes or "",
            created_at=s.created_at
        ))

    return PreparationSetResponse(
        id=prep_set.id,
        user_id=prep_set.user_id,
        title=prep_set.title,
        target_role=prep_set.target_role or "",
        target_company=prep_set.target_company or "",
        interview_type=prep_set.interview_type or "Comprehensive",
        overview=prep_set.overview or "",
        created_at=prep_set.created_at,
        scripts=scripts_data,
        total_questions=len(scripts_data),
        learned_questions=learned_count
    )

@router.get("/summary", response_model=PreparationSummary)
def get_preparation_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sets = db.query(PreparationSet).filter(
        PreparationSet.user_id == current_user.id
    ).options(joinedload(PreparationSet.scripts)).order_by(PreparationSet.created_at.desc()).all()

    total_sets = len(sets)
    total_questions = 0
    learned_questions = 0

    for s in sets:
        for sc in s.scripts:
            total_questions += 1
            if sc.is_learned:
                learned_questions += 1

    progress_percentage = int((learned_questions / total_questions * 100)) if total_questions > 0 else 0
    recent_sets = [_format_prep_set_response(s) for s in sets[:5]]

    return PreparationSummary(
        total_sets=total_sets,
        total_questions=total_questions,
        learned_questions=learned_questions,
        progress_percentage=progress_percentage,
        recent_sets=recent_sets
    )

@router.post("/generate", response_model=PreparationSetResponse, status_code=status.HTTP_201_CREATED)
def generate_preparation(
    payload: PreparationGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id, email=current_user.email)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    profile_dict = {
        "full_name": profile.full_name or "",
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
        "interview_type": profile.interview_type or "Comprehensive",
        "job_description": profile.job_description or ""
    }

    target_role = payload.target_role or profile.target_role or "Software Engineer"
    target_company = payload.target_company or profile.target_company or "Target Company"
    interview_type = payload.interview_type or profile.interview_type or "Comprehensive"
    job_description = payload.job_description or profile.job_description or ""

    # Call AI generation service
    ai_result = generate_interview_preparation(
        profile_data=profile_dict,
        role_override=target_role,
        company_override=target_company,
        interview_type_override=interview_type,
        job_description_override=job_description
    )

    title = f"{target_role} Prep — {target_company}" if target_company else f"{target_role} Interview Preparation"
    prep_set = PreparationSet(
        user_id=current_user.id,
        title=title,
        target_role=target_role,
        target_company=target_company,
        interview_type=interview_type,
        overview=ai_result.get("overview", "")
    )
    db.add(prep_set)
    db.commit()
    db.refresh(prep_set)

    try:
        for item in ai_result.get("items", []):
            raw_keywords = item.get("important_keywords", [])
            keywords_val = json.dumps(raw_keywords) if isinstance(raw_keywords, list) else json.dumps([])

            raw_key_points = item.get("key_points", [])
            key_points_val = json.dumps(raw_key_points) if isinstance(raw_key_points, list) else json.dumps([])

            script = PreparationScript(
                preparation_set_id=prep_set.id,
                category=str(item.get("category", "Technical")),
                difficulty=str(item.get("difficulty", "Intermediate")),
                question=str(item.get("question", "")).strip(),
                suggested_answer=str(item.get("suggested_answer", "")).strip(),
                important_keywords=keywords_val,
                explanation=str(item.get("explanation", "")).strip(),
                key_points=key_points_val,
                is_learned=False
            )
            db.add(script)

        db.commit()

        # Eagerly load the complete preparation set with all scripts
        fresh_prep_set = db.query(PreparationSet).options(
            joinedload(PreparationSet.scripts)
        ).filter(PreparationSet.id == prep_set.id).first()

        return _format_prep_set_response(fresh_prep_set or prep_set)
    except Exception as db_err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist preparation package in database: {str(db_err)}"
        )

@router.get("", response_model=List[PreparationSetResponse])
def get_all_preparations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sets = db.query(PreparationSet).filter(
        PreparationSet.user_id == current_user.id
    ).options(joinedload(PreparationSet.scripts)).order_by(PreparationSet.created_at.desc()).all()
    return [_format_prep_set_response(s) for s in sets]

@router.get("/{preparation_id}", response_model=PreparationSetResponse)
def get_preparation_by_id(
    preparation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prep_set = db.query(PreparationSet).filter(
        PreparationSet.id == preparation_id,
        PreparationSet.user_id == current_user.id
    ).options(joinedload(PreparationSet.scripts)).first()

    if not prep_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preparation set not found or you do not have permission to access it."
        )

    return _format_prep_set_response(prep_set)

@router.delete("/{preparation_id}", status_code=status.HTTP_200_OK)
def delete_preparation(
    preparation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prep_set = db.query(PreparationSet).filter(
        PreparationSet.id == preparation_id,
        PreparationSet.user_id == current_user.id
    ).first()

    if not prep_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preparation set not found or you do not have permission to delete it."
        )

    db.delete(prep_set)
    db.commit()
    return {"message": "Preparation set deleted successfully", "id": preparation_id}

@router.get("/{preparation_id}/scripts", response_model=List[PreparationScriptResponse])
def get_scripts_by_preparation_id(
    preparation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prep_set = db.query(PreparationSet).filter(
        PreparationSet.id == preparation_id,
        PreparationSet.user_id == current_user.id
    ).first()

    if not prep_set:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preparation set not found or you do not have permission to view its scripts."
        )

    scripts = db.query(PreparationScript).filter(
        PreparationScript.preparation_set_id == preparation_id
    ).order_by(PreparationScript.id).all()

    return [
        PreparationScriptResponse(
            id=s.id,
            preparation_set_id=s.preparation_set_id,
            category=s.category,
            difficulty=s.difficulty,
            question=s.question,
            suggested_answer=s.suggested_answer,
            important_keywords=s.important_keywords,
            explanation=s.explanation,
            key_points=s.key_points,
            is_learned=s.is_learned,
            notes=s.notes or "",
            created_at=s.created_at
        )
        for s in scripts
    ]

@router.patch("/scripts/{script_id}", response_model=PreparationScriptResponse)
def update_script_status(
    script_id: int,
    payload: ScriptStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    script = db.query(PreparationScript).join(PreparationSet).filter(
        PreparationScript.id == script_id,
        PreparationSet.user_id == current_user.id
    ).first()

    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Script question not found or you do not have permission to update it."
        )

    if payload.is_learned is not None:
        script.is_learned = payload.is_learned
    if payload.notes is not None:
        script.notes = payload.notes

    db.commit()
    db.refresh(script)

    return PreparationScriptResponse(
        id=script.id,
        preparation_set_id=script.preparation_set_id,
        category=script.category,
        difficulty=script.difficulty,
        question=script.question,
        suggested_answer=script.suggested_answer,
        important_keywords=script.important_keywords,
        explanation=script.explanation,
        key_points=script.key_points,
        is_learned=script.is_learned,
        notes=script.notes or "",
        created_at=script.created_at
    )
