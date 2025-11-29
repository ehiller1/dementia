"""
CrewAI Crew Configurations
Organizes agents into hierarchical teams with managers
"""

from crewai import Agent, Task, Crew, Process
from typing import List, Dict, Optional
from .base_agents import (
    MemoryCareAgents,
    StorylineAgents,
    RitualAgents,
    CaregiverAgents,
    ManagerAgents,
    LLMConfig
)


# ============================================================================
# PRIMARY PATIENT INTERACTION CREW
# ============================================================================

class PatientInteractionCrew:
    """
    Main crew for patient conversations and interactions
    Hierarchical process with Care Coordinator as manager
    """
    
    @staticmethod
    def create_crew() -> Crew:
        """
        Creates the patient interaction crew with hierarchical management
        
        Team Structure:
        - Manager: Care Coordinator
        - Agents: Companion, Safety Monitor, Orientation, Mood Analyst
        """
        
        # Create agents
        coordinator = ManagerAgents.care_coordinator()
        companion = MemoryCareAgents.companion_agent()
        safety_monitor = MemoryCareAgents.safety_monitor_agent()
        orientation = MemoryCareAgents.orientation_agent()
        mood_analyst = MemoryCareAgents.mood_analyst_agent()
        
        # Create crew with hierarchical process
        crew = Crew(
            agents=[coordinator, companion, safety_monitor, orientation, mood_analyst],
            manager_agent=coordinator,
            process=Process.hierarchical,
            verbose=True,
            memory=True,  # Enable conversation memory
            embedder={
                "provider": "openai",
                "config": {
                    "model": "text-embedding-3-small"
                }
            }
        )
        
        return crew
    
    @staticmethod
    def create_conversation_task(
        patient_message: str,
        patient_context: Dict,
        conversation_history: List[Dict]
    ) -> Task:
        """
        Create a task for handling patient conversation
        
        Args:
            patient_message: Current message from patient
            patient_context: Patient profile (name, stage, preferences, etc.)
            conversation_history: Recent conversation turns
        """
        
        context_str = f"""
Patient Profile:
- Name: {patient_context.get('name', 'Unknown')}
- Dementia Stage: {patient_context.get('stage', 'Unknown')}
- Preferences: {patient_context.get('preferences', 'None specified')}
- Known Triggers: {patient_context.get('triggers', 'None specified')}

Recent Conversation:
{conversation_history[-3:] if conversation_history else 'No previous conversation'}

Current Message from Patient:
"{patient_message}"
"""
        
        task = Task(
            description=f"""Respond to the patient's message with appropriate care and support.
            
{context_str}

Instructions:
1. Assess the patient's emotional state and needs
2. Check for any safety concerns
3. Provide a warm, validating response
4. Use simple language and avoid testing memory
5. If orientation is needed, provide it gently
6. Track mood and engagement level

Response should be 1-3 sentences, warm and conversational.""",
            expected_output="A compassionate response to the patient that validates their feelings "
                          "and addresses their needs, along with mood assessment and safety check",
            agent=ManagerAgents.care_coordinator()  # Manager will delegate as needed
        )
        
        return task


# ============================================================================
# STORYLINE EXECUTION CREW
# ============================================================================

class StorylineCrew:
    """
    Crew for running storyline modules
    Hierarchical with Storyline Director as manager
    """
    
    @staticmethod
    def create_crew(storyline_type: str) -> Crew:
        """
        Creates a storyline crew based on type
        
        Args:
            storyline_type: Type of storyline (family_story, music_dj, nature_walk, etc.)
        """
        
        director = ManagerAgents.storyline_director()
        
        # Select appropriate storyline agent
        storyline_agents_map = {
            "family_story_channel": StorylineAgents.family_story_narrator(),
            "music_dj": StorylineAgents.music_dj_agent(),
            "nature_walk": StorylineAgents.nature_guide_agent(),
            "grandchild_messenger": StorylineAgents.grandchild_messenger_agent(),
            "hobby_club": StorylineAgents.hobby_club_host_agent(),
            "veteran_stories": StorylineAgents.veteran_companion_agent(),
        }
        
        storyline_agent = storyline_agents_map.get(
            storyline_type,
            StorylineAgents.family_story_narrator()  # Default
        )
        
        # Always include mood analyst and safety monitor
        mood_analyst = MemoryCareAgents.mood_analyst_agent()
        safety_monitor = MemoryCareAgents.safety_monitor_agent()
        
        crew = Crew(
            agents=[director, storyline_agent, mood_analyst, safety_monitor],
            manager_agent=director,
            process=Process.hierarchical,
            verbose=True,
            memory=True
        )
        
        return crew
    
    @staticmethod
    def create_storyline_session_task(
        storyline_type: str,
        content_items: List[Dict],
        patient_context: Dict
    ) -> Task:
        """
        Create task for running a storyline session
        
        Args:
            storyline_type: Type of storyline
            content_items: Photos, music, memories to use
            patient_context: Patient information
        """
        
        task = Task(
            description=f"""Run a {storyline_type} session for the patient.
            
Patient: {patient_context.get('name')}
Session Content: {len(content_items)} items prepared

Instructions:
1. Present the storyline content in an engaging way
2. Use warm, simple language
3. Invite participation without requiring it
4. Monitor emotional responses
5. Adjust based on engagement level
6. End session gracefully after 8-12 minutes or if patient shows fatigue

Create a narrative experience that brings joy and connection.""",
            expected_output="A complete storyline session narrative with engagement tracking "
                          "and emotional response assessment",
            agent=ManagerAgents.storyline_director()
        )
        
        return task


