import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.interview import (
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    AnswerEvaluation,
    AudioAnalysis
)
from backend.app.schemas.interview import (
    InterviewReportResponse,
    QuestionEvaluationItem,
    CategoryScoreItem,
    AnswerEvaluationResponse,
    AudioAnalysisResponse
)
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Interview Performance Reports"])

def _build_full_report(session: InterviewSession, db: Session) -> InterviewReportResponse:
    # Query all questions and answers
    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id
    ).options(
        joinedload(InterviewQuestion.answer).joinedload(InterviewAnswer.evaluation),
        joinedload(InterviewQuestion.answer).joinedload(InterviewAnswer.audio_analysis)
    ).order_by(InterviewQuestion.question_order.asc()).all()

    total_q = len(questions)
    completed_q = 0
    skipped_q = 0
    answer_eval_items: List[QuestionEvaluationItem] = []
    category_map: Dict[str, List[float]] = {}
    answer_scores = []
    total_audio_duration = 0.0
    total_audio_words = 0
    combined_fillers: Dict[str, int] = {}
    has_audio = False

    for q in questions:
        if q.status == "answered" and q.answer:
            completed_q += 1
            ans = q.answer
            eval_obj = ans.evaluation
            audio_obj = ans.audio_analysis

            eval_res = None
            if eval_obj:
                answer_scores.append(eval_obj.overall_score)
                cat = q.question_category or "General"
                category_map.setdefault(cat, []).append(eval_obj.overall_score * 10)
                eval_res = AnswerEvaluationResponse(
                    id=eval_obj.id,
                    relevance_score=eval_obj.relevance_score,
                    completeness_score=eval_obj.completeness_score,
                    accuracy_score=eval_obj.accuracy_score,
                    clarity_score=eval_obj.clarity_score,
                    structure_score=eval_obj.structure_score,
                    practical_understanding_score=eval_obj.practical_understanding_score,
                    overall_score=eval_obj.overall_score,
                    what_did_well=eval_obj.what_did_well,
                    missing_information=eval_obj.missing_information,
                    incorrect_statements=eval_obj.incorrect_statements,
                    how_to_improve=eval_obj.how_to_improve,
                    important_keywords=eval_obj.important_keywords,
                    suggested_answer=eval_obj.suggested_answer
                )

            audio_res = None
            if audio_obj:
                has_audio = True
                total_audio_duration += audio_obj.speaking_duration
                # Aggregate words estimate from WPM
                total_audio_words += int((audio_obj.words_per_minute * audio_obj.speaking_duration) / 60.0)
                try:
                    f_details = json.loads(audio_obj.filler_word_details) if audio_obj.filler_word_details else {}
                    for f_word, count in f_details.items():
                        combined_fillers[f_word] = combined_fillers.get(f_word, 0) + count
                except Exception:
                    pass

                audio_res = AudioAnalysisResponse(
                    speaking_duration=audio_obj.speaking_duration,
                    words_per_minute=audio_obj.words_per_minute,
                    filler_word_count=audio_obj.filler_word_count,
                    filler_word_details=audio_obj.filler_word_details,
                    pause_information=audio_obj.pause_information,
                    repeated_words=audio_obj.repeated_words
                )

            answer_eval_items.append(QuestionEvaluationItem(
                question_order=q.question_order,
                category=q.question_category or "Technical",
                difficulty=q.difficulty,
                question=q.question_text,
                candidate_answer=ans.answer_text,
                answer_method=ans.answer_method,
                score=eval_obj.overall_score if eval_obj else 0.0,
                evaluation=eval_res,
                audio_analysis=audio_res
            ))
        elif q.status == "skipped":
            skipped_q += 1

    # Category Scores calculation
    category_scores: List[CategoryScoreItem] = []
    for cat, scores in category_map.items():
        avg = round(sum(scores) / len(scores), 1)
        category_scores.append(CategoryScoreItem(
            category=cat,
            score=avg,
            questions_count=len(scores)
        ))

    # Overall Scores
    avg_answer_score = round(sum(answer_scores) / len(answer_scores), 1) if answer_scores else 0.0
    overall_score = round(session.overall_score, 1) if session.overall_score > 0 else round(avg_answer_score * 10, 1)

    # Calculate actual duration
    actual_seconds = 0
    if session.completed_at and session.started_at:
        actual_seconds = int((session.completed_at - session.started_at).total_seconds())

    # Qualitative items from session report
    try:
        strengths = json.loads(session.strengths_summary) if session.strengths_summary else []
    except Exception:
        strengths = []
    if not strengths:
        strengths = [
            "Addressed key interview prompts with direct and confident answers.",
            "Demonstrated foundational understanding of stated technical stack."
        ]

    try:
        weaknesses = json.loads(session.weaknesses_summary) if session.weaknesses_summary else []
    except Exception:
        weaknesses = []
    if not weaknesses:
        weaknesses = [
            "Could expand on architectural trade-offs and edge case handling.",
            "Incorporate quantifiable business impact metrics into answers."
        ]

    try:
        recommendations = json.loads(session.recommendations) if session.recommendations else []
    except Exception:
        recommendations = []
    if not recommendations:
        recommendations = [
            "Practice the STAR framework (Situation, Task, Action, Result) for behavioral answers.",
            "Explain system boundaries and data flow before diving into low-level code details."
        ]

    # Communication Analysis
    if has_audio and total_audio_duration > 0:
        overall_wpm = round((total_audio_words / total_audio_duration) * 60.0, 1) if total_audio_duration > 0 else 0.0
        total_fillers_sum = sum(combined_fillers.values())
        communication_analysis = {
            "mode": "voice",
            "overall_words_per_minute": overall_wpm,
            "total_speaking_duration_seconds": round(total_audio_duration, 1),
            "total_filler_words": total_fillers_sum,
            "filler_breakdown": combined_fillers,
            "observation": (
                f"Spoke at an average of {overall_wpm} WPM across voice answers. "
                f"Recorded {total_fillers_sum} filler words total. "
                "Pacing is natural and conversational."
            ),
            "limitation_note": "Acoustic observations measure recorded speaking rate and word frequencies only. Pronunciation and subjective personality are not inferred."
        }
    else:
        communication_analysis = {
            "mode": "text",
            "observation": "Answers demonstrated coherent written phrasing and structured logical steps.",
            "recommendation": "Try Voice Interview mode in your next session to practice spoken fluency, cadence, and real-time delivery."
        }

    next_steps = [
        "Review missed keywords highlighted in individual question breakdowns.",
        "Practice answers using the dedicated Script Learning module.",
        f"Schedule another mock interview focusing on {session.interview_type} scenarios."
    ]

    return InterviewReportResponse(
        session_id=session.id,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        started_at=session.started_at,
        completed_at=session.completed_at,
        duration_minutes=session.duration_minutes,
        actual_duration_seconds=actual_seconds,
        answer_method=session.answer_method,
        target_role=session.target_role or "Software Engineer",
        target_company=session.target_company or "Target Company",
        overall_score=overall_score,
        average_answer_score=avg_answer_score,
        total_questions=total_q,
        completed_questions=completed_q,
        skipped_questions=skipped_q,
        category_scores=category_scores,
        answers_evaluation=answer_eval_items,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        communication_analysis=communication_analysis,
        next_steps=next_steps
    )

@router.get("", response_model=List[InterviewReportResponse])
def get_all_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed"
    ).order_by(InterviewSession.completed_at.desc()).all()

    return [_build_full_report(s, db) for s in sessions]

@router.get("/{session_id}", response_model=InterviewReportResponse)
def get_report_by_session_id(
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
            detail="Interview report not found or you do not have permission to view it."
        )

    return _build_full_report(session, db)
