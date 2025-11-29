"""
Daily Ritual Engine for MVP Mode

Manages the daily conversational ritual:
- One session per day at a fixed time
- Fixed duration (10 minutes default)
- Three ritual types: Good Morning, Memory Seed, Gentle Reflection
- Simple completion tracking (✅/❌)
- No "failure" state - just tries again tomorrow

This is separate from the comprehensive care system.
"""

from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import Optional, List, Dict
import random

from ..models import (
    Patient, RitualSession, MemorySeed, RitualType, MoodTag,
    ProductMode
)
from ..config import settings


class RitualEngine:
    """Manages daily ritual sessions for MVP mode"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def is_ritual_due_today(self, patient_id: int) -> bool:
        """
        Check if patient's daily ritual is due today.
        Returns False if already completed today or not in ritual mode.
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient:
            return False
        
        # Only for daily ritual mode
        if patient.product_mode != ProductMode.DAILY_RITUAL:
            return False
        
        if not patient.ritual_enabled:
            return False
        
        # Check if already completed today
        today = date.today()
        today_session = self.db.query(RitualSession).filter(
            and_(
                RitualSession.patient_id == patient_id,
                RitualSession.scheduled_date >= datetime.combine(today, time.min),
                RitualSession.scheduled_date < datetime.combine(today + timedelta(days=1), time.min),
                RitualSession.completed == True
            )
        ).first()
        
        return today_session is None
    
    def create_todays_ritual(self, patient_id: int) -> Optional[RitualSession]:
        """
        Create today's ritual session for a patient.
        Returns None if not in ritual mode or already exists.
        """
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        
        if not patient or patient.product_mode != ProductMode.DAILY_RITUAL:
            return None
        
        # Check if already exists
        today = date.today()
        existing = self.db.query(RitualSession).filter(
            and_(
                RitualSession.patient_id == patient_id,
                RitualSession.scheduled_date >= datetime.combine(today, time.min),
                RitualSession.scheduled_date < datetime.combine(today + timedelta(days=1), time.min)
            )
        ).first()
        
        if existing:
            return existing
        
        # Create new ritual session
        ritual_session = RitualSession(
            patient_id=patient_id,
            ritual_type=patient.ritual_type,
            scheduled_date=datetime.combine(today, patient.ritual_time or time(9, 0)),
            completed=False
        )
        
        self.db.add(ritual_session)
        self.db.commit()
        self.db.refresh(ritual_session)
        
        return ritual_session
    
    def start_ritual(self, patient_id: int) -> Optional[RitualSession]:
        """
        Start today's ritual session.
        Creates the session if it doesn't exist.
        """
        # Get or create today's session
        session = self.create_todays_ritual(patient_id)
        
        if not session:
            return None
        
        # Mark as started
        if not session.started_at:
            session.started_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(session)
        
        return session
    
    def complete_ritual(
        self, 
        session_id: int, 
        mood_tag: MoodTag,
        ended_by_user: bool = False,
        summary: Optional[str] = None,
        transcript: Optional[str] = None
    ) -> RitualSession:
        """
        Mark a ritual session as completed with mood tag.
        
        Args:
            session_id: ID of the ritual session
            mood_tag: Simple mood tag (calm, engaged, tired, etc.)
            ended_by_user: Did the elder say "I'm tired" or similar?
            summary: Brief summary of the session
            transcript: Full transcript (only stored if privacy settings allow)
        """
        session = self.db.query(RitualSession).filter(RitualSession.id == session_id).first()
        
        if not session:
            raise ValueError(f"Ritual session {session_id} not found")
        
        # Get patient to check privacy settings
        patient = self.db.query(Patient).filter(Patient.id == session.patient_id).first()
        
        # Mark as completed
        session.completed = True
        session.ended_at = datetime.utcnow()
        session.mood_tag = mood_tag
        session.ended_by_user = ended_by_user
        
        # Calculate duration
        if session.started_at:
            duration = (session.ended_at - session.started_at).total_seconds()
            session.duration_seconds = int(duration)
        
        # Store summary (always)
        if summary:
            session.summary = summary
        
        # Store transcript only if privacy settings allow
        if transcript and patient and patient.store_ritual_transcripts:
            session.transcript = transcript
        
        self.db.commit()
        self.db.refresh(session)
        
        return session
    
    def get_todays_session(self, patient_id: int) -> Optional[RitualSession]:
        """Get today's ritual session for a patient"""
        today = date.today()
        
        return self.db.query(RitualSession).filter(
            and_(
                RitualSession.patient_id == patient_id,
                RitualSession.scheduled_date >= datetime.combine(today, time.min),
                RitualSession.scheduled_date < datetime.combine(today + timedelta(days=1), time.min)
            )
        ).first()
    
    def get_ritual_calendar(self, patient_id: int, days: int = 30) -> List[Dict]:
        """
        Get ritual completion calendar for the past N days.
        Returns simple ✅/❌ status for each day.
        
        Perfect for MVP dashboard.
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
        
        sessions = self.db.query(RitualSession).filter(
            and_(
                RitualSession.patient_id == patient_id,
                RitualSession.scheduled_date >= datetime.combine(start_date, time.min),
                RitualSession.scheduled_date <= datetime.combine(end_date, time.max)
            )
        ).all()
        
        # Create calendar dict
        calendar = {}
        for session in sessions:
            day = session.scheduled_date.date()
            calendar[day] = {
                "date": day.isoformat(),
                "completed": session.completed,
                "mood_tag": session.mood_tag.value if session.mood_tag else None,
                "duration_seconds": session.duration_seconds,
                "ended_by_user": session.ended_by_user
            }
        
        # Fill in missing days with "missed"
        result = []
        current = start_date
        while current <= end_date:
            if current in calendar:
                result.append(calendar[current])
            else:
                result.append({
                    "date": current.isoformat(),
                    "completed": False,
                    "mood_tag": None,
                    "duration_seconds": None,
                    "ended_by_user": None
                })
            current += timedelta(days=1)
        
        return result
    
    def get_completion_stats(self, patient_id: int, days: int = 7) -> Dict:
        """
        Get simple completion statistics for MVP dashboard.
        
        Returns:
            - Total days in period
            - Days completed
            - Completion percentage
            - Most common mood tag
            - Weeks of continued use
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
        
        sessions = self.db.query(RitualSession).filter(
            and_(
                RitualSession.patient_id == patient_id,
                RitualSession.scheduled_date >= datetime.combine(start_date, time.min)
            )
        ).all()
        
        completed_sessions = [s for s in sessions if s.completed]
        
        # Calculate weeks of continued use (first ritual to now)
        first_session = self.db.query(RitualSession).filter(
            RitualSession.patient_id == patient_id
        ).order_by(RitualSession.scheduled_date).first()
        
        weeks_of_use = 0
        if first_session:
            days_since_first = (datetime.utcnow() - first_session.scheduled_date).days
            weeks_of_use = days_since_first // 7
        
        # Most common mood tag
        mood_counts = {}
        for session in completed_sessions:
            if session.mood_tag:
                mood = session.mood_tag.value
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
        
        most_common_mood = max(mood_counts, key=mood_counts.get) if mood_counts else None
        
        return {
            "total_days": days,
            "days_completed": len(completed_sessions),
            "completion_percentage": (len(completed_sessions) / days * 100) if days > 0 else 0,
            "most_common_mood": most_common_mood,
            "weeks_of_continued_use": weeks_of_use,
            "total_sessions_ever": self.db.query(RitualSession).filter(
                RitualSession.patient_id == patient_id
            ).count()
        }
    
    def select_memory_seed(self, patient_id: int) -> Optional[MemorySeed]:
        """
        Select a memory seed for today's MEMORY_SEED ritual.
        
        Strategy:
        - Rotate through seeds
        - Prefer less recently used
        - Repetition is welcomed (not tested)
        """
        seeds = self.db.query(MemorySeed).filter(
            MemorySeed.patient_id == patient_id
        ).order_by(
            MemorySeed.last_used_at.asc().nullsfirst(),
            MemorySeed.times_used.asc()
        ).all()
        
        if not seeds:
            return None
        
        # Select the least recently used seed
        selected_seed = seeds[0]
        
        # Update usage tracking
        selected_seed.times_used += 1
        selected_seed.last_used_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(selected_seed)
        
        return selected_seed
    
    def get_ritual_context(self, session: RitualSession) -> Dict:
        """
        Get context for the ritual based on type.
        Returns data needed for LLM prompt generation.
        """
        patient = self.db.query(Patient).filter(Patient.id == session.patient_id).first()
        
        if not patient:
            return {}
        
        context = {
            "ritual_type": session.ritual_type.value,
            "patient_name": patient.user.full_name if patient.user else "friend",
            "duration_minutes": patient.ritual_duration_minutes,
        }
        
        # Type-specific context
        if session.ritual_type == RitualType.GOOD_MORNING:
            now = datetime.now()
            context.update({
                "day_of_week": now.strftime("%A"),
                "date": now.strftime("%B %d, %Y"),
                "time_of_day": "morning" if now.hour < 12 else "afternoon" if now.hour < 18 else "evening"
            })
        
        elif session.ritual_type == RitualType.MEMORY_SEED:
            # Get the memory seed
            memory_seed = self.select_memory_seed(patient.id)
            if memory_seed:
                session.memory_seed_id = memory_seed.id
                self.db.commit()
                
                context.update({
                    "memory_name": memory_seed.name,
                    "memory_description": memory_seed.short_description,
                    "tone_note": memory_seed.tone_note,
                    "memory_category": memory_seed.memory_category
                })
        
        elif session.ritual_type == RitualType.GENTLE_REFLECTION:
            context.update({
                "focus": "feelings and well-being"
            })
        
        return context
