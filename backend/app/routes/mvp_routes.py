"""
MVP Daily Ritual Routes

Simple API endpoints for MVP mode:
- Memory seed management (simplified)
- Ritual session tracking
- Simple completion calendar
- Mood tagging only (no complex analytics)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, time as time_type
from pydantic import BaseModel

from ..database import get_db
from ..models import (
    Patient, MemorySeed, RitualSession, ProductMode,
    RitualType, MoodTag
)
from ..services.ritual_engine import RitualEngine
from ..routes.auth_routes import get_current_user
from ..models import User

router = APIRouter(prefix="/api/mvp", tags=["mvp"])


# ============================================================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================================================

class MemorySeedCreate(BaseModel):
    name: str
    short_description: Optional[str] = None
    photo_url: Optional[str] = None
    tone_note: Optional[str] = None
    memory_category: Optional[str] = "person"  # person, place, event, hobby

class MemorySeedResponse(BaseModel):
    id: int
    name: str
    short_description: Optional[str]
    photo_url: Optional[str]
    tone_note: Optional[str]
    memory_category: Optional[str]
    times_used: int
    last_used_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class RitualSessionResponse(BaseModel):
    id: int
    ritual_type: str
    scheduled_date: datetime
    completed: bool
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration_seconds: Optional[int]
    mood_tag: Optional[str]
    ended_by_user: bool
    summary: Optional[str]
    
    class Config:
        from_attributes = True

class RitualCalendarDay(BaseModel):
    date: str
    completed: bool
    mood_tag: Optional[str]
    duration_seconds: Optional[int]
    ended_by_user: Optional[bool]

class PatientMVPSetup(BaseModel):
    """Quick setup for MVP mode (< 10 minutes)"""
    ritual_enabled: bool = True
    ritual_time: str = "09:00"  # HH:MM format
    ritual_duration_minutes: int = 10
    ritual_type: str = "good_morning"  # good_morning, memory_seed, gentle_reflection
    store_ritual_transcripts: bool = False


# ============================================================================
# MEMORY SEEDS ENDPOINTS (Simplified Memory Management)
# ============================================================================

@router.post("/patients/{patient_id}/memory-seeds", response_model=MemorySeedResponse)
def create_memory_seed(
    patient_id: int,
    seed: MemorySeedCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a memory seed for MVP daily rituals.
    Much simpler than comprehensive memory entries.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create memory seed
    memory_seed = MemorySeed(
        patient_id=patient_id,
        name=seed.name,
        short_description=seed.short_description,
        photo_url=seed.photo_url,
        tone_note=seed.tone_note,
        memory_category=seed.memory_category,
        created_by=current_user.id
    )
    
    db.add(memory_seed)
    db.commit()
    db.refresh(memory_seed)
    
    return memory_seed


@router.get("/patients/{patient_id}/memory-seeds", response_model=List[MemorySeedResponse])
def get_memory_seeds(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all memory seeds for a patient"""
    seeds = db.query(MemorySeed).filter(
        MemorySeed.patient_id == patient_id
    ).all()
    
    return seeds


@router.delete("/patients/{patient_id}/memory-seeds/{seed_id}")
def delete_memory_seed(
    patient_id: int,
    seed_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a memory seed"""
    seed = db.query(MemorySeed).filter(
        MemorySeed.id == seed_id,
        MemorySeed.patient_id == patient_id
    ).first()
    
    if not seed:
        raise HTTPException(status_code=404, detail="Memory seed not found")
    
    db.delete(seed)
    db.commit()
    
    return {"message": "Memory seed deleted"}


# ============================================================================
# RITUAL SESSION ENDPOINTS
# ============================================================================

@router.post("/patients/{patient_id}/start-ritual", response_model=RitualSessionResponse)
def start_daily_ritual(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Start today's daily ritual for a patient.
    Creates the session if it doesn't exist.
    """
    ritual_engine = RitualEngine(db)
    
    session = ritual_engine.start_ritual(patient_id)
    
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Patient not in Daily Ritual mode or ritual not enabled"
        )
    
    # Get ritual context for frontend
    context = ritual_engine.get_ritual_context(session)
    
    # Convert to response format
    response = RitualSessionResponse(
        id=session.id,
        ritual_type=session.ritual_type.value,
        scheduled_date=session.scheduled_date,
        completed=session.completed,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration_seconds=session.duration_seconds,
        mood_tag=session.mood_tag.value if session.mood_tag else None,
        ended_by_user=session.ended_by_user,
        summary=session.summary
    )
    
    # Add context to response (for frontend to know what to display)
    response_dict = response.dict()
    response_dict["ritual_context"] = context
    
    return response_dict


