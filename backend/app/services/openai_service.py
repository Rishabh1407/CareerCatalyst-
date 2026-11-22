"""
CareerCatalyst - AI Service Legacy Shim
Migrated from OpenAI to Google Gemini (google-genai).
Forwards all calls to backend.app.services.gemini_service.
"""
from backend.app.services.gemini_service import (
    generate_interview_preparation_gemini as generate_interview_preparation,
    generate_structured_json_gemini,
    generate_text_gemini
)

__all__ = [
    "generate_interview_preparation",
    "generate_structured_json_gemini",
    "generate_text_gemini"
]
