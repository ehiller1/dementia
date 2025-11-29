"""
Caregiver Training API Routes
Endpoints for analyzing conversations and providing feedback
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from ..database import get_db
from ..services.caregiver_training import CaregiverTrainingService
from ..services.voice_service import VoiceService
from ..models import Patient, User

router = APIRouter(prefix="/api/training", tags=["training"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class AnalyzeConversationRequest(BaseModel):
    """Request to analyze a conversation"""
    conversation_text: str
    caregiver_id: int
    patient_id: int


class TrainingFeedbackResponse(BaseModel):
    """Training feedback response"""
    overall_score: float
    grade: str
    principle_scores: dict
    violations: list
    strengths: list
    recommendations: list
    phase_analysis: dict


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/analyze-conversation")
async def analyze_conversation(
    request: AnalyzeConversationRequest,
    db: Session = Depends(get_db)
):
    """
    Analyze a conversation and provide detailed feedback
    
    Returns:
    - Overall score and grade
    - Scores for each care principle
    - Violations (what not to do)
    - Strengths (what they did well)
    - Specific recommendations
    - Phase structure analysis
    """
    
    try:
        service = CaregiverTrainingService(db)
        
        analysis = service.analyze_training_session(
            conversation_text=request.conversation_text,
            caregiver_id=request.caregiver_id,
            patient_id=request.patient_id
        )
        
        return analysis
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-audio")
async def analyze_audio_conversation(
    audio: UploadFile = File(...),
    caregiver_id: int = Form(...),
    patient_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Analyze an audio conversation
    
    Steps:
    1. Transcribe audio with Whisper
    2. Analyze conversation
    3. Return feedback
    """
    
    try:
        # Transcribe audio first
        voice_service = VoiceService()
        audio_file = audio.file
        audio_file.seek(0)
        
        transcript_result = voice_service.transcribe_audio(audio_file)
        
        if not transcript_result["success"]:
            raise HTTPException(
                status_code=400,
                detail=f"Transcription failed: {transcript_result.get('error')}"
            )
        
        # Now analyze the transcript
        service = CaregiverTrainingService(db)
        
        analysis = service.analyze_training_session(
            conversation_text=transcript_result["text"],
            caregiver_id=caregiver_id,
            patient_id=patient_id
        )
        
        # Include transcript in response
        analysis["transcript"] = transcript_result["text"]
        analysis["transcription_duration"] = transcript_result.get("duration")
        
        return analysis
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ideal-script")
async def get_ideal_script(
    dementia_stage: str = "moderate"
):
    """
    Get the ideal 7-minute visit script
    
    Args:
        dementia_stage: early, moderate, or late
    """
    
    valid_stages = ["early", "moderate", "late"]
    if dementia_stage not in valid_stages:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stage. Must be one of: {', '.join(valid_stages)}"
        )
    
    service = CaregiverTrainingService(None)  # No DB needed
    script = service.get_ideal_script(dementia_stage)
    
    return script


@router.get("/care-philosophy")
async def get_care_philosophy():
    """
    Get complete care philosophy and principles
    
    Returns:
    - Core principles
    - Ideal session structure
    - One-line ethos
    """
    
    service = CaregiverTrainingService(None)  # No DB needed
    philosophy = service.get_care_philosophy()
    
    return philosophy


@router.get("/quick-tips")
async def get_quick_tips():
    """
    Get quick reference tips for family members
    """
    
    return {
        "dos": [
            "Use their name often",
            "Say 'visit' not 'session'",
            "Validate emotions, not facts",
            "Keep sentences short (10-12 words)",
            "Follow a predictable routine",
            "Accept silence",
            "Respond to feelings",
            "Give permission to rest",
            "Say 'tomorrow' not 'goodbye'",
            "Be present, not perfect"
        ],
        "donts": [
            "Never ask 'Do you remember?'",
            "Don't correct their reality",
            "Don't give multiple choices",
            "Don't ask rapid questions",
            "Don't test their memory",
            "Don't rush or pressure",
            "Don't argue about facts",
            "Don't bring up painful topics",
            "Don't expect them to recall you",
            "Don't say 'try harder'"
        ],
        "emergency_phrases": [
            "I'm here with you",
            "You're safe",
            "It's okay",
            "Take your time",
            "I understand",
            "That sounds important",
            "We can just be together"
        ]
    }


