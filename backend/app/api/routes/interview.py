import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.profile import CandidateProfile
from backend.app.models.interview import (
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    AnswerEvaluation,
    AudioAnalysis
)
from backend.app.schemas.interview import (
    InterviewStartRequest,
    AnswerSubmitRequest,
    InterviewSessionResponse,
    InterviewQuestionResponse,
    AnswerEvaluationResponse,
    AudioAnalysisResponse,
    AnswerSubmissionResult,
    InterviewSummaryStats
)
from backend.app.services.interview_service import (
    generate_next_question_ai,
    evaluate_answer_ai,
    generate_final_report_ai
)
from backend.app.services.audio_service import analyze_transcript_communication
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/interviews", tags=["Interactive AI Mock Interviews"])

def _format_session_response(session: InterviewSession) -> InterviewSessionResponse:
    # Find current active question (first question with status == 'current')
    current_q = None
    completed_q_count = 0
    for q in session.questions:
        if q.status == "answered" or q.status == "skipped":
            completed_q_count += 1
        elif q.status == "current" and current_q is None:
            current_q = InterviewQuestionResponse(
                id=q.id,
                session_id=q.session_id,
                question_text=q.question_text,
                question_category=q.question_category,
                difficulty=q.difficulty,
                question_order=q.question_order,
                is_follow_up=q.is_follow_up,
                parent_question_id=q.parent_question_id,
                status=q.status,
                created_at=q.created_at
            )

    return InterviewSessionResponse(
        id=session.id,
        user_id=session.user_id,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        duration_minutes=session.duration_minutes,
        answer_method=session.answer_method,
        target_role=session.target_role or "",
        target_company=session.target_company or "",
        total_questions_planned=session.total_questions_planned,
        status=session.status,
        overall_score=round(session.overall_score, 1),
        started_at=session.started_at,
        completed_at=session.completed_at,
        current_question=current_q,
        questions_completed=completed_q_count,
        questions_total=session.total_questions_planned
    )

@router.post("/start", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
def start_interview(
    payload: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()

    target_role = payload.target_role or (profile.target_role if profile else "") or "Software Engineer"
    target_company = payload.target_company or (profile.target_company if profile else "") or "Technology Company"
    job_description = payload.job_description or (profile.job_description if profile else "") or ""

    # Create new session
    session = InterviewSession(
        user_id=current_user.id,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        duration_minutes=payload.duration_minutes,
        answer_method=payload.answer_method,
        target_role=target_role,
        target_company=target_company,
        job_description=job_description,
        total_questions_planned=payload.total_questions,
        status="in_progress",
        started_at=datetime.now(timezone.utc)
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate Question #1
    q1_data = generate_next_question_ai(
        profile=profile,
        session=session,
        previous_qa=[],
        current_order=1
    )

    q1 = InterviewQuestion(
        session_id=session.id,
        question_text=q1_data["question_text"],
        question_category=q1_data.get("question_category", "Introduction"),
        difficulty=q1_data.get("difficulty", payload.difficulty),
        question_order=1,
        is_follow_up=False,
        status="current"
    )
    db.add(q1)
    db.commit()
    db.refresh(session)

    return _format_session_response(session)

@router.get("", response_model=List[InterviewSessionResponse])
def get_all_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).options(joinedload(InterviewSession.questions)).order_by(InterviewSession.started_at.desc()).all()
    return [_format_session_response(s) for s in sessions]

@router.get("/stats/summary", response_model=InterviewSummaryStats)
def get_interview_summary_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).options(
        joinedload(InterviewSession.answers).joinedload(InterviewAnswer.evaluation),
        joinedload(InterviewSession.questions)
    ).order_by(InterviewSession.completed_at.asc()).all()

    total_interviews = len(sessions)
    if total_interviews == 0:
        return InterviewSummaryStats()

    scores = [s.overall_score for s in sessions if s.overall_score > 0]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    best_score = round(max(scores), 1) if scores else 0.0

    total_q_answered = 0
    category_scores_map: Dict[str, List[float]] = {}
    score_trend = []

    for s in sessions:
        date_str = s.completed_at.strftime("%b %d") if s.completed_at else s.started_at.strftime("%b %d")
        score_trend.append({
            "session_id": s.id,
            "date": date_str,
            "score": round(s.overall_score, 1),
            "type": s.interview_type
        })
        for ans in s.answers:
            total_q_answered += 1
            if ans.evaluation and ans.question:
                cat = ans.question.question_category or "General"
                category_scores_map.setdefault(cat, []).append(ans.evaluation.overall_score * 10)

    category_performance = {}
    for cat, cat_scores in category_scores_map.items():
        category_performance[cat] = round(sum(cat_scores) / len(cat_scores), 1)

    recent_sessions = [_format_session_response(s) for s in reversed(sessions[-5:])]

    return InterviewSummaryStats(
        total_interviews=total_interviews,
        average_score=avg_score,
        best_score=best_score,
        total_questions_answered=total_q_answered,
        recent_sessions=recent_sessions,
        category_performance=category_performance,
        score_trend=score_trend
    )

@router.get("/{session_id}", response_model=InterviewSessionResponse)
def get_interview_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).options(joinedload(InterviewSession.questions)).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found or you do not have permission to view it."
        )

    return _format_session_response(session)

