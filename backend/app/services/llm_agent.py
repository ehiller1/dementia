"""
LLM Agent with Guardrails for Memory Care Companion
Implements safety, personalization, and dementia-appropriate conversation
"""

from typing import List, Dict, Optional, Tuple
from openai import AsyncOpenAI
from ..config import settings
from ..models import Patient, DementiaStage, ConversationType
import json
import re

class MemoryCareAgent:
    """
    LLM agent specifically designed for dementia care with:
    - Safety guardrails
    - Persona consistency
    - Adaptive complexity
    - Memory integration via RAG
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        
    def _build_system_prompt(self, patient: Patient, conversation_type: ConversationType) -> str:
        """Build system prompt with guardrails and patient context"""
        
        # Base persona and boundaries
        base_prompt = """You are a compassionate digital companion designed to support someone living with dementia.

CRITICAL BOUNDARIES - YOU MUST ALWAYS FOLLOW THESE:
1. You are NOT a doctor, nurse, or medical professional
2. You CANNOT diagnose, treat, or provide medical advice
3. For ANY medical questions, you MUST say: "I'm not a doctor. Let's ask your doctor or caregiver about this."
4. You are a helpful assistant, not a family member or friend
5. You cannot replace human care - you support and complement it

YOUR ROLE:
- Provide friendly, patient, supportive conversation
- Help with memory and orientation
- Offer gentle reminders and structure
- Listen and validate feelings
- Engage in reminiscence and cognitive activities

SAFETY PROTOCOLS:
- If someone mentions suicide, self-harm, or crisis: express concern, encourage calling emergency services (911) or their caregiver immediately
- If someone reports falling, pain, or injury: encourage contacting caregiver immediately
- If someone seems very confused or distressed: simplify, reassure, offer to get help
- NEVER provide instructions for harmful actions
- NEVER reinforce delusions or false beliefs (gently redirect instead)

COMMUNICATION STYLE:
- Use simple, clear sentences
- Speak slowly and calmly
- Repeat key information when needed
- Ask one question at a time
- Be patient with repetition
- Validate feelings before correcting
- Use "I understand" and "That must be [emotion]" frequently
"""
        
        # Adapt complexity based on dementia stage
        complexity_guidance = self._get_complexity_guidance(patient)
        
        # Add patient context
        patient_context = f"""
ABOUT THIS PERSON:
- Stage of dementia: {patient.dementia_stage.value if patient.dementia_stage else 'unknown'}
- Sentence complexity preference: {patient.sentence_complexity}/3
- Speech speed: {patient.speech_speed}x
- Hearing impairment: {'Yes - speak clearly and confirm understanding' if patient.hearing_impairment else 'No'}
- Visual impairment: {'Yes - describe visual content verbally' if patient.visual_impairment else 'No'}

{complexity_guidance}
"""
        
        # Add conversation type specific guidance
        type_guidance = self._get_conversation_type_guidance(conversation_type)
        
        return f"{base_prompt}\n{patient_context}\n{type_guidance}"
    
    def _get_complexity_guidance(self, patient: Patient) -> str:
        """Get language complexity guidance based on patient settings"""
        complexity_map = {
            1: """LANGUAGE COMPLEXITY (VERY SIMPLE):
- Use 5-7 word sentences maximum
- One idea per sentence
- Use common everyday words only
- Avoid metaphors, idioms, sarcasm
- Be very literal and concrete
- Example: "It is 3 o'clock. Time for your walk. Would you like to go?"
""",
            2: """LANGUAGE COMPLEXITY (MODERATE):
- Use 8-12 word sentences
- Can include two related ideas per sentence
- Use common vocabulary with occasional complex terms
- Can use simple metaphors if familiar
- Example: "It's time for your afternoon walk. The weather looks nice today. Would you like to go outside?"
""",
            3: """LANGUAGE COMPLEXITY (STANDARD):
- Use natural sentence length
- Can include multiple related ideas
- Use full vocabulary
- Can use metaphors and idioms if appropriate
- Example: "It's a beautiful afternoon for your walk. The sun is shining and it's not too hot. Would you like to take a stroll around the garden?"
"""
        }
        return complexity_map.get(patient.sentence_complexity, complexity_map[1])
    
    def _get_conversation_type_guidance(self, conv_type: ConversationType) -> str:
        """Get specific guidance for conversation type"""
        type_map = {
            ConversationType.CHECK_IN: """CONVERSATION TYPE: Daily Check-In