@router.get("/stage-guide/{dementia_stage}")
async def get_stage_specific_guide(dementia_stage: str):
    """
    Get stage-specific interaction guidance
    
    Args:
        dementia_stage: early, moderate, or late
    """
    
    guides = {
        "early": {
            "stage": "Early Stage",
            "primary_challenge": "Fear, embarrassment, loss of confidence",
            "what_remains": "Language, insight, emotional nuance",
            "focus": [
                "Affirm competence",
                "Avoid 'testing'",
                "Normalize difficulty"
            ],
            "approach": "More conversational. Reflect feelings of frustration. Avoid 'memory improvement' framing. Emphasize routine, not ability.",
            "example": "Not: 'Let's exercise your memory' → Yes: 'This is just a quiet visit'",
            "session_length": "7-10 minutes",
            "key_insight": "They are very aware of their losses. Never frame this as therapy."
        },
        "moderate": {
            "stage": "Moderate Stage",
            "primary_challenge": "Confusion, anxiety, time loss",
            "what_remains": "Emotional memory, rhythm, repetition",
            "focus": [
                "Reduce complexity",
                "Increase repetition",
                "Shorten sentences"
            ],
            "approach": "One idea per session. Slower speech. Familiar topics reused often. Same structure every time.",
            "example": "'We do this every morning. I like being here with you.'",
            "session_length": "5-7 minutes",
            "key_insight": "Ritual matters more than conversation quality."
        },
        "late": {
            "stage": "Late Stage",
            "primary_challenge": "Language loss, fatigue",
            "what_remains": "Tone, presence, emotional regulation",
            "focus": [
                "Calm nervous system",
                "Provide emotional containment"
            ],
            "approach": "Very short sessions (3-5 min). Soft tone. Fewer questions, more statements. Accept silence fully.",
            "example": "'You're not alone. I'm here.'",
            "session_length": "3-5 minutes",
            "key_insight": "The voice itself becomes the product. Presence over words."
        }
    }
    
    if dementia_stage not in guides:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stage. Must be one of: early, moderate, late"
        )
    
    return guides[dementia_stage]


@router.get("/common-mistakes")
async def get_common_mistakes():
    """
    Get list of common mistakes family members make
    """
    
    return {
        "critical_mistakes": [
            {
                "mistake": "Asking 'Do you remember?'",
                "why_bad": "Testing memory creates shame and anxiety. Memory loss is the core symptom.",
                "instead": "Say: 'I was thinking about [topic]. You seemed to enjoy that.' (Statement, not question)"
            },
            {
                "mistake": "Correcting their reality",
                "why_bad": "Arguing about facts creates conflict. Their emotions are real even if facts aren't.",
                "instead": "Validate the feeling: 'That sounds important to you' or 'I can see why you'd feel that way'"
            },
            {
                "mistake": "Giving multiple choices",
                "why_bad": "Choices increase confusion and decision fatigue.",
                "instead": "Make gentle statements: 'It's time for lunch' not 'Do you want lunch now or in 30 minutes?'"
            },
            {
                "mistake": "Rapid-fire questions",
                "why_bad": "Questions create performance pressure. Multiple questions overwhelm.",
                "instead": "One question at a time, or use statements: 'Tell me about your garden' (invitation, not demand)"
            },
            {
                "mistake": "Bringing up what they forgot",
                "why_bad": "Reminding them of their deficits causes pain.",
                "instead": "Move forward: 'Let's look at this photo together' not 'Remember, I showed you this yesterday'"
            }
        ],
        "common_mistakes": [
            {
                "mistake": "Talking too fast",
                "fix": "Slow down. Pause between sentences. Processing takes longer."
            },
            {
                "mistake": "Too many topics",
                "fix": "One topic per visit. Deep beats broad."
            },
            {
                "mistake": "Filling every silence",
                "fix": "Silence is companionship. Don't rush to fill it."
            },
            {
                "mistake": "Expecting gratitude",
                "fix": "They may not remember you came. That's okay. You came for them, not for thanks."
            },
            {
                "mistake": "Saying 'I already told you that'",
                "fix": "Repetition is normal. Answer as if it's the first time, every time."
            }
        ]
    }


@router.get("/sample-conversations")
async def get_sample_conversations():
    """
    Get example conversations (good and bad)
    """
    
    return {
        "good_example": {
            "title": "Ideal 7-Minute Visit",
            "conversation": """Caregiver: Good morning, Dad. It's time for our visit. I'm here with you.
Patient: Oh, hello.
Caregiver: It's a calm morning. You're at home, and things are okay right now.
Patient: Yes, it's nice.
Caregiver: I was thinking about your garden today. You always seemed to enjoy being around plants.
Patient: Oh yes, I loved the garden.
Caregiver: What did you like most about being in the garden?
Patient: The roses. They smelled so good.
Caregiver: When you talk about the roses, you sound peaceful. That seems like something you really cared about.
Patient: I did.
Caregiver: We can stay here with that feeling for a moment.
(Pause - comfortable silence)
Caregiver: Thank you for spending this time with me. I'll visit you again tomorrow.
Patient: Thank you.""",
            "why_good": [
                "Started with name and 'visit'",
                "Provided orientation without testing",
                "Asked about feelings, not facts",
                "Validated emotions",
                "Allowed silence",
                "Promised return"
            ]
        },
        "bad_example": {
            "title": "What NOT to Do",
            "conversation": """Caregiver: Hi Dad! Do you remember me? It's Susan, your daughter!
Patient: Oh, hello.
Caregiver: Do you remember that yesterday we went to the park? We had lunch there. Do you remember what you ate?
Patient: I... I don't know.
Caregiver: Come on, try to remember. You had a sandwich. And we talked about your garden. Don't you remember your garden?
Patient: I had a garden?
Caregiver: Yes! You're forgetting everything. Remember the roses? You used to grow roses. What year did you plant them?
Patient: (becoming agitated) I don't remember!
Caregiver: Well, it was 1985. You should try harder to remember these things. The doctor said you need to exercise your memory.""",
            "why_bad": [
                "Asked 'Do you remember' multiple times",
                "Tested memory with facts",
                "Corrected repeatedly",
                "Said 'try harder'",
                "Brought up forgetting",
                "Rapid questions",
                "Created anxiety and shame"
            ]
        }
    }