# ============================================================================
# RITUAL CREW (MVP Daily Rituals)
# ============================================================================

class RitualCrew:
    """
    Crew for MVP daily ritual sessions
    Hierarchical with Ritual Orchestrator as manager
    """
    
    @staticmethod
    def create_crew(ritual_type: str) -> Crew:
        """
        Creates ritual crew based on type
        
        Args:
            ritual_type: good_morning, memory_seed, or gentle_reflection
        """
        
        orchestrator = ManagerAgents.ritual_orchestrator()
        
        # Select appropriate ritual agent
        ritual_agents_map = {
            "good_morning": RitualAgents.morning_ritual_agent(),
            "memory_seed": RitualAgents.memory_seed_agent(),
            "gentle_reflection": RitualAgents.reflection_ritual_agent(),
        }
        
        ritual_agent = ritual_agents_map.get(
            ritual_type,
            RitualAgents.morning_ritual_agent()  # Default
        )
        
        # Include support agents
        mood_analyst = MemoryCareAgents.mood_analyst_agent()
        safety_monitor = MemoryCareAgents.safety_monitor_agent()
        
        crew = Crew(
            agents=[orchestrator, ritual_agent, mood_analyst, safety_monitor],
            manager_agent=orchestrator,
            process=Process.hierarchical,
            verbose=True,
            memory=True
        )
        
        return crew
    
    @staticmethod
    def create_ritual_task(
        ritual_type: str,
        patient_context: Dict,
        memory_seed: Optional[Dict] = None
    ) -> Task:
        """
        Create task for daily ritual
        
        Args:
            ritual_type: Type of ritual
            patient_context: Patient information
            memory_seed: Optional memory for memory_seed ritual
        """
        
        memory_str = ""
        if memory_seed and ritual_type == "memory_seed":
            memory_str = f"""
Memory Seed for Today:
- Name: {memory_seed.get('name')}
- Description: {memory_seed.get('description')}
- Tone Note: {memory_seed.get('tone_note', 'None')}
"""
        
        task = Task(
            description=f"""Conduct a {ritual_type} ritual session.
            
Patient: {patient_context.get('name')}
Time of Day: {patient_context.get('current_time', 'Unknown')}
{memory_str}

Instructions:
1. Follow the established ritual format
2. Keep session to 5-7 minutes
3. Use predictable structure for comfort
4. Monitor mood and adjust if needed
5. End with positive, grounding statement
6. Note any unusual responses or concerns

Create a comforting, predictable experience.""",
            expected_output="A complete ritual session with mood assessment and completion notes",
            agent=ManagerAgents.ritual_orchestrator()
        )
        
        return task


# ============================================================================
# CAREGIVER SUPPORT CREW
# ============================================================================

