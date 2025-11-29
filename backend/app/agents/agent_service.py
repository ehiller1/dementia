"""
Agent Service Layer
Provides high-level interface for using CrewAI agents in the application
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio
from functools import partial

from .crews import (
    CrewFactory,
    TaskFactory,
    PatientInteractionCrew,
    StorylineCrew,
    RitualCrew,
    CaregiverSupportCrew
)
from .tools import (
    PATIENT_INTERACTION_TOOLS,
    STORYLINE_TOOLS,
    RITUAL_TOOLS,
    CAREGIVER_TOOLS
)
from ..models import Patient, Conversation, RitualSession, FamilyStorylineSubscription


# ============================================================================
# MAIN AGENT SERVICE
# ============================================================================

class AgentService:
    """
    High-level service for interacting with CrewAI agents
    Provides async interface for all agent operations
    """
    
    def __init__(self, db: Session):
        self.db = db
        self._crew_cache = {}  # Cache crew instances
    
    # ========================================================================
    # PATIENT INTERACTION
    # ========================================================================
    
    async def handle_patient_message(
        self,
        patient_id: int,
        message: str,
        conversation_id: Optional[int] = None
    ) -> Dict:
        """
        Process patient message using patient interaction crew
        
        Args:
            patient_id: Patient ID
            message: Message from patient
            conversation_id: Optional conversation ID for context
            
        Returns:
            {
                "response": "Agent response text",
                "mood_assessment": "calm|engaged|confused|agitated",
                "safety_level": "clear|monitor|elevated|critical",
                "agent_used": "companion|orientation|etc"
            }
        """
        
        # Get patient context
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")
        
        patient_context = {
            "name": patient.user.full_name,
            "stage": patient.dementia_stage.value if patient.dementia_stage else "unknown",
            "preferences": patient.preferences,
            "triggers": patient.known_triggers,
            "current_time": datetime.now().strftime("%I:%M %p")
        }
        
        # Get conversation history
        history = []
        if conversation_id:
            conversation = self.db.query(Conversation).filter(
                Conversation.id == conversation_id
            ).first()
            if conversation and conversation.messages:
                history = conversation.messages[-5:]  # Last 5 messages
        
        # Create crew and task
        crew = CrewFactory.get_patient_interaction_crew()
        task = TaskFactory.create_conversation_task(message, patient_context, history)
        
        # Execute crew (run in thread pool to avoid blocking)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            partial(crew.kickoff, inputs={"patient_message": message})
        )
        
        # Parse result
        response = self._parse_crew_output(result)
        
        return {
            "response": response.get("response", "I'm here with you."),
            "mood_assessment": response.get("mood", "calm"),
            "safety_level": response.get("safety", "clear"),
            "agent_used": response.get("agent", "companion")
        }
    
    # ========================================================================
    # STORYLINE EXECUTION
    # ========================================================================
    
    async def run_storyline_session(
        self,
        subscription_id: int,
        storyline_type: str
    ) -> Dict:
        """
        Execute a storyline session
        
        Args:
            subscription_id: Storyline subscription ID
            storyline_type: Type of storyline to run
            
        Returns:
            {
                "session_narrative": "Full narrative text",
                "engagement_score": 1-5,
                "mood_before": "mood tag",
                "mood_after": "mood tag",
                "content_used": ["photo1.jpg", "photo2.jpg"],
                "highlights": ["Patient smiled at Emily's photo", ...]
            }
        """
        
        # Get subscription and patient
        subscription = self.db.query(FamilyStorylineSubscription).filter(
            FamilyStorylineSubscription.id == subscription_id
        ).first()
        
        if not subscription:
            raise ValueError(f"Subscription {subscription_id} not found")
        
        patient = subscription.patient
        patient_context = {
            "name": patient.user.full_name,
            "stage": patient.dementia_stage.value if patient.dementia_stage else "unknown",
        }
        
        # Get content for session (handled by tools in agent)
        content_items = []  # Agent will retrieve via StorylineContentRetrievalTool
        
        # Create crew and task
        crew = CrewFactory.get_storyline_crew(storyline_type)
        task = TaskFactory.create_storyline_task(
            storyline_type,
            content_items,
            patient_context
        )
        
        # Execute
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            partial(crew.kickoff, inputs={
                "storyline_type": storyline_type,
                "subscription_id": subscription_id
            })
        )
        
        # Parse result
        response = self._parse_crew_output(result)
        
        return {
            "session_narrative": response.get("narrative", ""),
            "engagement_score": response.get("engagement", 3),
            "mood_before": response.get("mood_before", "calm"),
            "mood_after": response.get("mood_after", "calm"),
            "content_used": response.get("content_used", []),
            "highlights": response.get("highlights", [])
        }
    
    # ========================================================================
    # DAILY RITUAL EXECUTION
    # ========================================================================
    
    async def run_daily_ritual(
        self,
        patient_id: int,
        ritual_type: str,
        memory_seed_id: Optional[int] = None
    ) -> Dict:
        """
        Execute a daily ritual session (MVP mode)
        
        Args:
            patient_id: Patient ID
            ritual_type: "good_morning", "memory_seed", "gentle_reflection"
            memory_seed_id: Optional memory seed for memory_seed ritual
            
        Returns:
            {
                "ritual_content": "Full ritual text",
                "mood_tag": "calm|engaged|etc",
                "duration_seconds": 300,
                "completed": True,
                "summary": "Brief summary"
            }
        """
        
        # Get patient
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise ValueError(f"Patient {patient_id} not found")
        
        patient_context = {
            "name": patient.user.full_name,
            "stage": patient.dementia_stage.value if patient.dementia_stage else "unknown",
            "current_time": datetime.now().strftime("%I:%M %p")
        }
        
        # Get memory seed if provided (for memory_seed ritual)
        memory_seed = None
        if memory_seed_id:
            from ..models import MemorySeed
            seed = self.db.query(MemorySeed).filter(
                MemorySeed.id == memory_seed_id
            ).first()
            if seed:
                memory_seed = {
                    "name": seed.name,
                    "description": seed.short_description,
                    "tone_note": seed.tone_note
                }
        
        # Create crew and task
        crew = CrewFactory.get_ritual_crew(ritual_type)
        task = TaskFactory.create_ritual_task(
            ritual_type,
            patient_context,
            memory_seed
        )
        
        # Execute
        loop = asyncio.get_event_loop()
        start_time = datetime.now()
        
        result = await loop.run_in_executor(
            None,
            partial(crew.kickoff, inputs={
                "ritual_type": ritual_type,
                "patient_id": patient_id
            })
        )
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Parse result
        response = self._parse_crew_output(result)
        
        return {
            "ritual_content": response.get("content", ""),
            "mood_tag": response.get("mood", "calm"),
            "duration_seconds": int(duration),
            "completed": True,
            "summary": response.get("summary", "Ritual completed successfully")
        }
    
    # ========================================================================
    # CAREGIVER INSIGHTS
    # ========================================================================
    
    async def generate_caregiver_insights(
        self,
        patient_id: int,
        time_period: str = "last_week"
    ) -> Dict:
        """
        Generate insights report for caregivers
        
        Args:
            patient_id: Patient ID
            time_period: "last_week", "last_month", etc.
            
        Returns:
            {
                "mood_analysis": "Overall mood trend analysis",
                "engagement_patterns": "What's working well",
                "recommendations": ["Rec 1", "Rec 2", ...],
                "concerns": ["Concern 1", ...],
                "report": "Full formatted report for caregiver"
            }
        """
        
        # Gather session data for analysis
        from ..models import RitualSession, StorylineSession
        from datetime import timedelta
        
        # Determine time range
        days = 7 if time_period == "last_week" else 30
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get ritual sessions
        ritual_sessions = self.db.query(RitualSession).filter(
            RitualSession.patient_id == patient_id,
            RitualSession.started_at >= cutoff_date
        ).all()
        
        # Get storyline sessions
        storyline_sessions = self.db.query(StorylineSession).filter(
            StorylineSession.patient_id == patient_id,
            StorylineSession.started_at >= cutoff_date
        ).all()
        
        # Compile session data
        session_data = []
        for session in ritual_sessions:
            session_data.append({
                "type": "ritual",
                "ritual_type": session.ritual_type.value,
                "mood": session.mood_tag.value if session.mood_tag else None,
                "completed": session.completed,
                "duration": session.duration_seconds
            })
        
        for session in storyline_sessions:
            session_data.append({
                "type": "storyline",
                "engagement": session.engagement_level,
                "mood_before": session.mood_before,
                "mood_after": session.mood_after,
                "completed": session.completed
            })
        
        # Create insights crew and tasks
        crew = CrewFactory.get_insights_crew()
        tasks = TaskFactory.create_insights_tasks(
            patient_id,
            time_period,
            session_data
        )
        
        # Add tasks to crew
        crew.tasks = tasks
        
        # Execute
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            partial(crew.kickoff, inputs={
                "patient_id": patient_id,
                "time_period": time_period,
                "session_count": len(session_data)
            })
        )
        
        # Parse result
        response = self._parse_crew_output(result)
        
        return {
            "mood_analysis": response.get("mood_analysis", ""),
            "engagement_patterns": response.get("engagement_patterns", ""),
            "recommendations": response.get("recommendations", []),
            "concerns": response.get("concerns", []),
            "report": response.get("full_report", "")
        }
    
    # ========================================================================
    # CONTENT REVIEW
    # ========================================================================
    
    async def review_family_content(
        self,
        content_id: int
    ) -> Dict:
        """
        Review family-uploaded content for appropriateness
        
        Args:
            content_id: StorylineContent ID
            
        Returns:
            {
                "approved": True/False,
                "feedback": "Specific feedback if changes needed",
                "quality_score": 0-100,
                "suggestions": ["Suggestion 1", ...]
            }
        """
        
        from ..models import StorylineContent
        
        # Get content
        content = self.db.query(StorylineContent).filter(
            StorylineContent.id == content_id
        ).first()
        
        if not content:
            raise ValueError(f"Content {content_id} not found")
        
        content_item = {
            "content_type": content.content_type,
            "title": content.title,
            "description": content.description,
            "tone_note": content.tone_note,
            "file_url": content.file_url
        }
        
        # Create review crew and task
        crew = CrewFactory.get_content_review_crew()
        task = TaskFactory.create_content_review_task(content_item)
        
        # Execute
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            partial(crew.kickoff, inputs={"content_id": content_id})
        )
        
        # Parse result
        response = self._parse_crew_output(result)
        
        return {
            "approved": response.get("approved", False),
            "feedback": response.get("feedback", ""),
            "quality_score": response.get("quality_score", 50),
            "suggestions": response.get("suggestions", [])
        }
    
    # ========================================================================
    # UTILITY METHODS
    # ========================================================================
    
    def _parse_crew_output(self, crew_result) -> Dict:
        """
        Parse CrewAI output into structured dictionary
        
        CrewAI returns various formats, this normalizes them
        """
        
        # If result is already a dict, return it
        if isinstance(crew_result, dict):
            return crew_result
        
        # If result is a string, try to extract structured data
        if isinstance(crew_result, str):
            # For now, return basic structure
            # TODO: Add more sophisticated parsing if needed
            return {
                "response": crew_result,
                "raw_output": crew_result
            }
        
        # If result has a 'result' attribute (common in CrewAI)
        if hasattr(crew_result, 'result'):
            return self._parse_crew_output(crew_result.result)
        
        # Default fallback
        return {
            "response": str(crew_result),
            "raw_output": str(crew_result)
        }


# ============================================================================
# QUICK ACCESS FUNCTIONS
# ============================================================================

async def process_patient_message(
    db: Session,
    patient_id: int,
    message: str,
    conversation_id: Optional[int] = None
) -> Dict:
    """Quick access function for patient message processing"""
    service = AgentService(db)
    return await service.handle_patient_message(patient_id, message, conversation_id)


async def execute_storyline(
    db: Session,
    subscription_id: int,
    storyline_type: str
) -> Dict:
    """Quick access function for storyline execution"""
    service = AgentService(db)
    return await service.run_storyline_session(subscription_id, storyline_type)


async def execute_ritual(
    db: Session,
    patient_id: int,
    ritual_type: str,
    memory_seed_id: Optional[int] = None
) -> Dict:
    """Quick access function for ritual execution"""
    service = AgentService(db)
    return await service.run_daily_ritual(patient_id, ritual_type, memory_seed_id)


async def generate_insights(
    db: Session,
    patient_id: int,
    time_period: str = "last_week"
) -> Dict:
    """Quick access function for insights generation"""
    service = AgentService(db)
    return await service.generate_caregiver_insights(patient_id, time_period)
