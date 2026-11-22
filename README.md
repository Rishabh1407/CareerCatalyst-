# CareerCatalyst — AI Personalized Interview Preparation & Interactive Mock Coaching Platform

CareerCatalyst is an end-to-end AI-powered interview preparation and communication coaching platform designed for students, fresh graduates, and software job seekers. Unlike generic interview prep tools that encourage rote memorization, CareerCatalyst personalizes both interview preparation scripts and interactive mock interview sessions directly from the candidate's verified educational background, technical skills, programming languages, real projects, and target companies.

Powered by **Google Gemini** for reasoning, structured question generation, and 6-criteria answer evaluations, and **Faster-Whisper** for private, local on-device speech-to-text.

---

## 1. Features Overview

### Phase 1 Features (Fully Preserved)
- **Module A — Authentication**:
  - Secure registration and login with `bcrypt` password hashing.
  - JWT authentication with Bearer tokens (24-hour expiration) and automatic profile initialization.
  - Current-user endpoint (`GET /api/v1/auth/me`) and protected frontend routes.
- **Module B — Candidate Profile & Preferences**:
  - Educational profile: Full name, email, college, degree, specialization, current year, graduation year.
  - Professional portfolio: Programming languages, technical skills, detailed project architectures & contributions, internships, certifications, achievements, and work experience.
  - Career preferences: Target role, target company, interview focus type, and job description.
  - Live profile strength indicator (0–100%) dynamically guiding candidates to add portfolio details.
- **Module C — Dashboard (Phase 1 Baseline)**:
  - Personalized candidate greeting and target role badges.
  - Counters for preparation sets, total questions, mastered scripts, and mastery percentage.
- **Module D — AI Interview Preparation Generator**:
  - Modular Google Gemini prompts generating 6 categories: Self-Introduction, HR & Behavioral, Technical, Project-Based, Role-Specific, and Company-Oriented.
  - Strictly grounded in profile data without fabricating projects or unverified facts.
- **Module E — Script Learning & Mastery**:
  - Dedicated study workspace (`/script-learning`) with keyword highlighting, "Key Points to Remember" checklists, and interviewer mindset criteria callouts.
  - Expand/collapse answers, category filter pills, search bar, and "Mark as Learned" toggle.
- **Module F — Preparation History & Persistence**:
  - SQLite database persistence across sessions and server restarts.
  - History viewer (`/history`) to inspect or delete preparation sets with confirmation safeguards.

### Phase 2 Features (Mock Interview & Local Voice Analysis)
- **Module A — Interactive AI Mock Interview**:
  - Configurable sessions: Interview Type (Comprehensive, Technical, Project-Based, HR, Role-Specific), Difficulty (Beginner, Intermediate, Advanced), Target Duration (10, 15, 20, 30 min), Question Count (3, 5, 8), and Answer Mode (Text or Voice).
  - **One-Question-at-a-Time Interface**: Focuses the candidate on the current question with live timer, progress bar, category badge, and follow-up indicators.
  - Prevents duplicate answer submissions and prevents answers from being edited after submission.
  - Early exit option with confirmation modal.
- **Module B — Intelligent Question Generation & Adaptive Follow-Ups**:
  - Questions dynamically personalized using candidate education, technical skills, projects, and target company via Google Gemini.
  - **Adaptive Follow-Up Engine**: Analyzes previous answers to generate targeted follow-ups (e.g. asking for architecture trade-offs if Redis/caching is mentioned, or requesting concrete metrics if an answer was brief). Capped at a maximum of 2 follow-ups per main question to prevent infinite loops.
- **Module C — AI Answer Evaluation & Constructive Feedback**:
  - Real-time scoring across 6 key dimensions (1.0 to 10.0 scale):
    1. *Relevance* (20%)
    2. *Completeness* (20%)
    3. *Technical Accuracy* (25%)
    4. *Clarity* (15%)
    5. *Structure* (10%)
    6. *Practical Understanding* (10%)
  - Documented weighted overall scoring formula (calculated strictly in Python):
    `overall_score = (relevance * 0.20) + (completeness * 0.20) + (accuracy * 0.25) + (clarity * 0.15) + (structure * 0.10) + (practical_understanding * 0.10)`
  - Immediate post-submission feedback cards highlighting what was done well, missing points, improvement suggestions, keywords, and a model suggested answer.
