from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel

from backend.app.services.audio_service import save_and_transcribe_audio, analyze_transcript_communication
from backend.app.schemas.interview import AudioAnalysisResponse
from backend.app.api.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/audio", tags=["Audio Recording & Speech Analysis"])

class AudioAnalyzeRequest(BaseModel):
    text: str
    duration_seconds: Optional[float] = 0.0

@router.post("/transcribe")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    saved_path, transcript, metrics = await save_and_transcribe_audio(file)
    return {
        "audio_path": saved_path,
        "transcript": transcript,
        "metrics": metrics
    }

@router.post("/analyze", response_model=AudioAnalysisResponse)
def analyze_audio_text(
    payload: AudioAnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    data = analyze_transcript_communication(
        text=payload.text,
        duration_seconds=payload.duration_seconds or 0.0
    )
    return AudioAnalysisResponse(**data)
