import os
import re
import math
import uuid
import logging
from typing import Dict, Any, List, Tuple, Optional
from fastapi import UploadFile, HTTPException, status
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Allowed audio extensions and MIME types
ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".ogg", ".m4a", ".mp4"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads/audio"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Common filler words pattern
FILLER_PATTERNS = {
    "um": r"\b(um|umm|ummm)\b",
    "uh": r"\b(uh|uhh|uhhh)\b",
    "like": r"\b(like)\b",
    "you know": r"\b(you\s+know)\b",
    "actually": r"\b(actually)\b",
    "basically": r"\b(basically)\b",
    "so yeah": r"\b(so\s+yeah)\b",
    "I mean": r"\b(i\s+mean)\b"
}

# Singleton model instance
_whisper_model = None

def get_whisper_model():
    """
    Returns the singleton WhisperModel instance, lazily loaded.
    Attempts CUDA first if requested/auto, and falls back gracefully to CPU.
    """
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        logger.error("faster-whisper is not installed. Please install faster-whisper.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="faster-whisper library is not installed on the server."
        )

    model_size = settings.WHISPER_MODEL_SIZE or "base"
    requested_device = (settings.WHISPER_DEVICE or "auto").lower()
    compute_type = settings.WHISPER_COMPUTE_TYPE or "int8"

    # Attempt CUDA first if auto or cuda
    if requested_device in ("auto", "cuda"):
        try:
            logger.info(f"Attempting to load faster-whisper model '{model_size}' on CUDA...")
            cuda_compute = "float16" if compute_type in ("auto", "float16") else compute_type
            _whisper_model = WhisperModel(model_size, device="cuda", compute_type=cuda_compute)
            logger.info(f"faster-whisper model '{model_size}' successfully loaded on CUDA.")
            return _whisper_model
        except Exception as cuda_err:
            logger.warning(f"CUDA faster-whisper initialization failed ({cuda_err}). Gracefully falling back to CPU...")

    # CPU fallback
    try:
        logger.info(f"Loading faster-whisper model '{model_size}' on CPU...")
        cpu_compute = "int8" if compute_type in ("auto", "int8") else "default"
        try:
            _whisper_model = WhisperModel(model_size, device="cpu", compute_type=cpu_compute)
        except Exception:
            _whisper_model = WhisperModel(model_size, device="cpu", compute_type="default")
        logger.info(f"faster-whisper model '{model_size}' successfully loaded on CPU.")
        return _whisper_model
    except Exception as e:
        logger.error(f"Failed to load faster-whisper model on CPU: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize local speech-to-text model: {str(e)}"
        )

def analyze_transcript_communication(text: str, duration_seconds: float = 0.0) -> Dict[str, Any]:
    """
    Computes objective communication metrics from spoken text and audio duration.
    Includes words per minute, filler words detection, repeated words, and pacing.
    """
    cleaned_text = (text or "").strip()
    words = re.findall(r"\b[A-Za-z0-9'-]+\b", cleaned_text)
    word_count = len(words)

    # Duration fallback estimate if 0 (assume average speaking rate 130 wpm)
    if duration_seconds <= 0.5:
        duration_seconds = max(2.0, (word_count / 130.0) * 60.0) if word_count > 0 else 2.0

    # Words per minute calculation
    wpm = round((word_count / duration_seconds) * 60.0, 1) if duration_seconds > 0 else 0.0

    # Filler word frequencies
    filler_details: Dict[str, int] = {}
    total_fillers = 0
    text_lower = cleaned_text.lower()

    for label, pattern in FILLER_PATTERNS.items():
        matches = re.findall(pattern, text_lower)
        count = len(matches)
        if count > 0:
            filler_details[label] = count
            total_fillers += count

    # Detect repeated consecutive words (e.g. "we we", "I I")
    repeated_words: List[str] = []
    for i in range(len(words) - 1):
        w1, w2 = words[i].lower(), words[i+1].lower()
        if w1 == w2 and len(w1) > 1 and w1 not in repeated_words:
            repeated_words.append(w1)

    # Objective Pace & Pause Observations
    if wpm == 0:
        pause_info = "No speech detected in answer."
    elif wpm < 100:
        pause_info = f"Measured pace is deliberate ({wpm} WPM) with frequent conceptual pauses. Consider connecting ideas with smoother transitions."
    elif wpm > 175:
        pause_info = f"Measured pace is rapid ({wpm} WPM). Taking brief 1-2 second pauses after key points helps interviewers absorb complex concepts."
    else:
        pause_info = f"Optimal conversational pace ({wpm} WPM). Clear cadence and steady delivery."

    return {
        "speaking_duration": round(duration_seconds, 1),
        "words_per_minute": wpm,
        "filler_word_count": total_fillers,
        "filler_word_details": filler_details,
        "pause_information": pause_info,
        "repeated_words": repeated_words[:5]
    }

async def save_and_transcribe_audio(file: UploadFile) -> Tuple[str, str, Dict[str, Any]]:
    """
    Saves uploaded audio file, verifies format/size, transcribes locally via faster-whisper,
    and returns (saved_path, transcript, audio_metrics).
    """
    filename = file.filename or "recording.webm"
    _, ext = os.path.splitext(filename.lower())

    if not ext or ext not in ALLOWED_EXTENSIONS:
        ext = ".webm"

    unique_filename = f"{uuid.uuid4()}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Read and validate file content size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file exceeds the maximum 25 MB limit."
        )

    if len(contents) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty or corrupted."
        )

    # Write file to secure storage
    with open(saved_path, "wb") as f:
        f.write(contents)

    transcript = ""
    audio_duration = 0.0

    try:
        model = get_whisper_model()
        segments, info = model.transcribe(saved_path, beam_size=5)
        segment_texts = [segment.text.strip() for segment in segments if segment.text.strip()]
        transcript = " ".join(segment_texts).strip()
        if hasattr(info, "duration") and info.duration:
            audio_duration = float(info.duration)
    except Exception as e:
        logger.error(f"Local faster-whisper transcription error: {e}")
        transcript = ""

    # If transcription came out empty (silence or ambient noise)
    if not transcript:
        transcript = "Audio recorded successfully. (No distinct speech was detected or voice was silent.)"

    # Analyze communications
    metrics = analyze_transcript_communication(transcript, audio_duration)

    return saved_path, transcript, metrics
