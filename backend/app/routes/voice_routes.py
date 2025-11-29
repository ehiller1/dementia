"""
Voice API Routes
Endpoints for speech-to-text, text-to-speech, and voice interactions
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import os

from ..database import get_db
from ..services.voice_service import VoiceService
from ..services.engagement_analytics import EngagementAnalytics
from ..models import Patient

router = APIRouter(prefix="/api/voice", tags=["voice"])

# Initialize voice service
voice_service = VoiceService()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TextToSpeechRequest(BaseModel):
    """Request to convert text to speech"""
    text: str
    emotion: Optional[str] = "neutral"  # neutral, warm, calming, encouraging
    patient_id: Optional[int] = None  # For engagement tracking


class SimplifyTextRequest(BaseModel):
    """Request to simplify text"""
    text: str


class TranscriptionResponse(BaseModel):
    """Response from transcription"""
    text: str
    language: str
    duration: Optional[float]
    word_count: int
    clarity_analysis: dict
    success: bool


# ============================================================================
# SPEECH-TO-TEXT ENDPOINTS
# ============================================================================

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    language: str = Form("en"),
    track_engagement: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    Transcribe audio to text using Whisper
    
    - Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    - Max file size: 25MB
    - Optional engagement tracking
    """
    
    # Validate patient if provided
    if patient_id:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
        # Read audio file
        audio_data = await audio.read()
        audio_file = audio.file
        
        # Validate audio quality
        validation = voice_service.validate_audio_quality(audio_file)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["error"])
        
        # Transcribe
        audio_file.seek(0)  # Reset file pointer
        result = voice_service.transcribe_audio(audio_file, language=language)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Transcription failed"))
        
        # Analyze speech clarity
        clarity = voice_service.analyze_speech_clarity(result["text"])
        
        # Track engagement if requested
        if track_engagement and patient_id:
            analytics = EngagementAnalytics(db)
            
            # Record verbal engagement metrics
            analytics.record_engagement(
                patient_id=patient_id,
                session_data={
                    "verbal_response_count": 1,
                    "total_words_spoken": clarity["word_count"],
                    "avg_response_length_words": clarity["word_count"],
                    "verbal_clarity_score": clarity["clarity_score"],
                    "hesitation_count": clarity["hesitation_count"],
                    "session_duration_seconds": int(result.get("duration", 0)) if result.get("duration") else None,
                    "time_of_day": _get_time_of_day()
                }
            )
        
        return {
            "text": result["text"],
            "language": result.get("language", language),
            "duration": result.get("duration"),
            "word_count": clarity["word_count"],
            "clarity_analysis": clarity,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/transcribe-with-timestamps")
async def transcribe_with_timestamps(
    audio: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Transcribe audio with word-level timestamps
    
    Useful for:
    - Response time measurement
    - Hesitation detection
    - Speech rate analysis
    """
    
    try:
        audio_file = audio.file
        audio_file.seek(0)
        
        result = voice_service.transcribe_with_timestamps(audio_file, language=language)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Transcription failed"))
        
        # Calculate response time (time to first word)
        response_time = voice_service.detect_response_time(result["words"])
        
        return {
            "text": result["text"],
            "words": result["words"],
            "word_count": result["word_count"],
            "duration": result.get("duration"),
            "response_time_seconds": response_time,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TEXT-TO-SPEECH ENDPOINTS
# ============================================================================

@router.post("/speak")
async def text_to_speech(
    request: TextToSpeechRequest,
    db: Session = Depends(get_db)
):
    """
    Convert text to speech with consistent voice
    
    - Voice: alloy (warm, friendly)
    - Speed: 0.85 (slightly slower for clarity)
    - Language automatically simplified for dementia care
    """
    
    # Validate patient if provided
    if request.patient_id:
        patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
        # Generate speech
        result = voice_service.speak_response(request.text, emotion=request.emotion)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Speech generation failed"))
        
        # Return audio file
        audio_path = result["audio_path"]
        
        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            filename="response.mp3",
            headers={
                "X-Duration-Estimate": str(result["duration_estimate"]),
                "X-Text-Used": result["text_used"]
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/speak-preset/{preset_type}")
async def speak_preset(preset_type: str):
    """
    Get pre-generated audio for common phrases
    
    Presets:
    - greeting_morning
    - greeting_afternoon
    - greeting_evening
    - encouragement
    - validation
    - ending_session
    - pause
    - memory_prompt
    - acknowledgment
    """
    
    valid_presets = [
        "greeting_morning", "greeting_afternoon", "greeting_evening",
        "encouragement", "validation", "ending_session",
        "pause", "memory_prompt", "acknowledgment"
    ]
    
    if preset_type not in valid_presets:
        raise HTTPException(status_code=400, detail=f"Invalid preset. Choose from: {', '.join(valid_presets)}")
    
    try:
        result = voice_service.get_preset_audio(preset_type)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail="Speech generation failed")
        
        return FileResponse(
            result["audio_path"],
            media_type="audio/mpeg",
            filename=f"{preset_type}.mp3"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# LANGUAGE SIMPLIFICATION ENDPOINTS
# ============================================================================

@router.post("/simplify")
async def simplify_text(request: SimplifyTextRequest):
    """
    Simplify text for dementia patients
    
    Applies:
    - Short sentences (max 10-12 words)
    - Simple vocabulary
    - Active voice
    - Present tense
    - One idea per sentence
    """
    
    simplified = voice_service.simplify_for_dementia(request.text)
    formatted = voice_service.format_for_clarity(simplified)
    
    return {
        "original": request.text,
        "simplified": simplified,
        "formatted": formatted,
        "original_word_count": len(request.text.split()),
        "simplified_word_count": len(simplified.split())
    }


@router.post("/analyze-clarity")
async def analyze_speech_clarity(
    text: str = Form(...)
):
    """
    Analyze speech clarity from text
    
    Returns:
    - Word counts
    - Vocabulary diversity
    - Hesitation markers
    - Repetition count
    - Clarity score (0-1)
    """
    
    analysis = voice_service.analyze_speech_clarity(text)
    
    return analysis


# ============================================================================
# VOICE SETTINGS ENDPOINTS
# ============================================================================

@router.get("/settings")
async def get_voice_settings():
    """
    Get current voice configuration
    
    Returns consistent voice settings used across all interactions
    """
    
    return voice_service.get_voice_settings()


@router.get("/voices")
async def list_available_voices():
    """
    List available TTS voices
    
    All voices support English and multiple languages
    """
    
    return {
        "current_voice": voice_service.tts_voice,
        "available_voices": [
            {
                "id": "alloy",
                "description": "Neutral, balanced (current default)",
                "best_for": "General use, dementia care"
            },
            {
                "id": "echo",
                "description": "Male, clear",
                "best_for": "Male preference"
            },
            {
                "id": "fable",
                "description": "British accent, expressive",
                "best_for": "Storytelling"
            },
            {
                "id": "onyx",
                "description": "Deep, authoritative",
                "best_for": "Calm, grounding"
            },
            {
                "id": "nova",
                "description": "Female, warm",
                "best_for": "Friendly, conversational"
            },
            {
                "id": "shimmer",
                "description": "Soft, soothing",
                "best_for": "Calming, gentle"
            }
        ],
        "speed_settings": {
            "current": voice_service.tts_speed,
            "neutral": 0.85,
            "warm": 0.80,
            "calming": 0.75,
            "encouraging": 0.90,
            "range": "0.25 to 4.0"
        }
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _get_time_of_day() -> str:
    """Get current time of day for engagement tracking"""
    from datetime import datetime
    hour = datetime.now().hour
    
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"