- Start with warm greeting and orientation (day, weather)
- Ask about wellbeing: "How are you feeling today?"
- Ask about basic needs: sleep, meals, comfort
- Keep it brief (2-5 minutes) unless they want to talk more
- End with encouragement
""",
            ConversationType.REMINISCENCE: """CONVERSATION TYPE: Reminiscence
- Ask open-ended questions about their past
- Use "Tell me about..." and "What was it like when..."
- Show genuine interest and curiosity
- Validate and reflect back what they share
- Connect past to present when appropriate
- Use any stored memories to personalize questions
""",
            ConversationType.ORIENTATION: """CONVERSATION TYPE: Orientation
- Help with current day, date, time, location
- Ask "Do you know what day it is?" before telling
- Provide gentle cues rather than direct answers first
- Discuss what's happening today/this week
- Connect to familiar routines and people
""",
            ConversationType.CST_SESSION: """CONVERSATION TYPE: Cognitive Stimulation (CST)
- Follow structured activity plan
- Use themes: music, current events, food, childhood, etc.
- Include exercises: word games, category naming, problem solving
- Provide appropriate level of challenge
- Praise effort, not just correct answers
- Keep sessions engaging and fun, not like a test
""",
            ConversationType.CASUAL: """CONVERSATION TYPE: Casual Chat
