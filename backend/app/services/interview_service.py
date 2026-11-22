import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from backend.app.core.config import settings
from backend.app.models.profile import CandidateProfile
from backend.app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer, AnswerEvaluation
from backend.app.services.gemini_service import (
    generate_next_question_gemini,
    evaluate_answer_gemini,
    generate_final_report_gemini
)

logger = logging.getLogger(__name__)

def generate_next_question_ai(
    profile: Optional[CandidateProfile],
    session: InterviewSession,
    previous_qa: List[Dict[str, Any]],
    current_order: int
) -> Dict[str, Any]:
    """Generates the next question using Google Gemini API or smart deterministic fallback."""
    return generate_next_question_gemini(
        profile=profile,
        session=session,
        previous_qa=previous_qa,
        current_order=current_order
    )

def evaluate_answer_ai(
    question_text: str,
    question_category: str,
    candidate_answer: str,
    interview_type: str,
    difficulty: str,
    profile: Optional[CandidateProfile] = None,
    session: Optional[InterviewSession] = None,
    speaking_duration: Optional[float] = None
) -> Dict[str, Any]:
    """Evaluates candidate answer using Google Gemini API with Python-computed weighted scoring."""
    # Create mock session if not passed for standalone evaluation
    if session is None:
        session = InterviewSession(
            target_role="Software Engineer",
            target_company="Technology Company",
            interview_type=interview_type,
            difficulty=difficulty
        )

    return evaluate_answer_gemini(
        profile=profile,
        session=session,
        question_text=question_text,
        question_category=question_category,
        answer_text=candidate_answer,
        speaking_duration=speaking_duration
    )

def generate_final_report_ai(
    session: InterviewSession,
    qa_evaluations: List[Dict[str, Any]],
    profile: Optional[CandidateProfile] = None
) -> Dict[str, Any]:
    """Generates the executive summary, strengths, weaknesses, recommendations, and next steps via Gemini."""
    return generate_final_report_gemini(
        profile=profile,
        session=session,
        qa_evaluations=qa_evaluations
    )

# ---------------------------------------------------------------------
# Session Management & Orchestration (Preserved from Phase 2)
# ---------------------------------------------------------------------

def create_interview_session(
    db,
    user_id: int,
    profile: Optional[CandidateProfile],
    interview_type: str,
    difficulty: str,
    duration_minutes: int,
    total_questions: int,
    answer_method: str,
    target_role: Optional[str] = None,
    target_company: Optional[str] = None
) -> InterviewSession:
    """Initializes a new interview session and generates Question #1."""
    role = target_role or (profile.target_role if profile else "Software Engineer")
    company = target_company or (profile.target_company if profile else "Technology Company")

    session = InterviewSession(
        user_id=user_id,
        interview_type=interview_type,
        difficulty=difficulty,
        duration_minutes=duration_minutes,
        total_questions_planned=total_questions,
        answer_method=answer_method,
        target_role=role,
        target_company=company,
        status="in_progress",
        started_at=datetime.now(timezone.utc)
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate Question #1
    q1_data = generate_next_question_ai(profile, session, [], 1)
    q1 = InterviewQuestion(
        session_id=session.id,
        question_order=1,
        question_text=q1_data["question_text"],
        question_category=q1_data.get("question_category", "Introduction"),
        difficulty=q1_data.get("difficulty", difficulty),
        is_follow_up=q1_data.get("is_follow_up", False),
        created_at=datetime.now(timezone.utc)
    )
    db.add(q1)
    session.current_question_index = 1
    db.commit()
    db.refresh(session)

    return session


def get_interview_session_details(db, session_id: int, user_id: int) -> Optional[InterviewSession]:
    """Retrieves an interview session ensuring user ownership."""
    return db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id
    ).first()


