"""
Custom CrewAI Tools for Memory Care Agents
Tools allow agents to interact with database, retrieve context, and perform actions
"""

from crewai_tools import BaseTool
from typing import Type, Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models import Patient, MemoryEntry, MemorySeed, Conversation, RitualSession, StorylineContent
from ..database import get_db


# ============================================================================
# TOOL INPUT SCHEMAS
# ============================================================================

class PatientContextInput(BaseModel):
    """Input for retrieving patient context"""
    patient_id: int = Field(..., description="The ID of the patient")


class MemorySearchInput(BaseModel):
    """Input for searching patient memories"""
    patient_id: int = Field(..., description="The ID of the patient")
    query: str = Field(..., description="Search query for memories")
    limit: int = Field(default=5, description="Number of results to return")


class ConversationHistoryInput(BaseModel):
    """Input for retrieving conversation history"""
    patient_id: int = Field(..., description="The ID of the patient")
    limit: int = Field(default=10, description="Number of recent messages")


class SafetyCheckInput(BaseModel):
    """Input for safety assessment"""
    patient_message: str = Field(..., description="Message from patient to analyze")
    context: str = Field(default="", description="Additional context")


class StorylineContentInput(BaseModel):
    """Input for retrieving storyline content"""
    subscription_id: int = Field(..., description="Storyline subscription ID")
    limit: int = Field(default=3, description="Number of content items")


# ============================================================================
# PATIENT CONTEXT TOOLS
# ============================================================================

class PatientProfileTool(BaseTool):
    name: str = "Get Patient Profile"
    description: str = (
        "Retrieves comprehensive patient profile including name, dementia stage, "
        "preferences, life history, and care notes. Use this to understand who "
        "you're talking to and personalize your responses."
    )
    args_schema: Type[BaseModel] = PatientContextInput
    
    def _run(self, patient_id: int) -> str:
        """Retrieve patient profile"""
        db: Session = next(get_db())
        try:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            
            if not patient:
                return f"Patient {patient_id} not found"
            
            profile = f"""
PATIENT PROFILE:
Name: {patient.user.full_name}
Dementia Stage: {patient.dementia_stage.value if patient.dementia_stage else 'Unknown'}
Product Mode: {patient.product_mode.value if patient.product_mode else 'Unknown'}

PREFERENCES:
{patient.preferences or 'No preferences recorded'}

LIFE HISTORY:
{patient.life_history_summary or 'No life history available'}

KNOWN TRIGGERS:
{patient.known_triggers or 'None documented'}

CARE NOTES:
{patient.care_notes or 'No additional notes'}

IMPORTANT REMINDERS:
- Communication style: {patient.preferred_communication_style or 'Standard warm and validating'}
- Topics to avoid: {patient.topics_to_avoid or 'None specified'}
- Favorite topics: {patient.favorite_conversation_topics or 'Open to various topics'}
"""
            return profile.strip()
        finally:
            db.close()


class MemorySearchTool(BaseTool):
    name: str = "Search Patient Memories"
    description: str = (
        "Search through patient's recorded memories (people, places, events, preferences). "
        "Use this to find relevant personal information to make conversations more meaningful."
    )
    args_schema: Type[BaseModel] = MemorySearchInput
    
    def _run(self, patient_id: int, query: str, limit: int = 5) -> str:
        """Search patient memories"""
        db: Session = next(get_db())
        try:
            # Search in MemoryEntry
            memories = db.query(MemoryEntry).filter(
                MemoryEntry.patient_id == patient_id
            ).order_by(
                MemoryEntry.importance_score.desc()
            ).limit(limit).all()
            
            if not memories:
                return "No memories found in database"
            
            result = "RELEVANT MEMORIES:\n\n"
            for i, memory in enumerate(memories, 1):
                result += f"{i}. {memory.title} ({memory.entry_type})\n"
                result += f"   {memory.description}\n"
                if memory.emotional_context:
                    result += f"   Emotional note: {memory.emotional_context}\n"
                result += "\n"
            
            return result.strip()
        finally:
            db.close()