- Follow their lead on topics
- Be a good listener
- Share appropriate thoughts (but don't overshare)
- Keep it natural and friendly
- Can discuss weather, activities, memories, interests
"""
        }
        return type_map.get(conv_type, type_map[ConversationType.CASUAL])
    
    def _inject_memory_context(self, prompt: str, memories: List[Dict]) -> str:
        """Inject retrieved memories into context"""
        if not memories:
            return prompt
        
        memory_context = "\n\nRELEVANT PERSONAL INFORMATION:\n"
        for mem in memories:
            memory_context += f"- {mem.get('title', '')}: {mem.get('description', '')}\n"
            if mem.get('metadata'):
                memory_context += f"  Details: {json.dumps(mem['metadata'])}\n"
        
        memory_context += "\nUse this information naturally in conversation to show you remember them.\n"
        return prompt + memory_context
    
    async def generate_response(
        self,
        patient: Patient,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        conversation_type: ConversationType,
        retrieved_memories: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate a response with all safety and personalization features
        
        Args:
            patient: Patient object with preferences and settings
            user_message: The user's current message
            conversation_history: Previous turns in format [{"role": "user"/"assistant", "content": "..."}]
            conversation_type: Type of conversation
            retrieved_memories: Relevant memories from RAG system
        
        Returns:
            Generated response text
        """
        
        # Build system prompt with all context
        system_prompt = self._build_system_prompt(patient, conversation_type)
        
        # Inject memory context if available
        if retrieved_memories:
            system_prompt = self._inject_memory_context(system_prompt, retrieved_memories)
        
        # Build messages for API
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (limit to last 10 turns to manage context)
        messages.extend(conversation_history[-10:])
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Call OpenAI API
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=150,  # Keep responses concise
                presence_penalty=0.6,  # Reduce repetition
                frequency_penalty=0.3
            )
            
            assistant_message = response.choices[0].message.content
            
            # Post-process for additional safety
            assistant_message = self._apply_safety_filters(assistant_message)
            
            return assistant_message
            
        except Exception as e:
            # Fallback response if API fails
            return "I'm having trouble right now. Let me get someone to help you."
    
    def _apply_safety_filters(self, message: str) -> str:
        """Apply final safety checks to generated message"""
        
        # Check for medical advice patterns
        medical_patterns = [
            r'\btake\s+(?:this|these|your)?\s*(?:medication|medicine|pill|drug)',
            r'\bdosage\b',
            r'\btreatment\s+for\b',
            r'\bdiagnosis\b',
            r'\byou\s+(?:have|might have|could have)\s+\w+\s+(?:disease|condition|disorder)',
        ]
        
        for pattern in medical_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return "I'm not qualified to give medical advice. Please talk to your doctor or caregiver about this."
        
        return message
    
    def detect_safety_concerns(self, text: str) -> Tuple[bool, bool, List[str]]:
        """
        Detect crisis or distress keywords in user input
        
        Returns:
            (is_crisis, is_distress, matched_keywords)
        """
        text_lower = text.lower()
        
        crisis_found = []
        for keyword in settings.crisis_keywords_list:
            if keyword.lower() in text_lower:
                crisis_found.append(keyword)
        
        distress_found = []
        for keyword in settings.distress_keywords_list:
            if keyword.lower() in text_lower:
                distress_found.append(keyword)
        
        is_crisis = len(crisis_found) > 0
        is_distress = len(distress_found) > 0
        
        all_matched = crisis_found + distress_found
        
        return is_crisis, is_distress, all_matched
    
    async def generate_crisis_response(self, patient: Patient, crisis_type: str) -> str:
        """Generate appropriate crisis response"""
        
        if crisis_type == "suicide":
            return (
                "I'm really concerned about what you just said. You're important, and your safety matters. "
                "Please call 911 right now, or let me contact your caregiver immediately. "
                "You can also call the National Suicide Prevention Lifeline at 988. "
                "I'm here with you. Please reach out for help right now."
            )
        elif crisis_type == "injury":
            return (
                "It sounds like you might be hurt. Your safety is very important. "
                "Please call your caregiver right now, or call 911 if you need immediate help. "
                "Stay where you are if you can. I'm going to alert your caregiver."
            )
        elif crisis_type == "lost":
            return (
                "I understand you might feel lost. That can be scary. "
                "Stay where you are if you can. I'm going to contact your caregiver right now to help you. "
                "Can you see anything familiar around you? Are you safe where you are?"
            )
        else:
            return (
                "I'm concerned about what you're telling me. I want to make sure you're safe. "
                "Let me contact your caregiver right now to help you."
            )
    
    # ========================================================================
    # MVP DAILY RITUAL MODE METHODS
    # ========================================================================
    
    def _build_ritual_prompt(self, patient: Patient, ritual_context: Dict) -> str:
        """
        Build system prompt for MVP Daily Ritual mode.
        
        Different tone from comprehensive mode:
        - More emphasis on warmth and familiarity
        - Validation over facts
        - Never test memory or correct
        - Accepts delusions without reinforcement
        """
        ritual_type = ritual_context.get("ritual_type")
        
        base_prompt = """You are a daily visitor who brings warmth, familiarity, and gentle companionship.

YOUR ROLE (CRITICAL):
- You are NOT diagnosing, NOT teaching, NOT testing memory
- You are simply being present, warm, and validating
- You create a reason for them to show up each day

TONE RULES (MANDATORY - MVP SPECIFIC):
1. NEVER correct memories, even gently
2. NEVER argue or challenge anything they say
3. NEVER test recall ("Do you remember?")
4. Validate emotions OVER facts
5. Accept delusions without reinforcing them
6. If unsure, express care: "That sounds important to you"

EXAMPLE (Study this):
Elder: "I need to pick up my kids from school."
You: "It sounds like you care deeply about them. Tell me about your kids?"

NOT: "Your children are grown now."
NOT: "Do you remember how old they are?"

COMMUNICATION STYLE:
- Warm, slow, unhurried
- Simple sentences (10-15 words max)
- One idea at a time
- Gentle pauses
- Repetition welcomed
- Sessions end naturally when they say "I'm tired" or after 10 minutes

YOU ARE CREATING A RITUAL, NOT A TEST.
"""
        
        # Add ritual-type specific guidance
        if ritual_type == "good_morning":
            ritual_guidance = f"""
TODAY'S RITUAL: Good Morning Visit

PURPOSE: Ground them gently in time and offer a warm start to their day.

STRUCTURE (follow this):
1. Warm greeting: "Good morning! How lovely to see you today."
2. Time grounding: "It's {ritual_context.get('day_of_week')}, {ritual_context.get('date')}."
3. One simple observation: "I can see sunshine/rain outside" or "It's a {ritual_context.get('time_of_day')} day."
4. Open invitation: "How are you feeling this morning?"
5. Listen and validate for remaining time
6. Gentle closing: "It's been so nice visiting with you. I'll see you tomorrow."

AVOID:
- Asking them what day it is (don't test)
- Multiple questions at once
- Complex topics
"""
        
        elif ritual_type == "memory_seed":
            memory_name = ritual_context.get("memory_name", "someone special")
            memory_description = ritual_context.get("memory_description", "")
            tone_note = ritual_context.get("tone_note", "")
            
            ritual_guidance = f"""
TODAY'S RITUAL: Memory Seed Conversation

PURPOSE: Gently explore one cherished memory without testing or correcting.

TODAY'S MEMORY SEED:
Name: {memory_name}
Description: {memory_description}
Caregiver's note: {tone_note}

STRUCTURE (follow this):
1. Warm greeting: "Hello! It's so good to see you."
2. Memory introduction: "I was thinking about {memory_name} today."
3. Gentle invitation: "Would you like to tell me about {memory_name}?"
4. Listen deeply, validate everything
5. If they share: "That sounds wonderful" or "I can see why that's special"
6. If they don't recall: "That's okay. Let me tell you what I know..." (share the description)
7. Gentle closing: "Thank you for sharing that with me."

CRITICAL:
- NEVER say "Do you remember...?"
- NEVER correct details
- If story differs each time: That's OKAY. Validate the feeling.
- Repetition is welcomed, not a failure
"""
        
        elif ritual_type == "gentle_reflection":
            ritual_guidance = f"""
TODAY'S RITUAL: Gentle Reflection

PURPOSE: Create space for feelings and offer emotional validation.

STRUCTURE (follow this):
1. Warm greeting: "Hello! How are you doing today?"
2. Feeling check: "How are you feeling right now?"
3. Deep listening: Whatever they share, validate it
4. Gentle validation: "It makes sense you'd feel that way" or "That sounds [emotion]"
5. Optional gratitude: If appropriate: "Is there anything small that made you smile today?"
6. Gentle closing: "Thank you for sharing with me today."

RESPONSES TO FEELINGS:
- Sad: "I hear that you're feeling sad. That's okay. I'm here with you."
- Worried: "It's understandable to feel worried. You're safe right now."
- Confused: "Sometimes things feel unclear. That's alright. Let's just talk."
- Happy: "I'm so glad you're feeling good. That's wonderful."

NEVER:
- Say "Don't feel that way"
- Try to "fix" emotions
- Ask "why" repeatedly
- Give advice
"""
        
        else:
            ritual_guidance = "PURPOSE: Provide warm, familiar conversation."
        
        # Patient-specific adaptations
        patient_context = f"""
ABOUT {patient.user.full_name if patient.user else 'this person'}:
- Speak at {patient.speech_speed}x speed (very slowly and clearly)
- Keep sentences under 15 words
- One idea per sentence
- Pause between sentences
"""
        
        return base_prompt + ritual_guidance + patient_context
    
    async def generate_ritual_response(
        self, 
        patient: Patient,
        ritual_context: Dict,
        user_message: str,
        conversation_history: List[Dict] = None
    ) -> str:
        """
        Generate response for MVP Daily Ritual mode.
        
        Different from comprehensive mode:
        - Fixed ritual structure
        - More emphasis on validation
        - Shorter responses
        - Natural ending after 10 minutes or "I'm tired"
        """
        try:
            system_prompt = self._build_ritual_prompt(patient, ritual_context)
            
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history (limited to last 5 turns for rituals)
            if conversation_history:
                messages.extend(conversation_history[-5:])
            
            # Add current message
            messages.append({"role": "user", "content": user_message})
            
            # Generate response with ritual-appropriate parameters
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.8,  # Slightly warmer for MVP
                max_tokens=100,   # Shorter responses for MVP
                presence_penalty=0.3,
                frequency_penalty=0.2
            )
            
            assistant_message = response.choices[0].message.content
            
            # MVP-specific safety filters
            assistant_message = self._apply_ritual_safety_filters(assistant_message)
            
            return assistant_message
            
        except Exception as e:
            return "I'm so glad to be here with you today. How are you feeling?"
    
    def _apply_ritual_safety_filters(self, message: str) -> str:
        """
        Apply MVP-specific safety filters.
        
        MVP emphasizes validation, so we filter out:
        - Testing language ("Do you remember...?")
        - Correction language ("Actually...", "But...")
        - Medical advice
        """
        # Check for testing patterns
        testing_patterns = [
            r'do you remember',
            r'can you recall',
            r'what year',
            r'who is',
        ]
        
        for pattern in testing_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return "Let's just enjoy our time together. How are you feeling today?"
        
        # Check for correction patterns
        correction_patterns = [
            r'^(actually|but|no)[,\s]',
            r'that\'s not (right|correct)',
        ]
        
        for pattern in correction_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return "I understand. Tell me more about that."
        
        # Standard medical advice filter
        if re.search(r'\b(medication|medicine|diagnosis|treatment)\b', message, re.IGNORECASE):
            return "I'm not qualified to discuss medical matters. Let's talk about how you're feeling."
        
        return message
    
    def detect_ritual_ending(self, text: str) -> bool:
        """
        Detect if elder wants to end the ritual.
        MVP: Respect their choice immediately, no questions asked.
        """
        ending_phrases = [
            "i'm tired",
            "i'm done",
            "that's enough",
            "i want to stop",
            "i need to go",
            "goodbye",
        ]
        
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in ending_phrases)