def submit_interview_answer(
    db,
    session: InterviewSession,
    profile: Optional[CandidateProfile],
    answer_text: str,
    answer_method: str,
    audio_file_path: Optional[str] = None,
    transcript: Optional[str] = None,
    speaking_duration: Optional[float] = None
) -> Tuple[InterviewAnswer, AnswerEvaluation, Optional[InterviewQuestion], bool]:
    """
    Evaluates current question answer, saves scores, and prepares next question or marks completed.
    Returns (answer, evaluation, next_question, is_completed).
    """
    current_q = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id,
        InterviewQuestion.question_order == session.current_question_index
    ).first()

    if not current_q:
        raise ValueError(f"No active question found for index {session.current_question_index}")

    existing_ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == current_q.id).first()
    if existing_ans:
        raise ValueError("This question has already been answered.")

    # 1. Save candidate answer
    ans = InterviewAnswer(
        question_id=current_q.id,
        answer_text=answer_text,
        answer_method=answer_method,
        audio_file_path=audio_file_path,
        transcript=transcript,
        speaking_duration=speaking_duration,
        created_at=datetime.now(timezone.utc)
    )
    db.add(ans)
    db.commit()
    db.refresh(ans)

    # 2. Evaluate answer with Gemini
    eval_data = evaluate_answer_ai(
        question_text=current_q.question_text,
        question_category=current_q.question_category,
        candidate_answer=answer_text,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        profile=profile,
        session=session,
        speaking_duration=speaking_duration
    )

    evaluation = AnswerEvaluation(
        answer_id=ans.id,
        relevance_score=eval_data["relevance_score"],
        completeness_score=eval_data["completeness_score"],
        accuracy_score=eval_data["accuracy_score"],
        clarity_score=eval_data["clarity_score"],
        structure_score=eval_data["structure_score"],
        practical_understanding_score=eval_data["practical_understanding_score"],
        overall_score=eval_data["overall_score"],
        what_did_well=eval_data["what_did_well"],
        missing_information=eval_data["missing_information"],
        incorrect_statements=eval_data["incorrect_statements"],
        how_to_improve=eval_data["how_to_improve"],
        important_keywords=eval_data["important_keywords"],
        suggested_answer=eval_data["suggested_answer"],
        created_at=datetime.now(timezone.utc)
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    # Check if session is finished
    next_order = session.current_question_index + 1
    is_completed = next_order > session.total_questions_planned

    next_q = None
    if not is_completed:
        # Build prior Q&A context
        all_questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session.id).order_by(InterviewQuestion.question_order).all()
        prev_context = []
        for q in all_questions:
            q_ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == q.id).first()
            if q_ans:
                prev_context.append({
                    "order": q.question_order,
                    "question_text": q.question_text,
                    "category": q.question_category,
                    "is_follow_up": q.is_follow_up,
                    "answer_text": q_ans.answer_text
                })

        next_q_data = generate_next_question_ai(profile, session, prev_context, next_order)
        next_q = InterviewQuestion(
            session_id=session.id,
            question_order=next_order,
            question_text=next_q_data["question_text"],
            question_category=next_q_data.get("question_category", "Technical"),
            difficulty=next_q_data.get("difficulty", session.difficulty),
            is_follow_up=next_q_data.get("is_follow_up", False),
            created_at=datetime.now(timezone.utc)
        )
        db.add(next_q)
        session.current_question_index = next_order
        db.commit()
        db.refresh(session)
        db.refresh(next_q)
    else:
        # Finalize session
        finalize_interview_session(db, session, profile)

    return ans, evaluation, next_q, is_completed


def finalize_interview_session(db, session: InterviewSession, profile: Optional[CandidateProfile] = None):
    """Computes session average scores and synthesizes final Gemini performance report."""
    if session.status == "completed":
        return

    # Gather all evaluations
    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session.id).all()
    q_ids = [q.id for q in questions]
    answers = db.query(InterviewAnswer).filter(InterviewAnswer.question_id.in_(q_ids)).all() if q_ids else []
    a_ids = [a.id for a in answers]
    evaluations = db.query(AnswerEvaluation).filter(AnswerEvaluation.answer_id.in_(a_ids)).all() if a_ids else []

    if evaluations:
        n = len(evaluations)
        avg_overall = sum(e.overall_score for e in evaluations) / n * 10.0  # Scale 1-10 to 1-100
        avg_rel = sum(e.relevance_score for e in evaluations) / n
        avg_comp = sum(e.completeness_score for e in evaluations) / n
        avg_acc = sum(e.accuracy_score for e in evaluations) / n
        avg_cla = sum(e.clarity_score for e in evaluations) / n
        avg_struc = sum(e.structure_score for e in evaluations) / n
        avg_prac = sum(e.practical_understanding_score for e in evaluations) / n

        session.overall_score = round(avg_overall, 1)
        session.relevance_score = round(avg_rel, 1)
        session.completeness_score = round(avg_comp, 1)
        session.accuracy_score = round(avg_acc, 1)
        session.clarity_score = round(avg_cla, 1)
        session.structure_score = round(avg_struc, 1)
        session.practical_understanding_score = round(avg_prac, 1)
    else:
        session.overall_score = 0.0

    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)

    # Synthesize transcript summary for Gemini report
    qa_evals_summary = []
    for q in questions:
        ans = next((a for a in answers if a.question_id == q.id), None)
        ev = next((e for e in evaluations if ans and e.answer_id == ans.id), None)
        qa_evals_summary.append({
            "order": q.question_order,
            "category": q.question_category,
            "question": q.question_text,
            "answer": ans.answer_text if ans else "No answer recorded.",
            "overall_score": ev.overall_score if ev else 0.0,
            "what_did_well": ev.what_did_well if ev else "",
            "missing_information": ev.missing_information if ev else ""
        })

    report = generate_final_report_ai(session, qa_evals_summary, profile=profile)
    session.report_overview = report.get("report_overview", "")
    session.strengths = report.get("strengths", [])
    session.weaknesses = report.get("weaknesses", [])
    session.recommendations = report.get("recommendations", [])
    session.next_steps = report.get("next_steps", [])

    db.commit()
    db.refresh(session)


def get_user_interview_history(db, user_id: int) -> List[InterviewSession]:
    """Returns all interview sessions for the user sorted by start date desc."""
    return db.query(InterviewSession).filter(
        InterviewSession.user_id == user_id
    ).order_by(InterviewSession.started_at.desc()).all()
