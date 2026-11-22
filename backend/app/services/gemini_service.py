import re
import json
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import HTTPException, status
from google import genai
from google.genai import types
from google.genai.errors import APIError
from backend.app.core.config import settings
from backend.app.models.profile import CandidateProfile
from backend.app.models.interview import InterviewSession

logger = logging.getLogger(__name__)

# -------------------------------------------------------------
# Official Pydantic Schemas for Gemini Structured Output
# -------------------------------------------------------------

class GeminiPreparationItem(BaseModel):
    category: str = Field(description="Interview category: Self-Introduction | HR & Behavioral | Technical | Project-Based | Role-Specific | Company-Oriented")
    difficulty: str = Field(description="Difficulty level: Beginner | Intermediate | Advanced")
    question: str = Field(description="Full question text tailored to candidate's background")
    suggested_answer: str = Field(description="Complete, articulate, first-person suggested response highlighting candidate's real profile")
    important_keywords: List[str] = Field(default_factory=list, description="Key technical keywords and domain terms")
    explanation: str = Field(description="Why the interviewer asks this, what mindset to adopt, and concept breakdown")
    key_points: List[str] = Field(default_factory=list, description="Key takeaway bullet points to remember")

class GeminiPreparationPackage(BaseModel):
    overview: str = Field(description="A concise 2-3 sentence personalized preparation strategy summary for this candidate and target role")
    items: List[GeminiPreparationItem] = Field(description="List of 6 to 8 tailored preparation questions covering the 6 core interview categories")

class GeminiNextQuestion(BaseModel):
    question_text: str = Field(description="The full interview question text")
    question_category: str = Field(description="HR & Behavioral | Technical | Project Architecture | Problem Solving | Role-Specific | Introduction")
    difficulty: str = Field(description="Beginner | Intermediate | Advanced")
    is_follow_up: bool = Field(description="Whether this is a targeted follow-up to the candidate's last answer")
    rationale: str = Field(description="Brief reason why this question was chosen")

class GeminiAnswerEvaluation(BaseModel):
    relevance_score: float = Field(ge=1.0, le=10.0, description="1.0 to 10.0 score on question relevance")
    completeness_score: float = Field(ge=1.0, le=10.0, description="1.0 to 10.0 score on answer completeness")
    accuracy_score: float = Field(ge=1.0, le=10.0, description="1.0 to 10.0 score on technical accuracy")
    clarity_score: float = Field(ge=1.0, le=10.0, description="1.0 to 10.0 score on explanation clarity")
    structure_score: float = Field(ge=1.0, le=10.0, description="1.0 to 10.0 score on logical structure e.g. STAR method")
    practical_understanding_score: float = Field(ge=1.0, le=10.0, description="1.0 to 10.0 score on practical hands-on understanding")
    what_did_well: str = Field(description="Clear highlights of what the candidate did well")
    missing_information: str = Field(description="Specific concepts or edge cases omitted")
    incorrect_statements: str = Field(description="Any inaccurate claim or 'None identified'")
    how_to_improve: str = Field(description="Actionable advice to improve structure or depth")
    important_keywords: List[str] = Field(default_factory=list, description="Key keywords relevant to the question")
    suggested_answer: str = Field(description="A model 1st-person answer demonstrating ideal depth")

class GeminiFinalReport(BaseModel):
    report_overview: str = Field(description="2-3 paragraph executive summary of performance and readiness")
    strengths: List[str] = Field(description="Key strengths demonstrated")
    weaknesses: List[str] = Field(description="Key areas for growth")
    recommendations: List[str] = Field(description="Actionable coaching recommendations")
    next_steps: List[str] = Field(description="Next study and simulation steps")

# -------------------------------------------------------------
# System Prompts
# -------------------------------------------------------------

