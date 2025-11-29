"""Cognitive Stimulation Therapy routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.llm_agent import CognitiveStimulationAgent
from ..models import Patient

router = APIRouter()
cst_agent = CognitiveStimulationAgent()

@router.post("/session/{patient_id}")
async def start_cst_session(
    patient_id: int,
    theme: str,
    duration_minutes: int = 30,
    db: Session = Depends(get_db)
):
    """Start a CST session"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return {"error": "Patient not found"}
    
    questions = await cst_agent.generate_themed_discussion(
        patient=patient,
        theme=theme,
        duration_minutes=duration_minutes
    )
    
    return {"theme": theme, "questions": questions}

@router.get("/themes")
async def get_cst_themes():
    """Get available CST themes"""
    return {"themes": list(cst_agent.THEMES.keys())}