- **Module D — Voice Mock Interview & Local Acoustic Analysis**:
  - Browser-based `MediaRecorder` audio recording with visualizer, recording timer, audio playback preview, and text fallback.
  - Fast, private on-device transcription via **Faster-Whisper** with automatic CUDA acceleration and graceful CPU fallback.
  - **Review & Edit Transcript Workflow**: Candidates see their transcribed speech in an editable textarea to review, clarify, or expand before final submission.
  - **Objective Communication Analysis**: Measures speaking duration, estimated words per minute (WPM), filler word count & breakdown (`um`, `uh`, `like`, `you know`, `actually`), repeated words, and cadence observations.
  - Explicit disclaimer explaining that acoustic metrics measure pacing and frequency only without inferring personality or intelligence.
- **Module E — Final Interview Performance Report**:
  - Comprehensive 9-section report (`/interview/:id/report`):
    - *Section A*: Interview Overview (Type, difficulty, date, duration, questions completed).
    - *Section B*: Overall Performance (Score out of 100 with radial badge, average answer score).
    - *Section C*: Category-Wise Scores (Interactive Recharts bar chart).
    - *Section D*: Question-by-Question Evaluation Details (Expandable cards with candidate answer, sub-scores, strengths, weaknesses, and model answers).
    - *Section E*: Candidate Strengths.
    - *Section F*: Areas for Growth.
    - *Section G*: Actionable Coaching Recommendations.
    - *Section H*: Communication & Acoustic Analysis Summary.
    - *Section I*: Next Steps.
- **Module F — Interview History & Performance Analytics**:
  - Separate mock interview history page (`/interview/history`) with report links and deletion controls.
  - Dedicated Performance Analytics dashboard (`/analytics`) featuring Recharts score progression trend lines, category breakdowns, and key performance counters.
- **Module G — Dashboard Integration**:
  - Extended dashboard with mock interview readiness stats: Completed Interviews, Average Score, Best Score, Questions Answered, and Recent Simulations.
- **One-Click Startup & Shutdown**:
  - `start_careercatalyst.bat`: One-click startup for Windows launching backend, frontend, tracking PIDs, and opening the browser.
  - `stop_careercatalyst.bat`: Safe tracked shutdown terminating only the specific CareerCatalyst processes.

---

## 2. Technology Stack

- **Frontend**:
  - React 18
  - Vite 5
  - Tailwind CSS 3
  - React Router DOM 6
  - Axios (with JWT interceptors)
  - Lucide React (Icons)
  - Recharts (Interactive performance charts)
  - Browser MediaRecorder API (Microphone voice recording)
- **Backend**:
  - Python 3.11
  - FastAPI (REST API with `/api/v1` prefix)
  - SQLAlchemy 2.0 (ORM)
  - Pydantic v2 (Validation & Schemas)
  - SQLite (Persistent relational database `careercatalyst.db`)
  - PyJWT & Bcrypt (Authentication & Security)
  - Google GenAI SDK (`google-genai` official Python library)
  - Faster-Whisper (Local, fast speech-to-text with CUDA/CPU support)
- **One-Click Automation**:
  - Windows Batch & PowerShell scripts (`start_careercatalyst.bat`, `stop_careercatalyst.bat`)

---

## 3. Project Structure