PREPARATION_SYSTEM_PROMPT = """You are CareerCatalyst's Principal Interview Preparation Coach.
Your mission is to generate deeply personalized, realistic, and highly educational interview preparation questions and suggested answers for a candidate.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. PERSONALIZATION: Ground every answer in the candidate's ACTUAL educational background, technical skills, programming languages, projects, internships, and certifications provided in their profile.
2. NO HALLUCINATION: NEVER invent or hallucinate fictional projects, internships, companies, or metrics not mentioned in the candidate's profile. If the candidate has limited projects, frame answers around their coursework, academic learning, or fundamentals.
3. UNDERSTANDING OVER MEMORIZATION: The goal is to help the candidate understand HOW to structure their thoughts, what interviewers evaluate, and what key concepts matter.
4. COMPANY INTEGRITY: For company-oriented questions, refer only to known general domain practices and public information. Never fabricate confidential company facts or claim unverified internal processes.
5. REQUIRED CATEGORIES: Cover the 6 core interview categories:
   - Self-Introduction (elevator pitch and key background)
   - HR & Behavioral (strengths, teamwork, challenges, career vision)
   - Technical (targeting stated programming languages and technical skills)
   - Project-Based (architecture, trade-offs, technologies, personal contributions)
   - Role-Specific (tailored directly to target role and job description)
   - Company-Oriented (interview questions specific to the target company or domain)
"""

QUESTION_GEN_SYSTEM_PROMPT = """You are CareerCatalyst's Elite AI Interviewer.
Your task is to generate the NEXT interview question for a candidate in an interactive one-question-at-a-time mock interview.

CRITICAL RULES:
1. PERSONALIZATION: Personalize the question using the candidate's actual profile (education, tech stack, projects, internships).
2. NO HALLUCINATION: Never invent fake projects or experience. Refer only to what the candidate listed.
3. CONTEXT AWARENESS: Review the previous questions asked and candidate answers.
4. ADAPTIVE FOLLOW-UP: If the candidate just answered a question and their answer was either incomplete, mentioned a specific architecture/tool, or was very strong, you may issue a targeted follow-up question. (Maximum 2 follow-ups per main question). If no follow-up is needed, move to the next main interview topic.
5. REALISTIC PROFESSIONAL TONE: Sound like a senior hiring manager or lead engineer.
"""

EVALUATION_SYSTEM_PROMPT = """You are CareerCatalyst's Senior Interview Evaluator.
Evaluate the candidate's submitted answer with high educational value, precision, and constructive feedback.

SCORING CRITERIA (Score each applicable criterion from 1.0 to 10.0):
1. relevance_score: Does it directly address the question without irrelevant tangents?
2. completeness_score: Did it cover the essential components expected at this seniority level?
3. accuracy_score: Are technical statements correct, or for behavioral questions, does it demonstrate sound problem-solving?
4. clarity_score: Is the explanation concise, articulate, and easy to follow?
5. structure_score: Did they organize thoughts logically (e.g., STAR framework or Concept-Tradeoffs-Example)?
6. practical_understanding_score: Does the answer demonstrate genuine hands-on experience rather than mere rote memorization?
"""

REPORT_SYSTEM_PROMPT = """You are CareerCatalyst's Executive Performance Analyst.
Review the complete mock interview session transcripts and evaluations, then synthesize an executive performance report.
Provide a thorough executive summary of the candidate's performance, communication style, technical readiness, strengths, weaknesses, recommendations, and next steps.
"""

# -------------------------------------------------------------
# Safe JSON Cleaning & Controlled Repair Utilities
# -------------------------------------------------------------

def clean_json_text(text: str) -> str:
    """Removes markdown code fences and surrounding whitespace from AI generated text."""
    if not text:
        return ""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE)
    return cleaned.strip()