class MemorySeedRetrievalTool(BaseTool):
    name: str = "Get Memory Seeds"
    description: str = (
        "Retrieve simple memory seeds (MVP mode) - family members, photos, short descriptions. "
        "These are simplified memories perfect for daily ritual sessions."
    )
    args_schema: Type[BaseModel] = PatientContextInput
    
    def _run(self, patient_id: int) -> str:
        """Get memory seeds for patient"""
        db: Session = next(get_db())
        try:
            seeds = db.query(MemorySeed).filter(
                MemorySeed.patient_id == patient_id
            ).order_by(
                MemorySeed.last_used_at.asc().nullsfirst()
            ).limit(5).all()
            
            if not seeds:
                return "No memory seeds available"
            
            result = "MEMORY SEEDS:\n\n"
            for i, seed in enumerate(seeds, 1):
                result += f"{i}. {seed.name} ({seed.memory_category})\n"
                result += f"   {seed.short_description}\n"
                if seed.tone_note:
                    result += f"   Family note: {seed.tone_note}\n"
                result += "\n"
            
            return result.strip()
        finally:
            db.close()


# ============================================================================
# CONVERSATION CONTEXT TOOLS
# ============================================================================

class ConversationHistoryTool(BaseTool):
    name: str = "Get Recent Conversation History"
    description: str = (
        "Retrieve recent conversation messages to understand context and avoid repetition. "
        "Use this to maintain conversation continuity."
    )
    args_schema: Type[BaseModel] = ConversationHistoryInput
    
    def _run(self, patient_id: int, limit: int = 10) -> str:
        """Get recent conversation history"""
        db: Session = next(get_db())
        try:
            # Get most recent conversation
            conversation = db.query(Conversation).filter(
                Conversation.patient_id == patient_id
            ).order_by(
                Conversation.started_at.desc()
            ).first()
            
            if not conversation or not conversation.messages:
                return "No recent conversation history"
            
            messages = conversation.messages[-limit:] if len(conversation.messages) > limit else conversation.messages
            
            result = "RECENT CONVERSATION:\n\n"
            for msg in messages:
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                timestamp = msg.get('timestamp', 'unknown time')
                result += f"[{timestamp}] {role.upper()}: {content}\n"
            
            return result.strip()
        finally:
            db.close()


# ============================================================================
# SAFETY & MONITORING TOOLS
# ============================================================================

class SafetyAssessmentTool(BaseTool):
    name: str = "Assess Safety Concerns"
    description: str = (
        "Analyze patient message for safety concerns including crisis indicators, "
        "severe distress, self-harm mentions, or urgent medical needs. "
        "Returns risk level and recommended actions."
    )
    args_schema: Type[BaseModel] = SafetyCheckInput
    
    def _run(self, patient_message: str, context: str = "") -> str:
        """Assess safety concerns in patient message"""
        
        message_lower = patient_message.lower()
        
        # Crisis keywords
        crisis_keywords = [
            'kill', 'die', 'suicide', 'harm myself', 'hurt myself',
            'end it all', 'want to die', 'better off dead'
        ]
        
        # Severe distress keywords
        distress_keywords = [
            'help me', 'scared', 'terrified', 'can\'t breathe',
            'chest pain', 'can\'t move', 'falling', 'emergency'
        ]
        
        # Agitation keywords
        agitation_keywords = [
            'angry', 'frustrated', 'leave me alone', 'go away',
            'stop', 'hate this', 'get out'
        ]
        
        # Check for crisis
        if any(keyword in message_lower for keyword in crisis_keywords):
            return """
SAFETY ASSESSMENT: CRITICAL
Risk Level: HIGH - IMMEDIATE INTERVENTION REQUIRED

Indicators: Crisis language detected (self-harm/suicidal ideation)

REQUIRED ACTIONS:
1. Immediately notify emergency contacts
2. Engage crisis protocol
3. Do NOT continue normal conversation
4. Provide crisis hotline: 988 (Suicide & Crisis Lifeline)
5. Stay with patient, use calming presence
6. Say: "I hear that you're in pain. Your safety is important. Help is available."
"""
        
        # Check for severe distress
        if any(keyword in message_lower for keyword in distress_keywords):
            return """
SAFETY ASSESSMENT: ELEVATED
Risk Level: MODERATE - REQUIRES ATTENTION

Indicators: Severe distress or potential medical emergency

RECOMMENDED ACTIONS:
1. Alert caregiver immediately
2. Ask gentle clarifying questions
3. Provide reassurance: "You're safe. Help is here."
4. If medical symptoms (chest pain, breathing issues), call 911
5. Remain calm and present
"""
        
        # Check for agitation
        if any(keyword in message_lower for keyword in agitation_keywords):
            return """
SAFETY ASSESSMENT: MONITOR
Risk Level: LOW-MODERATE - De-escalation needed

Indicators: Agitation or frustration

RECOMMENDED ACTIONS:
1. Validate feelings: "I understand you're feeling frustrated"
2. Offer to end session: "Would you like to take a break?"
3. Switch to calming content (music, nature sounds)
4. Give space, reduce stimulation
5. Note in session log for caregiver review
"""
        
        # No concerns
        return """
SAFETY ASSESSMENT: CLEAR
Risk Level: NONE - Continue normal interaction

No safety concerns detected. Proceed with compassionate, validating conversation.
"""