```text
careercatalyst/
├── start_careercatalyst.bat      # One-click Windows startup script
├── stop_careercatalyst.bat       # One-click Windows shutdown script
├── careercatalyst.db             # Persistent SQLite database
├── .gitignore
├── .env.example
├── README.md
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py         # Registration, login, /me
│   │   │   │   ├── profile.py      # Candidate profile management
│   │   │   │   ├── preparation.py  # AI prep generation & script mastery
│   │   │   │   ├── interview.py    # Mock interview session, answers, follow-ups
│   │   │   │   ├── reports.py      # 9-section performance reports
│   │   │   │   ├── audio.py        # Audio transcription & communication analysis
│   │   │   │   └── __init__.py
│   │   │   └── deps.py             # Auth dependencies & DB session
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings & environment variables
│   │   │   ├── database.py         # SQLAlchemy engine & session factory
│   │   │   └── security.py         # Bcrypt hashing & PyJWT token utilities
│   │   ├── models/
│   │   │   ├── user.py             # User model
│   │   │   ├── profile.py          # CandidateProfile model
│   │   │   ├── preparation.py      # PreparationSet & PreparationScript models
│   │   │   ├── interview.py        # InterviewSession, Question, Answer, Evaluation, AudioAnalysis
│   │   │   └── __init__.py
│   │   ├── schemas/
│   │   │   ├── auth.py             # User auth schemas
│   │   │   ├── profile.py          # Candidate profile schemas
│   │   │   ├── preparation.py      # Prep sets, scripts, summary schemas
│   │   │   ├── interview.py        # Interview start, answer, report, analytics schemas
│   │   │   └── __init__.py
│   │   ├── services/
│   │   │   ├── gemini_service.py   # Centralized Google Gemini service (text & structured JSON)
│   │   │   ├── interview_service.py # Adaptive question gen, evaluation rubrics, report synthesis
│   │   │   ├── audio_service.py    # Local Faster-Whisper transcription & communication metrics
│   │   │   └── __init__.py
│   │   └── main.py                 # FastAPI application, CORS & router mounting
│   ├── tests/
│   │   ├── test_journey.py         # Phase 1 end-to-end user journey test suite
│   │   └── test_phase2_journey.py  # Phase 2 mock interview & evaluation test suite
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.jsx       # Layout combining Sidebar and Navbar
│   │   │   ├── Navbar.jsx          # Header with user target role badge
│   │   │   ├── ProtectedRoute.jsx  # Route guard for unauthenticated users
│   │   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   │   └── VoiceRecorder.jsx   # Voice recording interface with visualizer
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Auth state & token storage
│   │   │   └── ToastContext.jsx    # Toast notification system
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # High-level overview & interview readiness stats
│   │   │   ├── Login.jsx           # Sign in page
│   │   │   ├── Register.jsx        # Account registration
│   │   │   ├── Profile.jsx         # Candidate onboarding & portfolio profile
│   │   │   ├── Preparation.jsx     # AI interview prep generator
│   │   │   ├── ScriptLearning.jsx  # Interactive script study workspace
│   │   │   ├── History.jsx         # Preparation history viewer
│   │   │   ├── InterviewSetup.jsx  # Mock interview configuration modal/page
│   │   │   ├── ActiveInterview.jsx # Interactive one-question-at-a-time mock interface
│   │   │   ├── InterviewReport.jsx # 9-section comprehensive performance report
│   │   │   ├── InterviewHistory.jsx# Mock interview past sessions history
│   │   │   └── PerformanceAnalytics.jsx # Score progression trend lines & analytics
│   │   ├── services/
│   │   │   └── api.js              # Axios client with JWT interceptors
│   │   ├── App.jsx                 # Routes declaration
│   │   ├── main.jsx                # React root mount
│   │   └── index.css               # Tailwind CSS imports
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
```

---

## 4. Quick Start — One-Click Windows Launcher

### Starting CareerCatalyst:
Double-click `start_careercatalyst.bat` or run:
```cmd
start_careercatalyst.bat
```
The startup script:
1. Validates that Python and Node.js are available.
2. Initializes the backend virtual environment (`backend/venv`) if not present.
3. Installs backend dependencies (`google-genai`, `faster-whisper`, etc.).
4. Installs frontend dependencies via `npm install`.
5. Starts the FastAPI server on `http://localhost:8000`.
6. Starts the Vite development server on `http://localhost:5173`.
7. Saves active process IDs to `.careercatalyst.pids`.
8. Automatically opens your default web browser to `http://localhost:5173`.

### Stopping CareerCatalyst:
Double-click `stop_careercatalyst.bat` or run:
```cmd
stop_careercatalyst.bat
```
The shutdown script safely terminates the exact FastAPI and Vite processes tracked in `.careercatalyst.pids`.

---

## 5. Manual Setup & Running

### Backend Setup:
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000/api/v1`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

### Frontend Setup:
```powershell
cd frontend
npm install
npm run dev
```
- Application URL: `http://localhost:5173`

---

## 6. Environment Configuration

### Backend (`backend/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
WHISPER_MODEL_SIZE=base
WHISPER_DEVICE=auto
WHISPER_COMPUTE_TYPE=int8
SECRET_KEY=careercatalyst_jwt_secret_key_phase1_2026_dev
DATABASE_URL=sqlite:///./careercatalyst.db
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
*Note: If a Gemini API key is not configured, the system provides intelligent deterministic questions, evaluations, and reports so that offline exploration and testing function without crashes.*

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 7. How to Conduct a Mock Interview

### Text Mock Interview:
1. Navigate to **AI Mock Interview** (`/interview/new`) from the sidebar.
2. Choose your interview type (e.g. *Technical Interview*), difficulty level, question count, and select **Text Input**.
3. Click **Start AI Mock Interview**.
4. Read Question #1.
5. Type your response in the answer box and click **Submit Answer**.
6. Review your immediate AI evaluation feedback (overall score, strengths, missing points, and model answer).
7. Click **Proceed to Next Question** to receive the next question (or an adaptive follow-up).
8. Once all questions are answered, view your comprehensive **Final Performance Report** (`/interview/:id/report`).

