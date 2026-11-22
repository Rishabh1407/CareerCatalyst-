import os
import sys
import json
import io

# Ensure utf-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_phase2_complete_journey():
    print("===================================================", flush=True)
    print("STARTING PHASE 2 INTERVIEW & EVALUATION TEST SUITE", flush=True)
    print("===================================================", flush=True)

    print("--- 1. Register & Login Candidate ---", flush=True)
    user_payload = {
        "email": "phase2_candidate@careercatalyst.ai",
        "password": "Password123!"
    }
    reg_res = client.post("/api/v1/auth/register", json=user_payload)
    if reg_res.status_code == 201:
        token = reg_res.json()["token"]["access_token"]
    else:
        # User already exists from previous run, login
        login_res = client.post("/api/v1/auth/login", json=user_payload)
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["token"]["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Authenticated successfully", flush=True)

    print("--- 2. Update Profile with Rich Project Information ---", flush=True)
    prof_update = {
        "full_name": "Maya Patel",
        "college": "Georgia Tech",
        "degree": "M.S. in Computer Science",
        "technical_skills": "Python, FastAPI, Redis, Distributed Systems, Docker",
        "programming_languages": "Python, Go, SQL",
        "projects": "High-Throughput Task Engine: Redis Streams with consumer group workers handling 15,000 req/sec.",
        "target_role": "Backend Infrastructure Engineer",
        "target_company": "Stripe",
        "interview_type": "Technical Interview"
    }
    prof_res = client.put("/api/v1/profile", json=prof_update, headers=headers)
    assert prof_res.status_code == 200
    print("[OK] Profile prepared", flush=True)

    print("--- 3. Start AI Mock Interview Session ---", flush=True)
    start_payload = {
        "interview_type": "Technical Interview",
        "difficulty": "Intermediate",
        "duration_minutes": 15,
        "answer_method": "text",
        "target_role": "Backend Infrastructure Engineer",
        "target_company": "Stripe",
        "total_questions": 3
    }
    start_res = client.post("/api/v1/interviews/start", json=start_payload, headers=headers)
    assert start_res.status_code == 201, f"Start failed: {start_res.text}"
    session_data = start_res.json()
    session_id = session_data["id"]
    q1 = session_data["current_question"]
    assert q1 is not None, "Question 1 was not generated"
    assert q1["question_order"] == 1
    print(f"[OK] Session #{session_id} created. Question #1: {q1['question_text'][:60]}...", flush=True)

    print("--- 4. Submit Answer for Question #1 ---", flush=True)
    ans1_payload = {
        "answer_text": "I am a graduate student at Georgia Tech focusing on distributed systems and backend infrastructure. In my recent project, I designed a task queue using Redis Streams and FastAPI that scaled to 15k req/sec with zero task drop. I am particularly motivated by Stripe's high-reliability API architecture.",
        "answer_method": "text"
    }
    ans1_res = client.post(f"/api/v1/interviews/{session_id}/answer", json=ans1_payload, headers=headers)
    assert ans1_res.status_code == 200, f"Submit answer 1 failed: {ans1_res.text}"
    ans1_data = ans1_res.json()
    eval1 = ans1_data["evaluation"]
    assert eval1["overall_score"] > 0
    assert eval1["relevance_score"] > 0
    assert len(eval1["what_did_well"]) > 0
    print(f"[OK] Question #1 evaluated with score: {eval1['overall_score']:.1f}/10", flush=True)

    # Next question must be generated
    assert ans1_data["is_completed"] is False
    q2 = ans1_data["next_question"]
    assert q2 is not None
    assert q2["question_order"] == 2
    print(f"[OK] Question #2 generated (is_follow_up={q2['is_follow_up']}): {q2['question_text'][:60]}...", flush=True)

    print("--- 5. Submit Answer for Question #2 ---", flush=True)
    ans2_payload = {
        "answer_text": "We utilized Redis consumer groups with explicit XACK acknowledgments. When a consumer fails to acknowledge a task within a 30-second window, the task is claimed by another worker using XCLAIM to guarantee at-least-once processing.",
        "answer_method": "text"
    }
    ans2_res = client.post(f"/api/v1/interviews/{session_id}/answer", json=ans2_payload, headers=headers)
    assert ans2_res.status_code == 200
    ans2_data = ans2_res.json()
    assert ans2_data["is_completed"] is False
    q3 = ans2_data["next_question"]
    assert q3 is not None
    assert q3["question_order"] == 3
    print(f"[OK] Question #2 evaluated. Question #3 ready: {q3['question_text'][:60]}...", flush=True)

    print("--- 6. Submit Final Answer to Complete Interview ---", flush=True)
    ans3_payload = {
        "answer_text": "To maintain high availability during database migrations, we follow the expand-contract pattern. First, we add the new column or table without breaking existing queries, dual-write across the application layer, backfill data asynchronously, and finally switch the read paths.",
        "answer_method": "text"
    }
    ans3_res = client.post(f"/api/v1/interviews/{session_id}/answer", json=ans3_payload, headers=headers)
    assert ans3_res.status_code == 200
    ans3_data = ans3_res.json()
    assert ans3_data["is_completed"] is True
    print(f"[OK] Question #3 submitted. Interview automatically completed!", flush=True)

    print("--- 6b. Verify Duplicate / Post-Completion Submission is Blocked ---", flush=True)
    dup_res = client.post(f"/api/v1/interviews/{session_id}/answer", json=ans3_payload, headers=headers)
    assert dup_res.status_code == 400
    print("[OK] Duplicate answer submission blocked on completed session", flush=True)


    print("--- 7. Fetch Final Performance Report (9 Sections) ---", flush=True)
    report_res = client.get(f"/api/v1/reports/{session_id}", headers=headers)
    assert report_res.status_code == 200, f"Report failed: {report_res.text}"
    report = report_res.json()
    assert report["overall_score"] > 0
    assert report["total_questions"] == 3
    assert report["completed_questions"] == 3
    assert len(report["strengths"]) > 0
    assert len(report["weaknesses"]) > 0
    assert len(report["recommendations"]) > 0
    assert len(report["answers_evaluation"]) == 3
    assert "communication_analysis" in report
    print(f"[OK] Comprehensive report verified. Overall score: {report['overall_score']}/100", flush=True)

    print("--- 8. Verify Interview History & Analytics ---", flush=True)
    history_res = client.get("/api/v1/interviews", headers=headers)
    assert history_res.status_code == 200
    assert len(history_res.json()) >= 1

    stats_res = client.get("/api/v1/interviews/stats/summary", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_interviews"] >= 1
    assert stats["average_score"] > 0
    assert stats["total_questions_answered"] >= 3
    print(f"[OK] Analytics verified: {stats['total_interviews']} interviews, avg score {stats['average_score']}%", flush=True)

    print("--- 9. Test Audio Communication Analysis Service ---", flush=True)
    audio_test_payload = {
        "text": "Um, basically, when we built the API, like, we had to handle, um, high concurrency and Redis caching.",
        "duration_seconds": 12.5
    }
    audio_res = client.post("/api/v1/audio/analyze", json=audio_test_payload, headers=headers)
    assert audio_res.status_code == 200
    audio_metrics = audio_res.json()
    assert audio_metrics["filler_word_count"] >= 3
    assert audio_metrics["words_per_minute"] > 0
    print(f"[OK] Audio analysis verified: {audio_metrics['filler_word_count']} fillers detected, {audio_metrics['words_per_minute']} WPM", flush=True)

    print("--- 10. Test Audio Upload & Transcription Endpoint ---", flush=True)
    dummy_wav = io.BytesIO(b"RIFF" + b"\x00" * 40 + b"WAVEfmt " + b"\x00" * 20 + b"data" + b"\x00" * 100)
    upload_res = client.post(
        "/api/v1/audio/transcribe",
        files={"file": ("test_recording.wav", dummy_wav, "audio/wav")},
        headers=headers
    )
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    assert "transcript" in upload_data
    assert "metrics" in upload_data
    print("[OK] Audio upload and transcription pipeline verified", flush=True)

    print("--- 11. Test User Data Isolation (Candidate 2) ---", flush=True)
    user2_payload = {
        "email": "user2_isolated@careercatalyst.ai",
        "password": "Password123!"
    }
    u2_reg = client.post("/api/v1/auth/register", json=user2_payload)
    if u2_reg.status_code == 201:
        u2_token = u2_reg.json()["token"]["access_token"]
    else:
        u2_login = client.post("/api/v1/auth/login", json=user2_payload)
        u2_token = u2_login.json()["token"]["access_token"]

    u2_headers = {"Authorization": f"Bearer {u2_token}"}

    # Candidate 2 cannot see Candidate 1's interview session
    u2_get = client.get(f"/api/v1/interviews/{session_id}", headers=u2_headers)
    assert u2_get.status_code == 404

    # Candidate 2 cannot view Candidate 1's report
    u2_rep = client.get(f"/api/v1/reports/{session_id}", headers=u2_headers)
    assert u2_rep.status_code == 404

    # Candidate 2 cannot delete Candidate 1's session
    u2_del = client.delete(f"/api/v1/interviews/{session_id}", headers=u2_headers)
    assert u2_del.status_code == 404
    print("[OK] User isolation strictly verified: unauthorized access blocked with 404", flush=True)

    print("--- 12. Test Session Deletion by Owner ---", flush=True)
    del_res = client.delete(f"/api/v1/interviews/{session_id}", headers=headers)
    assert del_res.status_code == 200
    # Confirm it is no longer retrievable
    check_del = client.get(f"/api/v1/interviews/{session_id}", headers=headers)
    assert check_del.status_code == 404
    print("[OK] Session deleted cleanly by owner", flush=True)

    print("\n=======================================================", flush=True)
    print("ALL PHASE 2 INTERVIEW & EVALUATION TESTS PASSED!", flush=True)
    print("=======================================================", flush=True)

if __name__ == "__main__":
    test_phase2_complete_journey()