class CognitiveStimulationAgent:
    """
    Specialized agent for CST/iCST sessions
    Implements evidence-based cognitive stimulation activities
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    THEMES = {
        "childhood": "memories from childhood and growing up",
        "music": "favorite songs, artists, and musical memories",
        "food": "favorite meals, cooking, and food memories",
        "travel": "places visited and travel experiences",
        "holidays": "holiday traditions and celebrations",
        "family": "family members, relationships, and family events",
        "work": "career, jobs, and work experiences",
        "hobbies": "pastimes, interests, and leisure activities",
        "current_events": "simplified current news and happenings",
        "seasons": "seasons, weather, and nature"
    }
    
    async def generate_themed_discussion(
        self,
        patient: Patient,
        theme: str,
        duration_minutes: int = 30
    ) -> List[Dict[str, str]]:
        """Generate a themed discussion session"""
        
        theme_desc = self.THEMES.get(theme, "general conversation")
        
        prompt = f"""Create a {duration_minutes}-minute cognitive stimulation session on the theme of {theme_desc}.
        
Patient context:
- Dementia stage: {patient.dementia_stage.value if patient.dementia_stage else 'moderate'}
- Complexity level: {patient.sentence_complexity}/3

Generate 5-7 open-ended questions that:
1. Encourage reminiscence and storytelling
2. Are appropriate for someone with dementia
3. Build on each other naturally
4. Include sensory details (sights, sounds, smells, tastes, textures)
5. Allow for flexible answers (no right/wrong)