### Voice Mock Interview (Local Faster-Whisper):
1. On the configuration screen (`/interview/new`), select **Voice Audio**.
2. Click **Start AI Mock Interview**.
3. Allow microphone permission when prompted by your browser.
4. Click **Start Recording**, speak your response into your microphone, and click **Stop Recording**.
5. Faster-Whisper automatically transcribes your speech locally in the background.
6. Review and edit your transcribed answer in the text box if you want to refine any technical details.
7. Click **Submit Answer**.
8. The answer is evaluated across 6 criteria by Google Gemini, accompanied by communication metrics (WPM, filler word count).
9. Proceed to the next question.

---

## 8. API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` — Register a new account
- `POST /api/v1/auth/login` — Sign in and receive JWT token
- `GET /api/v1/auth/me` — Get current user information

### Candidate Profile
- `GET /api/v1/profile` — Get candidate profile and completion score
- `PUT /api/v1/profile` — Update candidate profile and career targets

### Preparation & Scripts (Phase 1)
- `POST /api/v1/preparation/generate` — Generate preparation set via Google Gemini
- `GET /api/v1/preparation` — List all preparation sets for user
- `GET /api/v1/preparation/summary` — Preparation summary metrics
- `GET /api/v1/preparation/{id}` — Get specific preparation set
- `DELETE /api/v1/preparation/{id}` — Delete preparation set
- `GET /api/v1/preparation/{id}/scripts` — Get scripts for preparation set
- `PATCH /api/v1/preparation/scripts/{id}` — Toggle `is_learned` status

### Interactive Mock Interviews (Phase 2)
- `POST /api/v1/interviews/start` — Start mock interview session & generate Q1 via Gemini
- `GET /api/v1/interviews` — List all user interview sessions
- `GET /api/v1/interviews/{id}` — Get session status and active question
- `POST /api/v1/interviews/{id}/answer` — Submit answer, evaluate via Gemini, and get next question
- `POST /api/v1/interviews/{id}/finish` — End interview early & generate report
- `DELETE /api/v1/interviews/{id}` — Delete interview session
- `GET /api/v1/interviews/stats/summary` — Analytics summary & score trends

### Performance Reports (Phase 2)
- `GET /api/v1/reports` — List all completed performance reports
- `GET /api/v1/reports/{id}` — Get complete 9-section report

### Audio & Speech (Phase 2)
- `POST /api/v1/audio/transcribe` — Upload audio and run local Faster-Whisper transcription
- `POST /api/v1/audio/analyze` — Analyze text for WPM, fillers, and pace observations

---

## 9. Automated Testing & Verification

Run the automated test suites using the virtual environment:

### Phase 2 Mock Interview Test Suite:
```powershell
backend\venv\Scripts\python -u backend\tests\test_phase2_journey.py
```
**Tests Verified:**
- Candidate login and profile setup.
- Session creation and Question #1 generation via Gemini.
- Answer submission and 6-criteria AI evaluation via Gemini.
- Adaptive follow-up question generation triggered by candidate keywords.
- Answer submission to Question #2 and #3.
- Automatic interview finalization upon completion.
- Duplicate answer submission prevention.
- Comprehensive 9-section performance report generation.
- Interview history and dashboard analytics verification.
- Audio communication analysis (WPM, filler word detection).
- Audio upload and local Faster-Whisper transcription endpoint.
- User data isolation (Candidate 2 blocked with HTTP 404 from accessing Candidate 1's records).
- Session deletion by owner.

### Phase 1 Regression Test Suite:
```powershell
backend\venv\Scripts\python -u backend\tests\test_journey.py
```
**Tests Verified:**
- Registration, login, duplicate account prevention.
- Profile completion scoring (100%).
- Preparation sets generation via Google Gemini, script learning mastery toggles, and history.

---

## 10. Communication Metrics Scope

Acoustic observations measure recorded speaking rate (WPM) and filler word frequencies. Pronunciation, subjective personality, and emotional confidence are intentionally not inferred.

---

## 11. Phase 3 Roadmap (Future Vision)

- **Multi-Persona Panel Simulation**: Multi-agent interviews with distinct personas (e.g. HR manager, lead architect, product manager).
- **Live Computer Vision Tracking**: Web-camera eye-contact tracking, posture analysis, and engagement indicators.
- **System Design Canvas**: Interactive collaborative architectural whiteboard during technical interviews.