@router.post("/ritual-sessions/{session_id}/complete")
def complete_ritual_session(
    session_id: int,
    mood_tag: str,
    ended_by_user: bool = False,
    summary: Optional[str] = None,
    transcript: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Mark a ritual session as completed with mood tag.
    """
    ritual_engine = RitualEngine(db)
    
    # Convert string to enum
    try:
        mood_enum = MoodTag(mood_tag)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid mood tag: {mood_tag}")
    
    session = ritual_engine.complete_ritual(
        session_id=session_id,
        mood_tag=mood_enum,
        ended_by_user=ended_by_user,
        summary=summary,
        transcript=transcript
    )
    
    return {
        "message": "Ritual session completed",
        "session_id": session.id,
        "completed": session.completed,
        "mood_tag": session.mood_tag.value,
        "duration_seconds": session.duration_seconds
    }


@router.get("/patients/{patient_id}/ritual-calendar", response_model=List[RitualCalendarDay])
def get_ritual_calendar(
    patient_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get simple ✅/❌ calendar for the past N days.
    Perfect for MVP dashboard.
    """
    ritual_engine = RitualEngine(db)
    
    calendar = ritual_engine.get_ritual_calendar(patient_id, days)
    
    return calendar


@router.get("/patients/{patient_id}/ritual-stats")
def get_ritual_stats(
    patient_id: int,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get simple completion statistics for MVP dashboard.
    No complex analytics, just:
    - % days completed
    - Most common mood
    - Weeks of continued use
    """
    ritual_engine = RitualEngine(db)
    
    stats = ritual_engine.get_completion_stats(patient_id, days)
    
    return stats


# ============================================================================
# MVP SETUP & CONFIGURATION
# ============================================================================

@router.post("/patients/{patient_id}/setup-mvp")
def setup_mvp_mode(
    patient_id: int,
    setup: PatientMVPSetup,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick MVP setup for a patient (< 10 minutes).
    Sets patient to Daily Ritual mode with simple settings.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Parse ritual time
    try:
        hour, minute = map(int, setup.ritual_time.split(":"))
        ritual_time = time_type(hour, minute)
    except:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")
    
    # Parse ritual type
    try:
        ritual_type_enum = RitualType(setup.ritual_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ritual type. Choose: good_morning, memory_seed, gentle_reflection"
        )
    
    # Update patient to MVP mode
    patient.product_mode = ProductMode.DAILY_RITUAL
    patient.ritual_enabled = setup.ritual_enabled
    patient.ritual_time = ritual_time
    patient.ritual_duration_minutes = setup.ritual_duration_minutes
    patient.ritual_type = ritual_type_enum
    patient.store_ritual_transcripts = setup.store_ritual_transcripts
    
    db.commit()
    
    return {
        "message": "MVP Daily Ritual mode enabled",
        "patient_id": patient_id,
        "ritual_time": setup.ritual_time,
        "ritual_type": setup.ritual_type,
        "ritual_enabled": setup.ritual_enabled
    }


@router.get("/patients/{patient_id}/is-ritual-due")
def check_ritual_due(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    Check if today's ritual is due.
    Returns True if not yet completed today.
    """
    ritual_engine = RitualEngine(db)
    
    is_due = ritual_engine.is_ritual_due_today(patient_id)
    today_session = ritual_engine.get_todays_session(patient_id)
    
    return {
        "is_due": is_due,
        "has_session_today": today_session is not None,
        "completed_today": today_session.completed if today_session else False
    }