# ============================================================================
# STORYLINE CONTENT TOOLS
# ============================================================================

class StorylineContentRetrievalTool(BaseTool):
    name: str = "Get Storyline Content"
    description: str = (
        "Retrieve family-uploaded content (photos, memories, audio) for storyline sessions. "
        "Returns content with family guidance notes and usage history."
    )
    args_schema: Type[BaseModel] = StorylineContentInput
    
    def _run(self, subscription_id: int, limit: int = 3) -> str:
        """Get storyline content for session"""
        db: Session = next(get_db())
        try:
            content_items = db.query(StorylineContent).filter(
                StorylineContent.subscription_id == subscription_id,
                StorylineContent.is_active == True,
                StorylineContent.approved == True
            ).order_by(
                StorylineContent.last_used_at.asc().nullsfirst(),
                StorylineContent.times_used.asc()
            ).limit(limit).all()
            
            if not content_items:
                return "No storyline content available. Family needs to upload photos/memories."
            
            result = "STORYLINE CONTENT FOR TODAY'S SESSION:\n\n"
            for i, item in enumerate(content_items, 1):
                result += f"{i}. {item.title} ({item.content_type})\n"
                result += f"   Description: {item.description}\n"
                
                if item.people_in_content:
                    result += f"   People: {', '.join(item.people_in_content)}\n"
                
                if item.tone_note:
                    result += f"   Family guidance: {item.tone_note}\n"
                
                if item.topics_to_explore:
                    result += f"   Suggested topics: {', '.join(item.topics_to_explore)}\n"
                
                if item.topics_to_avoid:
                    result += f"   ⚠️ Avoid: {', '.join(item.topics_to_avoid)}\n"
                
                result += f"   File: {item.file_url}\n"
                result += "\n"
            
            return result.strip()
        finally:
            db.close()


# ============================================================================
# MOOD & ENGAGEMENT TOOLS
# ============================================================================