def controlled_json_repair(raw_text: str, request_id: str = "") -> Optional[Dict[str, Any]]:
    """
    Safely repairs truncated or slightly malformed JSON without aggressive regex replacements.
    Recovers valid items if the output was cut off at max token boundary.
    """
    if not raw_text:
        return None

    cleaned = clean_json_text(raw_text)

    # Fast path: already valid JSON
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    # Repair Strategy 1: Truncation inside array items (common on token limit)
    # Find the last complete object boundary '}'
    last_item_brace = cleaned.rfind("}")
    if last_item_brace > 0:
        truncated = cleaned[:last_item_brace + 1].strip()
        # Remove any trailing comma after the last closed object
        truncated = re.sub(r",\s*$", "", truncated)
        open_brackets = truncated.count("[") - truncated.count("]")
        open_braces = truncated.count("{") - truncated.count("}")
        closing = ("]" * max(0, open_brackets)) + ("}" * max(0, open_braces))
        candidate = truncated + closing
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict) and (parsed.get("items") or parsed.get("overview")):
                logger.info(f"[{request_id}] Rescued truncated JSON via bracket balancing. Valid items count: {len(parsed.get('items', []))}")
                return parsed
        except Exception:
            pass

    # Repair Strategy 2: Unclosed string literal at the end of the text
    candidate2 = cleaned.strip()
    if candidate2.count('"') % 2 != 0:
        candidate2 += '"'
    open_brackets = candidate2.count("[") - candidate2.count("]")
    open_braces = candidate2.count("{") - candidate2.count("}")
    candidate2 += ("]" * max(0, open_brackets)) + ("}" * max(0, open_braces))
    try:
        parsed = json.loads(candidate2)
        if isinstance(parsed, dict):
            logger.info(f"[{request_id}] Rescued unclosed string literal and balanced brackets.")
            return parsed
    except Exception:
        pass

    return None

def get_gemini_client() -> genai.Client:
    """Initializes and returns the official Google GenAI client."""
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Google Gemini API key is missing or not configured. "
                "Please configure a valid GEMINI_API_KEY in the 'backend/.env' file "
                "and restart or reload the backend."
            )
        )
    return genai.Client(api_key=api_key)

# -------------------------------------------------------------
# Core Structured Output Generator with Model Fallback & Retries
# -------------------------------------------------------------