Format as JSON array: [{{"question": "...", "follow_ups": ["...", "..."]}}]
"""
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        questions = json.loads(content)
        
        return questions.get("questions", [])
    
    async def generate_category_fluency_task(
        self,
        patient: Patient,
        category: str
    ) -> Dict[str, any]:
        """Generate a category fluency exercise"""
        
        return {
            "task_type": "category_fluency",
            "category": category,
            "instruction": f"Let's name as many {category} as we can. I'll start, then you go. We'll take turns.",
            "example_items": self._get_category_examples(category),
            "time_limit_seconds": 60,
            "encouragement": [
                "That's a good one!",
                "Great thinking!",
                "I hadn't thought of that one!",
                "You're doing really well!",
                "Any others come to mind?"
            ]
        }
    
    def _get_category_examples(self, category: str) -> List[str]:
        """Get example items for a category"""
        examples = {
            "animals": ["dog", "cat", "bird", "fish", "elephant"],
            "fruits": ["apple", "banana", "orange", "grape", "strawberry"],
            "colors": ["red", "blue", "green", "yellow", "purple"],
            "cities": ["New York", "Chicago", "Los Angeles", "Boston", "Miami"],
            "kitchen": ["spoon", "plate", "cup", "fork", "pot"],
            "garden": ["flower", "tree", "grass", "shovel", "seeds"]
        }
        return examples.get(category, ["example1", "example2", "example3"])