class MoodTrackingTool(BaseTool):
    name: str = "Get Recent Mood Patterns"
    description: str = (
        "Retrieve recent mood tags and engagement scores to understand "
        "current emotional patterns and optimal interaction approaches."
    )
    args_schema: Type[BaseModel] = PatientContextInput
    
    def _run(self, patient_id: int) -> str:
        """Get recent mood patterns"""
        db: Session = next(get_db())
        try:
            # Get recent ritual sessions (MVP mode)
            recent_rituals = db.query(RitualSession).filter(
                RitualSession.patient_id == patient_id,
                RitualSession.completed == True
            ).order_by(
                RitualSession.started_at.desc()
            ).limit(7).all()
            
            if not recent_rituals:
                return "No recent mood data available"
            
            result = "RECENT MOOD PATTERNS (Last 7 sessions):\n\n"
            
            mood_counts = {}
            for session in recent_rituals:
                if session.mood_tag:
                    mood = session.mood_tag.value
                    mood_counts[mood] = mood_counts.get(mood, 0) + 1
                    
                    date = session.started_at.strftime("%Y-%m-%d")
                    result += f"- {date}: {mood} ({session.ritual_type.value})\n"
            
            result += "\n\nMOOD SUMMARY:\n"
            for mood, count in sorted(mood_counts.items(), key=lambda x: x[1], reverse=True):
                result += f"- {mood}: {count} times\n"
            
            # Recommendations based on mood
            if mood_counts.get('calm', 0) + mood_counts.get('engaged', 0) >= 5:
                result += "\n✓ Positive trend: Patient responding well to interactions"
            elif mood_counts.get('agitated', 0) >= 3:
                result += "\n⚠️ Caution: Multiple agitated sessions - use extra gentleness"
            elif mood_counts.get('confused', 0) >= 3:
                result += "\n⚠️ Note: Confusion present - keep interactions very simple"
            
            return result.strip()
        finally:
            db.close()


# ============================================================================
# TIME & SCHEDULING TOOLS
# ============================================================================

class TimeContextTool(BaseTool):
    name: str = "Get Current Time Context"
    description: str = (
        "Get current time, day of week, and contextual information for orientation. "
        "Useful for morning greetings, time-appropriate activities, etc."
    )
    
    class Input(BaseModel):
        pass  # No input needed
    
    args_schema: Type[BaseModel] = Input
    
    def _run(self) -> str:
        """Get current time context"""
        now = datetime.now()
        
        day_name = now.strftime("%A")
        date = now.strftime("%B %d, %Y")
        time_str = now.strftime("%I:%M %p")
        
        hour = now.hour
        if 5 <= hour < 12:
            time_of_day = "morning"
            greeting = "Good morning"
        elif 12 <= hour < 17:
            time_of_day = "afternoon"
            greeting = "Good afternoon"
        elif 17 <= hour < 21:
            time_of_day = "evening"
            greeting = "Good evening"
        else:
            time_of_day = "night"
            greeting = "Good evening"
        
        return f"""
CURRENT TIME CONTEXT:

Day: {day_name}
Date: {date}
Time: {time_str}
Time of Day: {time_of_day}
Suggested Greeting: {greeting}

CONTEXTUAL NOTES:
- Energy levels typically {'higher' if hour < 15 else 'lower'} at this time
- Good time for {'active engagement' if hour < 15 else 'calming activities'}
- {'Sundowning may occur' if hour >= 16 else 'Generally alert period'}
"""


# ============================================================================
# EXPORT ALL TOOLS
# ============================================================================

ALL_TOOLS = [
    PatientProfileTool(),
    MemorySearchTool(),
    MemorySeedRetrievalTool(),
    ConversationHistoryTool(),
    SafetyAssessmentTool(),
    StorylineContentRetrievalTool(),
    MoodTrackingTool(),
    TimeContextTool(),
]

# Tool sets for different agent types
PATIENT_INTERACTION_TOOLS = [
    PatientProfileTool(),
    MemorySearchTool(),
    ConversationHistoryTool(),
    SafetyAssessmentTool(),
    MoodTrackingTool(),
    TimeContextTool(),
]

STORYLINE_TOOLS = [
    PatientProfileTool(),
    StorylineContentRetrievalTool(),
    MoodTrackingTool(),
    SafetyAssessmentTool(),
]

RITUAL_TOOLS = [
    PatientProfileTool(),
    MemorySeedRetrievalTool(),
    MoodTrackingTool(),
    TimeContextTool(),
]

CAREGIVER_TOOLS = [
    PatientProfileTool(),
    MoodTrackingTool(),
    ConversationHistoryTool(),
]
