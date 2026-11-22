import os
import sys
import json

# Ensure utf-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal, Base, engine
from backend.app.models.preparation import PreparationSet, PreparationScript

client = TestClient(app)

def test_full_user_journey():
    print("--- 1. Testing Registration ---", flush=True)
    import time
    unique_email = f"testcandidate_{int(time.time())}@careercatalyst.ai"
    reg_payload = {
        "email": unique_email,
        "password": "Password123!"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Register failed: {res.text}"
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == unique_email
    token = data["token"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Registration successful", flush=True)

    print("--- 2. Testing Duplicate Registration Prevention ---", flush=True)
    dup_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
    print("[OK] Duplicate registration rejected", flush=True)

    print("--- 3. Testing Login ---", flush=True)
    login_res = client.post("/api/v1/auth/login", json=reg_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["token"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] Login successful", flush=True)

    print("--- 4. Testing Current User (/auth/me) ---", flush=True)
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email
    print("[OK] Current user verified", flush=True)

    print("--- 5. Testing Profile Fetch & Update ---", flush=True)
    prof_res = client.get("/api/v1/profile", headers=headers)
    assert prof_res.status_code == 200
    initial_prof = prof_res.json()
    assert initial_prof["email"] == unique_email


    update_payload = {
        "full_name": "Jordan Rivera",
        "college": "Stanford University",
        "degree": "B.S.",
        "specialization": "Computer Science",
        "current_year": "Senior Year",
        "graduation_year": "2025",
        "programming_languages": "Python, TypeScript, Go",
        "technical_skills": "FastAPI, React, PostgreSQL, Docker, Redis",
        "projects": "1) Microservice Task Engine: Built async queue using Redis and FastAPI. Handled 10k req/min. 2) Portfolio Analytics Dashboard: React SPA with real-time charts.",
        "internships": "Backend Engineering Intern at CloudPulse (Summer 2024)",
        "certifications": "AWS Certified Cloud Practitioner",
        "achievements": "1st place at HackStanford 2024",
        "work_experience": "Teaching Assistant for CS106B",
        "target_role": "Full-Stack Software Engineer",
        "target_company": "Stripe",
        "interview_type": "Comprehensive",
        "job_description": "We are seeking a Full-Stack Engineer proficient in modern web applications, scalable backend APIs, and developer tooling."
    }

    put_res = client.put("/api/v1/profile", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    updated_prof = put_res.json()
    assert updated_prof["full_name"] == "Jordan Rivera"
    assert updated_prof["target_company"] == "Stripe"
    assert updated_prof["completion_percentage"] > 70
    print(f"[OK] Profile updated successfully with completion score: {updated_prof['completion_percentage']}%", flush=True)

    print("--- 6. Testing AI Preparation Generation Endpoint Validation ---", flush=True)
    # Without valid API key, should return clear 400 error explaining key configuration, or 200 if key active
    gen_res = client.post("/api/v1/preparation/generate", json={}, headers=headers)
    if gen_res.status_code == 400:
        assert "Gemini API key" in gen_res.json()["detail"]
        print("[OK] Generation endpoint correctly guards missing API key with clear Gemini guidance", flush=True)
    else:
        assert gen_res.status_code in (200, 201)
        print("[OK] Generation endpoint successfully invoked Gemini and returned preparation set", flush=True)

    print("--- 7. Populating Test Preparation Set to Test Downstream Scripts & History ---", flush=True)
    # Insert a structured preparation set directly to test all modules E and F
    db = SessionLocal()
    user_id = me_res.json()["id"]
    prep_set = PreparationSet(
        user_id=user_id,
        title="Full-Stack Software Engineer Prep — Stripe",
        target_role="Full-Stack Software Engineer",
        target_company="Stripe",
        interview_type="Comprehensive",
        overview="Personalized preparation covering core distributed system questions, React state management, and Stripe's customer-first engineering mindset."
    )
    db.add(prep_set)
    db.commit()
    db.refresh(prep_set)

    test_scripts = [
        {
            "category": "Self-Introduction",
            "difficulty": "Beginner",
            "question": "Tell me about yourself and your background.",
            "suggested_answer": "I am a Computer Science senior at Stanford graduating in 2025. Over the past few years, I've focused on full-stack web systems using Python, TypeScript, and FastAPI. Recently during my internship at CloudPulse, I optimized asynchronous API pipelines, and I also built a Microservice Task Engine handling 10k requests per minute. I'm excited about Stripe's infrastructure quality.",
            "important_keywords": ["Stanford", "FastAPI", "CloudPulse", "Microservice Task Engine", "Stripe"],
            "explanation": "Interviewers evaluate clarity, concise communication, and whether your background aligns with the team's needs.",
            "key_points": ["State current education status", "Highlight CloudPulse internship", "Mention high-concurrency project"]
        },
        {
            "category": "Technical",
            "difficulty": "Intermediate",
            "question": "How do you handle idempotency when designing payment or transaction APIs?",
            "suggested_answer": "At an API gateway level, client requests pass an Idempotency-Key header. We store this key alongside a unique lock in Redis or PostgreSQL. If a duplicate request arrives with the same key, we return the cached response rather than reprocessing the transaction.",
            "important_keywords": ["Idempotency-Key", "Redis", "Distributed Lock", "ACID Transactions"],
            "explanation": "Critical for Stripe and payments infrastructure to prevent double charges.",
            "key_points": ["Client sends unique idempotency key", "Store status in durable fast store like Redis", "Replay cached output on duplicates"]
        },
        {
            "category": "Project-Based",
            "difficulty": "Advanced",
            "question": "In your Microservice Task Engine project, what was the biggest architectural bottleneck you encountered?",
            "suggested_answer": "When throughput exceeded 8,000 req/min, our worker pool faced Redis connection exhaustion. I resolved this by implementing client-side connection pooling in FastAPI and switching from polling to Redis Streams consumer groups with backpressure.",
            "important_keywords": ["Microservice Task Engine", "Redis Streams", "Connection Pooling", "Backpressure"],
            "explanation": "Demonstrates genuine project ownership, debugging skills, and distributed systems awareness.",
            "key_points": ["Identify the exact bottleneck: connection exhaustion", "Explain the solution: Redis Streams + pooling", "Measure the result: handled 10k req/min"]
        }
    ]

    for item in test_scripts:
        s = PreparationScript(
            preparation_set_id=prep_set.id,
            category=item["category"],
            difficulty=item["difficulty"],
            question=item["question"],
            suggested_answer=item["suggested_answer"],
            important_keywords=json.dumps(item["important_keywords"]),
            explanation=item["explanation"],
            key_points=json.dumps(item["key_points"]),
            is_learned=False
        )
        db.add(s)
    db.commit()
    db.refresh(prep_set)
    set_id = prep_set.id
    db.close()
    print("[OK] Test preparation set populated", flush=True)

    print("--- 8. Testing Script Learning Endpoints ---", flush=True)
    # Fetch scripts
    scripts_res = client.get(f"/api/v1/preparation/{set_id}/scripts", headers=headers)
    assert scripts_res.status_code == 200
    scripts = scripts_res.json()
    assert len(scripts) == 3
    first_script_id = scripts[0]["id"]
    assert scripts[0]["is_learned"] is False
    print("[OK] Scripts retrieved successfully", flush=True)

    # Mark as learned
    patch_res = client.patch(f"/api/v1/preparation/scripts/{first_script_id}", json={"is_learned": True}, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["is_learned"] is True
    print("[OK] Script marked as learned", flush=True)

    print("--- 9. Testing Preparation History & Summary ---", flush=True)
    summary_res = client.get("/api/v1/preparation/summary", headers=headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_sets"] >= 1
    assert summary["total_questions"] >= 3
    assert summary["learned_questions"] >= 1
    assert summary["progress_percentage"] > 0
    print(f"[OK] Summary verified: {summary['learned_questions']}/{summary['total_questions']} learned ({summary['progress_percentage']}%)", flush=True)

    all_sets_res = client.get("/api/v1/preparation", headers=headers)
    assert all_sets_res.status_code == 200
    assert len(all_sets_res.json()) >= 1
    print("[OK] Preparation history list verified", flush=True)

    print("--- 10. Testing User Isolation & Data Protection ---", flush=True)
    # Register candidate 2
    user2_reg = client.post("/api/v1/auth/register", json={
        "email": f"candidate2_{int(time.time())}@example.com",
        "password": "Password123!"
    })
    assert user2_reg.status_code == 201

    user2_token = user2_reg.json()["token"]["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    # Candidate 2 should see 0 sets
    u2_history = client.get("/api/v1/preparation", headers=user2_headers)
    assert u2_history.status_code == 200
    assert len(u2_history.json()) == 0

    # Candidate 2 cannot access Candidate 1's set
    u2_access = client.get(f"/api/v1/preparation/{set_id}", headers=user2_headers)
    assert u2_access.status_code == 404

    # Candidate 2 cannot delete Candidate 1's set
    u2_del = client.delete(f"/api/v1/preparation/{set_id}", headers=user2_headers)
    assert u2_del.status_code == 404
    print("[OK] User data isolation strictly verified", flush=True)

    print("--- 11. Testing Deletion by Owner ---", flush=True)
    del_res = client.delete(f"/api/v1/preparation/{set_id}", headers=headers)
    assert del_res.status_code == 200
    # Verify it is deleted
    get_del = client.get(f"/api/v1/preparation/{set_id}", headers=headers)
    assert get_del.status_code == 404
    print("[OK] Preparation set deleted successfully", flush=True)

    print("\n==============================================", flush=True)
    print("ALL USER JOURNEY TESTS COMPLETED SUCCESSFULLY!", flush=True)
    print("==============================================", flush=True)

if __name__ == "__main__":
    test_full_user_journey()