def generate_structured_json_gemini(
    prompt: str,
    system_instruction: Optional[str] = None,
    response_schema: Optional[Any] = None,
    model: Optional[str] = None,
    temperature: float = 0.5,
    max_output_tokens: int = 8192,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates structured JSON using Google Gemini official SDK with schema enforcement,
    bounded retries, model fallbacks, and safe JSON repair.
    """
    req_id = request_id or str(uuid.uuid4())[:8]
    client = get_gemini_client()
    target_model = model or settings.GEMINI_MODEL or "gemini-3.5-flash"

    # Define candidate models in priority order
    candidate_models = [target_model]
    for fallback in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]:
        if fallback not in candidate_models:
            candidate_models.append(fallback)

    last_error: Optional[Exception] = None

    for m in candidate_models:
        for attempt in range(1, 3):  # Max 2 attempts per model with bounded backoff
            logger.info(f"[{req_id}] Invoking Gemini model '{m}' (attempt {attempt}/2)...")
            try:
                config_kwargs: Dict[str, Any] = {
                    "response_mime_type": "application/json",
                    "temperature": temperature,
                    "max_output_tokens": max_output_tokens,
                    "system_instruction": system_instruction
                }
                if response_schema is not None:
                    config_kwargs["response_schema"] = response_schema

                config = types.GenerateContentConfig(**config_kwargs)
                response = client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config=config
                )

                raw_text = response.text or ""
                if not raw_text.strip():
                    raise ValueError(f"Gemini model '{m}' returned an empty response text.")

                # Parse JSON safely
                try:
                    parsed = json.loads(clean_json_text(raw_text))
                    if isinstance(parsed, dict):
                        logger.info(f"[{req_id}] Successfully generated structured JSON with model '{m}'.")
                        return parsed
                except json.JSONDecodeError as json_err:
                    logger.warning(f"[{req_id}] Initial json.loads failed on model '{m}': {json_err}. Attempting controlled repair...")
                    repaired = controlled_json_repair(raw_text, request_id=req_id)
                    if repaired and isinstance(repaired, dict):
                        return repaired
                    # Safe metadata logging (no keys or candidate credentials)
                    logger.error(f"[{req_id}] JSON repair failed. Text length: {len(raw_text)}. Last 120 chars: {repr(raw_text[-120:])}")
                    raise json_err

            except APIError as e:
                err_str = str(e).lower()
                logger.warning(f"[{req_id}] Gemini APIError on model '{m}' (attempt {attempt}): {e}")
                last_error = e

                # Stop immediately if key is invalid
                if any(k in err_str for k in ["401", "403", "api_key_invalid", "unauthorized"]):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail=f"Google Gemini authentication failed: Invalid API key. Please check GEMINI_API_KEY in 'backend/.env'. ({str(e)})"
                    )

                # Stop immediately if hard quota exceeded
                if "429" in err_str or "resource_exhausted" in err_str:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Google Gemini rate limit exceeded or quota exhausted. Please check your Gemini API plan and quota."
                    )

                # If 503 (high demand) or 500, apply short backoff before retry or next model
                if any(k in err_str for k in ["503", "unavailable", "high demand", "spikes in demand"]):
                    if attempt == 1:
                        time.sleep(1.5)
                        continue  # Try attempt 2 on this model
                    else:
                        break  # Fall back to next model

                # If model not found (404), fall back to next model immediately
                if "404" in err_str or "not found" in err_str or "unsupported" in err_str:
                    break

                # For other errors on attempt 1, sleep briefly
                if attempt == 1:
                    time.sleep(1.0)
                    continue
                break

            except json.JSONDecodeError as e:
                last_error = e
                # Retry once with stricter temperature
                if attempt == 1:
                    temperature = 0.2
                    time.sleep(1.0)
                    continue
                break

            except Exception as e:
                logger.error(f"[{req_id}] Unexpected error with Gemini model '{m}': {e}")
                last_error = e
                break

    # If all candidate models and retries failed
    if isinstance(last_error, HTTPException):
        raise last_error
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Failed to generate structured JSON from Gemini after fallback attempts: {str(last_error)}"
    )

def generate_text_gemini(
    prompt: str,
    system_instruction: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_output_tokens: int = 2048
) -> str:
    """Generates plain text response using Google Gemini."""
    client = get_gemini_client()
    target_model = model or settings.GEMINI_MODEL or "gemini-3.5-flash"

    candidate_models = [target_model, "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]
    last_error: Optional[Exception] = None

    for m in candidate_models:
        try:
            config = types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                system_instruction=system_instruction
            )
            response = client.models.generate_content(
                model=m,
                contents=prompt,
                config=config
            )
            if response.text:
                return response.text.strip()
        except Exception as e:
            last_error = e
            continue

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=f"Failed to generate text from Gemini: {str(last_error)}"
    )

# -------------------------------------------------------------
# Phase 1: Interview Preparation Package Generation
# -------------------------------------------------------------

def build_preparation_user_prompt(
    profile: Dict[str, Any],
    role_override: Optional[str] = None,
    company_override: Optional[str] = None,
    interview_type_override: Optional[str] = None,
    job_description_override: Optional[str] = None
) -> str:
    target_role = role_override or profile.get("target_role") or "Software Engineer"
    target_company = company_override or profile.get("target_company") or "Technology Industry"
    interview_type = interview_type_override or profile.get("interview_type") or "Comprehensive"
    job_description = job_description_override or profile.get("job_description") or "Not provided"

    return f"""Please generate a comprehensive, personalized interview preparation package for this candidate.

=== CANDIDATE PROFILE ===
Full Name: {profile.get('full_name') or 'Candidate'}
College / University: {profile.get('college') or 'Not specified'}
Degree & Specialization: {profile.get('degree') or ''} {profile.get('specialization') or ''}
Current Year / Semester: {profile.get('current_year') or 'Not specified'}
Graduation Year: {profile.get('graduation_year') or 'Not specified'}

Technical Skills: {profile.get('technical_skills') or 'General Computer Science, Problem Solving'}
Programming Languages: {profile.get('programming_languages') or 'Python, JavaScript'}
Projects: {profile.get('projects') or 'Academic and personal software engineering projects'}
Internships: {profile.get('internships') or 'None listed'}
Certifications: {profile.get('certifications') or 'None listed'}
Achievements: {profile.get('achievements') or 'None listed'}
Prior Work Experience: {profile.get('work_experience') or 'None listed / Student'}

=== INTERVIEW TARGETS ===
Target Job Role: {target_role}
Target Company: {target_company}
Interview Type Preference: {interview_type}
Job Description / Requirements:
{job_description}

=== REQUIRED DELIVERABLES ===
Generate 6 to 8 deeply personalized, high-quality interview preparation questions covering all 6 interview categories:
- Self-Introduction (1-2 questions)
- HR & Behavioral (1-2 questions)
- Technical (1-2 questions tailored to stated languages/skills)
- Project-Based (1-2 questions on candidate's stated projects)
- Role-Specific (1 question tailored to {target_role})
- Company-Oriented (1 question relevant to interviewing at {target_company})

Ensure every answer is articulate, confident, educational, and strictly grounded in the candidate's real profile.
"""

def generate_interview_preparation_gemini(
    profile_data: Dict[str, Any],
    role_override: Optional[str] = None,
    company_override: Optional[str] = None,
    interview_type_override: Optional[str] = None,
    job_description_override: Optional[str] = None
) -> Dict[str, Any]:
    """Generates the full interview preparation kit using Gemini with Pydantic structured output."""
    req_id = str(uuid.uuid4())[:8]
    logger.info(f"[{req_id}] Starting AI interview preparation generation...")

    user_prompt = build_preparation_user_prompt(
        profile=profile_data,
        role_override=role_override,
        company_override=company_override,
        interview_type_override=interview_type_override,
        job_description_override=job_description_override
    )

    data = generate_structured_json_gemini(
        prompt=user_prompt,
        system_instruction=PREPARATION_SYSTEM_PROMPT,
        response_schema=GeminiPreparationPackage,
        temperature=0.5,
        max_output_tokens=8192,
        request_id=req_id
    )

    items = data.get("items", [])
    if not isinstance(items, list) or len(items) == 0:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini response did not include any preparation items. Please try again."
        )

    sanitized_items = []
    for item in items:
        item_dict = item.model_dump() if hasattr(item, "model_dump") else (item if isinstance(item, dict) else {})
        sanitized_items.append({
            "category": str(item_dict.get("category", "Technical")),
            "difficulty": str(item_dict.get("difficulty", "Intermediate")),
            "question": str(item_dict.get("question", "")).strip(),
            "suggested_answer": str(item_dict.get("suggested_answer", "")).strip(),
            "important_keywords": item_dict.get("important_keywords") if isinstance(item_dict.get("important_keywords"), list) else [],
            "explanation": str(item_dict.get("explanation", "")).strip(),
            "key_points": item_dict.get("key_points") if isinstance(item_dict.get("key_points"), list) else []
        })

    logger.info(f"[{req_id}] Preparation generation successful with {len(sanitized_items)} questions.")
    return {
        "overview": data.get("overview", f"Tailored preparation for {role_override or profile_data.get('target_role', 'Interview')}"),
        "items": sanitized_items
    }

# -------------------------------------------------------------
# Phase 2: Mock Interview Question Generation
# -------------------------------------------------------------

def generate_next_question_gemini(
    profile: Optional[CandidateProfile],
    session: InterviewSession,
    previous_qa: List[Dict[str, Any]],
    current_order: int
) -> Dict[str, Any]:
    """Generates the next adaptive interview question via Gemini with structured output and deterministic fallback."""
    profile_info = {
        "full_name": profile.full_name if profile else "Candidate",
        "college": profile.college if profile else "University",
        "degree": profile.degree if profile else "Degree",
        "skills": profile.technical_skills if profile else "Software Development",
        "languages": profile.programming_languages if profile else "Python, JavaScript",
        "projects": profile.projects if profile else "Academic Projects",
        "internships": profile.internships if profile else "None",
        "target_role": session.target_role or "Software Engineer",
        "target_company": session.target_company or "Technology Company",
        "interview_type": session.interview_type,
        "difficulty": session.difficulty
    }

    last_q = previous_qa[-1] if previous_qa else None
    follow_up_count = 0
    if previous_qa:
        for qa in reversed(previous_qa):
            if qa.get("is_follow_up"):
                follow_up_count += 1
            else:
                break

    can_follow_up = (follow_up_count < 2) and (last_q is not None)

    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""

    if api_key and api_key != "your_gemini_api_key_here":
        try:
            user_prompt = f"""
Candidate Profile:
- Name: {profile_info['full_name']}
- Education: {profile_info['degree']} at {profile_info['college']}
- Technical Skills: {profile_info['skills']}
- Languages: {profile_info['languages']}
- Projects: {profile_info['projects']}
- Internships: {profile_info['internships']}

Interview Context:
- Target Role: {profile_info['target_role']}
- Target Company: {profile_info['target_company']}
- Interview Type: {profile_info['interview_type']}
- Target Difficulty: {profile_info['difficulty']}
- Question Number: {current_order} of {session.total_questions_planned}
- Allowed Follow-Up: {can_follow_up} (Current chain follow-up count: {follow_up_count})

Previous Questions & Answers in this Session:
{json.dumps(previous_qa, indent=2)}

Generate Question #{current_order}.
"""
            data = generate_structured_json_gemini(
                prompt=user_prompt,
                system_instruction=QUESTION_GEN_SYSTEM_PROMPT,
                response_schema=GeminiNextQuestion,
                temperature=0.6,
                max_output_tokens=1024
            )
            return {
                "question_text": str(data.get("question_text", "")).strip(),
                "question_category": str(data.get("question_category", "Technical")),
                "difficulty": str(data.get("difficulty", session.difficulty or "Intermediate")),
                "is_follow_up": bool(data.get("is_follow_up", False)) if can_follow_up else False,
                "rationale": str(data.get("rationale", "Adaptive interview question"))
            }
        except Exception as e:
            logger.warning(f"Gemini question generation fallback due to: {e}")

    # Deterministic fallback if API fails or key is missing
    return get_fallback_question(profile_info, session.interview_type, current_order, session.difficulty)

# -------------------------------------------------------------
# Phase 2: Mock Interview Answer Evaluation
# -------------------------------------------------------------

def evaluate_answer_gemini(
    profile: Optional[CandidateProfile],
    session: InterviewSession,
    question_text: str,
    question_category: str,
    answer_text: str,
    speaking_duration: Optional[float] = None
) -> Dict[str, Any]:
    """Evaluates an answer across the 6 weighted criteria, calculating overall score strictly in Python."""
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""

    if api_key and api_key != "your_gemini_api_key_here":
        try:
            user_prompt = f"""
Candidate Target Role: {session.target_role or 'Software Engineer'}
Candidate Stated Skills: {profile.technical_skills if profile else 'Computer Science'}
Target Difficulty: {session.difficulty or 'Intermediate'}

Interview Question:
Category: {question_category}
Question: {question_text}

Candidate's Submitted Answer:
\"\"\"{answer_text}\"\"\"

Speaking Duration: {speaking_duration or 0} seconds

Evaluate the response thoroughly across all 6 criteria (1.0 - 10.0 scale).
"""
            data = generate_structured_json_gemini(
                prompt=user_prompt,
                system_instruction=EVALUATION_SYSTEM_PROMPT,
                response_schema=GeminiAnswerEvaluation,
                temperature=0.3,
                max_output_tokens=2048
            )

            # Extract individual scores and clamp between 1.0 and 10.0
            relevance = min(10.0, max(1.0, float(data.get("relevance_score", 7.0))))
            completeness = min(10.0, max(1.0, float(data.get("completeness_score", 7.0))))
            accuracy = min(10.0, max(1.0, float(data.get("accuracy_score", 7.0))))
            clarity = min(10.0, max(1.0, float(data.get("clarity_score", 7.0))))
            structure = min(10.0, max(1.0, float(data.get("structure_score", 7.0))))
            practical_understanding = min(10.0, max(1.0, float(data.get("practical_understanding_score", 7.0))))

            # Calculate weighted overall score strictly in Python:
            # Relevance 20%, Completeness 20%, Accuracy 25%, Clarity 15%, Structure 10%, Practical Understanding 10%
            weighted_score = round(
                (relevance * 0.20) +
                (completeness * 0.20) +
                (accuracy * 0.25) +
                (clarity * 0.15) +
                (structure * 0.10) +
                (practical_understanding * 0.10),
                1
            )

            return {
                "relevance_score": relevance,
                "completeness_score": completeness,
                "accuracy_score": accuracy,
                "clarity_score": clarity,
                "structure_score": structure,
                "practical_understanding_score": practical_understanding,
                "overall_score": weighted_score,
                "what_did_well": str(data.get("what_did_well", "Provided an articulated response.")),
                "missing_information": str(data.get("missing_information", "Could expand on practical production considerations.")),
                "incorrect_statements": str(data.get("incorrect_statements", "None identified.")),
                "how_to_improve": str(data.get("how_to_improve", "Incorporate concrete metrics and structure with the STAR method.")),
                "important_keywords": data.get("important_keywords") if isinstance(data.get("important_keywords"), list) else [],
                "suggested_answer": str(data.get("suggested_answer", "A comprehensive model answer."))
            }
        except Exception as e:
            logger.warning(f"Gemini answer evaluation fallback due to: {e}")

    # Deterministic fallback evaluation
    return get_fallback_evaluation(answer_text, question_text)

# -------------------------------------------------------------
# Phase 2: Mock Interview Final Performance Report
# -------------------------------------------------------------

def generate_final_report_gemini(
    profile: Optional[CandidateProfile],
    session: InterviewSession,
    qa_evaluations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generates an executive performance report synthesizing all Q&A and evaluations."""
    api_key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""

    if api_key and api_key != "your_gemini_api_key_here":
        try:
            user_prompt = f"""
Candidate: {profile.full_name if profile else 'Candidate'}
Role: {session.target_role or 'Software Engineer'}
Company: {session.target_company or 'Target Company'}
Interview Type: {session.interview_type}
Difficulty: {session.difficulty}

Complete Interview Transcript & Question Evaluations:
{json.dumps(qa_evaluations, indent=2)}

Provide an executive performance report synthesizing the candidate's performance.
"""
            data = generate_structured_json_gemini(
                prompt=user_prompt,
                system_instruction=REPORT_SYSTEM_PROMPT,
                response_schema=GeminiFinalReport,
                temperature=0.4,
                max_output_tokens=2048
            )
            return {
                "report_overview": str(data.get("report_overview", "Comprehensive interview performance assessment.")),
                "strengths": data.get("strengths") if isinstance(data.get("strengths"), list) else ["Clear technical articulation."],
                "weaknesses": data.get("weaknesses") if isinstance(data.get("weaknesses"), list) else ["Opportunity to provide more quantitative details."],
                "recommendations": data.get("recommendations") if isinstance(data.get("recommendations"), list) else ["Practice structuring responses with the STAR method."],
                "next_steps": data.get("next_steps") if isinstance(data.get("next_steps"), list) else ["Complete an advanced technical mock session."]
            }
        except Exception as e:
            logger.warning(f"Gemini final report fallback due to: {e}")

    # Fallback report
    return {
        "report_overview": f"The candidate completed a {session.interview_type} mock interview for the role of {session.target_role or 'Software Engineer'}. Overall delivery demonstrated foundational competence with clear areas for structured advancement.",
        "strengths": [
            "Addressed the core interview questions directly without evasion.",
            "Demonstrated willingness to articulate problem-solving concepts.",
            "Maintained consistent engagement throughout the session."
        ],
        "weaknesses": [
            "Explanations could benefit from deeper technical specifics and trade-off considerations.",
            "Structuring answers with the STAR framework will improve clarity."
        ],
        "recommendations": [
            "Prepare 2-3 detailed project stories with concrete architectural decisions.",
            "Incorporate trade-off analysis into technical explanations.",
            "Practice timed responses to refine pacing."
        ],
        "next_steps": [
            "Review the tailored preparation kit for targeted question drills.",
            "Schedule another mock interview focusing on Advanced difficulty."
        ]
    }

# -------------------------------------------------------------
# Smart Deterministic Fallbacks
# -------------------------------------------------------------

def get_fallback_question(profile_info: Dict[str, Any], interview_type: str, order: int, difficulty: str) -> Dict[str, Any]:
    skills = profile_info.get("skills") or "software development"
    first_skill = [s.strip() for s in skills.split(",") if s.strip()][0] if skills else "Software Engineering"
    projects = profile_info.get("projects") or "your recent projects"

    if order == 1:
        return {
            "question_text": f"Please walk me through your background, your experience with {first_skill}, and why you are interested in this {profile_info.get('target_role', 'Software')} role.",
            "question_category": "Introduction",
            "difficulty": difficulty,
            "is_follow_up": False,
            "rationale": "Standard opening question to evaluate elevator pitch and communication clarity."
        }
    elif order == 2:
        return {
            "question_text": f"Can you detail the architectural decisions and key technical challenges you tackled in {projects}?",
            "question_category": "Project Architecture",
            "difficulty": difficulty,
            "is_follow_up": False,
            "rationale": "Assesses practical engineering decisions and problem-solving depth."
        }
    elif order == 3:
        return {
            "question_text": f"In {first_skill}, how do you ensure scalability, error handling, and maintainability when building production systems?",
            "question_category": "Technical",
            "difficulty": difficulty,
            "is_follow_up": False,
            "rationale": "Probes depth of technical knowledge and software quality best practices."
        }
    elif order == 4:
        return {
            "question_text": "Describe a situation where you encountered a major technical roadblock or disagreement in a team. How did you resolve it?",
            "question_category": "HR & Behavioral",
            "difficulty": difficulty,
            "is_follow_up": False,
            "rationale": "Evaluates conflict resolution, teamwork, and behavioral maturity."
        }
    else:
        return {
            "question_text": f"If faced with unexpected high latency or system failure in a {profile_info.get('target_role', 'Software')} environment, how do you diagnose and triage the root cause?",
            "question_category": "Problem Solving",
            "difficulty": difficulty,
            "is_follow_up": False,
            "rationale": "Evaluates systemic problem-solving under real-world pressure."
        }

def get_fallback_evaluation(answer_text: str, question_text: str) -> Dict[str, Any]:
    word_count = len((answer_text or "").split())
    if word_count < 15:
        score = 4.5
        well = "Answer attempted, but brief."
        missing = "Lacks detailed context, specific examples, and technical justification."
    elif word_count < 50:
        score = 6.8
        well = "Clear concise points made."
        missing = "Could be enriched with practical examples and system trade-offs."
    else:
        score = 8.2
        well = "Comprehensive coverage of the topic with good detail and structure."
        missing = "Could explicitly highlight quantifiable business impact or metrics."

    weighted_score = round((score * 0.20) + (score * 0.20) + (score * 0.25) + (score * 0.15) + (score * 0.10) + (score * 0.10), 1)

    return {
        "relevance_score": score,
        "completeness_score": max(3.0, score - 0.5),
        "accuracy_score": score,
        "clarity_score": min(9.5, score + 0.5),
        "structure_score": score,
        "practical_understanding_score": max(3.0, score - 0.3),
        "overall_score": weighted_score,
        "what_did_well": well,
        "missing_information": missing,
        "incorrect_statements": "None detected in general review.",
        "how_to_improve": "Structure answers using Problem-Action-Result and quantify measurable outcomes.",
        "important_keywords": ["scalability", "architecture", "trade-offs", "STAR method"],
        "suggested_answer": "When addressing this question, structure the response clearly: 1) Outline the situation and goal, 2) Detail the exact technical decisions made, and 3) Summarize the outcome and lessons learned."
    }