class CaregiverSupportCrew:
    """
    Crew for generating insights and recommendations for caregivers
    Sequential process for analysis and reporting
    """
    
    @staticmethod
    def create_insights_crew() -> Crew:
        """
        Creates crew for generating caregiver insights
        
        Team: Mood Analyst → Recommendation Agent → Insight Reporter
        """
        
        mood_analyst = MemoryCareAgents.mood_analyst_agent()
        recommender = CaregiverAgents.recommendation_agent()
        reporter = CaregiverAgents.insight_reporter_agent()
        
        crew = Crew(
            agents=[mood_analyst, recommender, reporter],
            process=Process.sequential,  # Each builds on previous
            verbose=True
        )
        
        return crew
    
    @staticmethod
    def create_insights_task(
        patient_id: int,
        time_period: str,
        session_data: List[Dict]
    ) -> List[Task]:
        """
        Create task chain for insight generation
        
        Args:
            patient_id: Patient identifier
            time_period: "last_week", "last_month", etc.
            session_data: Interaction data to analyze
        """
        
        # Task 1: Analyze mood patterns
        mood_task = Task(
            description=f"""Analyze mood and engagement patterns from {time_period} data.
            
Sessions analyzed: {len(session_data)}

Look for:
- Overall mood trends
- Engagement level patterns
- Time-of-day effects
- Activity-specific responses
- Notable changes or concerns

Provide objective behavioral analysis.""",
            expected_output="Comprehensive mood and engagement analysis with key patterns identified",
            agent=MemoryCareAgents.mood_analyst_agent()
        )
        
        # Task 2: Generate recommendations (uses mood_task output)
        recommendation_task = Task(
            description=f"""Based on the mood analysis, recommend activities and storylines.
            
Consider:
- What's currently working well
- What might improve engagement
- Optimal timing for activities
- Storylines that match interests
- Adjustments to current approach

Provide actionable, specific recommendations.""",
            expected_output="3-5 specific, actionable recommendations for improving care",
            agent=CaregiverAgents.recommendation_agent(),
            context=[mood_task]  # Depends on mood analysis
        )
        
        # Task 3: Create caregiver report (uses both previous outputs)
        report_task = Task(
            description=f"""Create a clear, compassionate report for caregivers.
            
Include:
- Summary of {time_period} highlights
- Mood and engagement insights
- Specific recommendations
- Encouraging notes about what's working
- Any concerns to discuss with care team

Make it actionable and supportive.""",
            expected_output="Complete caregiver insights report in clear, supportive language",
            agent=CaregiverAgents.insight_reporter_agent(),
            context=[mood_task, recommendation_task]  # Depends on both
        )
        
        return [mood_task, recommendation_task, report_task]
    
    @staticmethod
    def create_content_review_crew() -> Crew:
        """
        Creates crew for reviewing family-uploaded content
        """
        
        moderator = CaregiverAgents.content_moderator_agent()
        
        crew = Crew(
            agents=[moderator],
            process=Process.sequential,
            verbose=True
        )
        
        return crew
    
    @staticmethod
    def create_content_review_task(content_item: Dict) -> Task:
        """
        Create task for reviewing uploaded content
        """
        
        task = Task(
            description=f"""Review this family-uploaded content for appropriateness.
            
Content Type: {content_item.get('content_type')}
Title: {content_item.get('title')}
Description: {content_item.get('description')}
Family Notes: {content_item.get('tone_note', 'None')}

Check for:
- Image quality and clarity
- Emotional appropriateness
- Potential confusion factors
- Privacy concerns
- Overall suitability

Provide approval or helpful suggestions for improvement.""",
            expected_output="Content approval decision with specific feedback if changes needed",
            agent=CaregiverAgents.content_moderator_agent()
        )
        
        return task


# ============================================================================
# CREW FACTORY
# ============================================================================

class CrewFactory:
    """Central factory for creating appropriate crews"""
    
    @staticmethod
    def get_patient_interaction_crew() -> Crew:
        """Get crew for patient conversations"""
        return PatientInteractionCrew.create_crew()
    
    @staticmethod
    def get_storyline_crew(storyline_type: str) -> Crew:
        """Get crew for storyline execution"""
        return StorylineCrew.create_crew(storyline_type)
    
    @staticmethod
    def get_ritual_crew(ritual_type: str) -> Crew:
        """Get crew for daily rituals"""
        return RitualCrew.create_crew(ritual_type)
    
    @staticmethod
    def get_insights_crew() -> Crew:
        """Get crew for caregiver insights"""
        return CaregiverSupportCrew.create_insights_crew()
    
    @staticmethod
    def get_content_review_crew() -> Crew:
        """Get crew for content moderation"""
        return CaregiverSupportCrew.create_content_review_crew()


# ============================================================================
# TASK FACTORY
# ============================================================================

class TaskFactory:
    """Central factory for creating tasks"""
    
    @staticmethod
    def create_conversation_task(
        patient_message: str,
        patient_context: Dict,
        history: List[Dict]
    ) -> Task:
        """Create conversation task"""
        return PatientInteractionCrew.create_conversation_task(
            patient_message, patient_context, history
        )
    
    @staticmethod
    def create_storyline_task(
        storyline_type: str,
        content: List[Dict],
        patient_context: Dict
    ) -> Task:
        """Create storyline task"""
        return StorylineCrew.create_storyline_session_task(
            storyline_type, content, patient_context
        )
    
    @staticmethod
    def create_ritual_task(
        ritual_type: str,
        patient_context: Dict,
        memory_seed: Optional[Dict] = None
    ) -> Task:
        """Create ritual task"""
        return RitualCrew.create_ritual_task(
            ritual_type, patient_context, memory_seed
        )
    
    @staticmethod
    def create_insights_tasks(
        patient_id: int,
        time_period: str,
        session_data: List[Dict]
    ) -> List[Task]:
        """Create insights task chain"""
        return CaregiverSupportCrew.create_insights_task(
            patient_id, time_period, session_data
        )
    
    @staticmethod
    def create_content_review_task(content_item: Dict) -> Task:
        """Create content review task"""
        return CaregiverSupportCrew.create_content_review_task(content_item)
