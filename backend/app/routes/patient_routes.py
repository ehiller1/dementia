"""Patient management routes"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models import Patient, User, DementiaStage

router = APIRouter()

class PatientCreate(BaseModel):
    user_id: int
    date_of_birth: datetime
    dementia_stage: DementiaStage
    diagnosis: Optional[str] = None

class PatientUpdate(BaseModel):
    dementia_stage: Optional[DementiaStage] = None
    sentence_complexity: Optional[int] = None
    speech_speed: Optional[float] = None
    preferred_voice: Optional[str] = None

@router.post("/", status_code=201)
async def create_patient_profile(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    """Create a patient profile"""
    new_patient = Patient(**patient.dict())
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@router.get("/{patient_id}")
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get patient profile"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}")
async def update_patient(
    patient_id: int,
    update: PatientUpdate,
    db: Session = Depends(get_db)
):
    """Update patient settings"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    for field, value in update.dict(exclude_unset=True).items():
        setattr(patient, field, value)
    
    patient.updated_at = datetime.utcnow()
    db.commit()
    return patient