@router.post("/{session_id}/answer", response_model=AnswerSubmissionResult)
def submit_answer(
    session_id: int,
    payload: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).options(joinedload(InterviewSession.questions)).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This interview session has already been {session.status}."
        )

    # Find the current active question
    current_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id,
        InterviewQuestion.status == "current"
    ).first()

    if not current_q:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active question available to answer in this session."
        )

    # Check for duplicate answer
    existing_answer = db.query(InterviewAnswer).filter(
        InterviewAnswer.question_id == current_q.id
    ).first()
    if existing_answer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An answer for this question has already been submitted and cannot be modified."
        )

    # Save Candidate's Answer
    answer = InterviewAnswer(
        question_id=current_q.id,
        session_id=session.id,
        answer_text=payload.answer_text.strip(),
        answer_method=payload.answer_method,
        audio_file_path=payload.audio_file_path,
        transcript=payload.transcript or payload.answer_text.strip(),
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(answer)
    current_q.status = "answered"
    db.commit()
    db.refresh(answer)

    # Run AI evaluation
    eval_dict = evaluate_answer_ai(
        question_text=current_q.question_text,
        question_category=current_q.question_category,
        candidate_answer=answer.answer_text,
        interview_type=session.interview_type,
        difficulty=session.difficulty
    )

    evaluation = AnswerEvaluation(
        answer_id=answer.id,
        relevance_score=eval_dict["relevance_score"],
        completeness_score=eval_dict["completeness_score"],
        accuracy_score=eval_dict["accuracy_score"],
        clarity_score=eval_dict["clarity_score"],
        structure_score=eval_dict["structure_score"],
        practical_understanding_score=eval_dict["practical_understanding_score"],
        overall_score=eval_dict["overall_score"],
        what_did_well=eval_dict["what_did_well"],
        missing_information=eval_dict["missing_information"],
        incorrect_statements=eval_dict["incorrect_statements"],
        how_to_improve=eval_dict["how_to_improve"],
        important_keywords=json.dumps(eval_dict.get("important_keywords", [])),
        suggested_answer=eval_dict["suggested_answer"]
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    # Audio analysis if voice or if duration provided
    audio_analysis_res = None
    if payload.answer_method == "voice" or payload.speaking_duration:
        audio_data = analyze_transcript_communication(
            text=answer.transcript or answer.answer_text,
            duration_seconds=payload.speaking_duration or 0.0
        )
        audio_rec = AudioAnalysis(
            answer_id=answer.id,
            speaking_duration=audio_data["speaking_duration"],
            words_per_minute=audio_data["words_per_minute"],
            filler_word_count=audio_data["filler_word_count"],
            filler_word_details=json.dumps(audio_data["filler_word_details"]),
            pause_information=audio_data["pause_information"],
            repeated_words=json.dumps(audio_data["repeated_words"])
        )
        db.add(audio_rec)
        db.commit()
        db.refresh(audio_rec)
        audio_analysis_res = AudioAnalysisResponse(
            speaking_duration=audio_rec.speaking_duration,
            words_per_minute=audio_rec.words_per_minute,
            filler_word_count=audio_rec.filler_word_count,
            filler_word_details=audio_data["filler_word_details"],
            pause_information=audio_rec.pause_information,
            repeated_words=audio_data["repeated_words"]
        )

    # Gather all completed QA pairs for context
    all_answered_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id,
        InterviewQuestion.status == "answered"
    ).options(joinedload(InterviewQuestion.answer)).order_by(InterviewQuestion.question_order.asc()).all()

    previous_qa = []
    for q in all_answered_q:
        if q.answer:
            previous_qa.append({
                "question_order": q.question_order,
                "question_text": q.question_text,
                "category": q.question_category,
                "is_follow_up": q.is_follow_up,
                "answer_text": q.answer.answer_text
            })

    total_answered = len(all_answered_q)
    is_completed = total_answered >= session.total_questions_planned
    next_q_res = None

    if is_completed:
        # Finalize the interview session and compute final performance report
        _finalize_interview_session(session, db)
    else:
        # Generate the next question
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
        next_order = total_answered + 1

        next_q_data = generate_next_question_ai(
            profile=profile,
            session=session,
            previous_qa=previous_qa,
            current_order=next_order
        )

        next_q = InterviewQuestion(
            session_id=session.id,
            question_text=next_q_data["question_text"],
            question_category=next_q_data.get("question_category", "Technical"),
            difficulty=next_q_data.get("difficulty", session.difficulty),
            question_order=next_order,
            is_follow_up=next_q_data.get("is_follow_up", False),
            parent_question_id=current_q.id if next_q_data.get("is_follow_up") else None,
            status="current"
        )
        db.add(next_q)
        db.commit()
        db.refresh(next_q)

        next_q_res = InterviewQuestionResponse(
            id=next_q.id,
            session_id=next_q.session_id,
            question_text=next_q.question_text,
            question_category=next_q.question_category,
            difficulty=next_q.difficulty,
            question_order=next_q.question_order,
            is_follow_up=next_q.is_follow_up,
            parent_question_id=next_q.parent_question_id,
            status=next_q.status,
            created_at=next_q.created_at
        )

    eval_res = AnswerEvaluationResponse(
        id=evaluation.id,
        relevance_score=evaluation.relevance_score,
        completeness_score=evaluation.completeness_score,
        accuracy_score=evaluation.accuracy_score,
        clarity_score=evaluation.clarity_score,
        structure_score=evaluation.structure_score,
        practical_understanding_score=evaluation.practical_understanding_score,
        overall_score=evaluation.overall_score,
        what_did_well=evaluation.what_did_well,
        missing_information=evaluation.missing_information,
        incorrect_statements=evaluation.incorrect_statements,
        how_to_improve=evaluation.how_to_improve,
        important_keywords=eval_dict.get("important_keywords", []),
        suggested_answer=evaluation.suggested_answer
    )

    return AnswerSubmissionResult(
        evaluation=eval_res,
        audio_analysis=audio_analysis_res,
        next_question=next_q_res,
        is_completed=is_completed,
        session_status=session.status,
        message="Interview completed! Your performance report is ready." if is_completed else "Answer evaluated successfully."
    )

@router.post("/{session_id}/finish", response_model=InterviewSessionResponse)
def finish_interview(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).options(joinedload(InterviewSession.questions)).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.status != "completed":
        _finalize_interview_session(session, db)

    return _format_session_response(session)

@router.delete("/{session_id}", status_code=status.HTTP_200_OK)
def delete_interview(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found or you do not have permission to delete it."
        )

    db.delete(session)
    db.commit()
    return {"message": "Interview session deleted successfully", "id": session_id}

def _finalize_interview_session(session: InterviewSession, db: Session):
    """Calculates overall score, compiles category performance and generates executive report."""
    answers = db.query(InterviewAnswer).filter(
        InterviewAnswer.session_id == session.id
    ).options(
        joinedload(InterviewAnswer.evaluation),
        joinedload(InterviewAnswer.question),
        joinedload(InterviewAnswer.audio_analysis)
    ).all()

    scores = []
    category_scores_map = {}
    qa_evals = []

    for a in answers:
        if a.evaluation:
            scores.append(a.evaluation.overall_score)
            cat = a.question.question_category if a.question else "General"
            category_scores_map.setdefault(cat, []).append(a.evaluation.overall_score * 10)
            qa_evals.append({
                "question": a.question.question_text if a.question else "",
                "category": cat,
                "answer": a.answer_text,
                "score": a.evaluation.overall_score,
                "strengths": a.evaluation.what_did_well,
                "weaknesses": a.evaluation.missing_information
            })

    # Overall score scaled to 100
    avg_score = (sum(scores) / len(scores)) if scores else 0.0
    overall_score_100 = round(avg_score * 10, 1)

    # Category averages
    cat_final = {}
    for cat, c_scores in category_scores_map.items():
        cat_final[cat] = round(sum(c_scores) / len(c_scores), 1)

    session.overall_score = overall_score_100
    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    session.category_scores = json.dumps(cat_final)

    # Synthesize qualitative recommendations
    report_data = generate_final_report_ai(session, qa_evals)
    session.report_overview = report_data.get("report_overview", "")
    session.strengths_summary = json.dumps(report_data.get("strengths", []))
    session.weaknesses_summary = json.dumps(report_data.get("weaknesses", []))
    session.recommendations = json.dumps(report_data.get("recommendations", []))

    db.commit()
    db.refresh(session)
