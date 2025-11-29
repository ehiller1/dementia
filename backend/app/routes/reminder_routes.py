"""Reminder management routes"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.reminder_service import ReminderService

router = APIRouter()
reminder_service = ReminderService()

@router.post("/")
async def create_reminder(
    patient_id: int,
    title: str,
    description: str,
    reminder_type: str,
    time: str,
    days_of_week: list,
    db: Session = Depends(get_db)
):
    """Create a new reminder"""
    reminder = reminder_service.create_reminder(
        db=db,
        patient_id=patient_id,
        title=title,
        description=description,
        reminder_type=reminder_type,
        time=time,
        days_of_week=days_of_week
    )
    return reminder

@router.get("/{patient_id}")
async def get_patient_reminders(
    patient_id: int,
    db: Session = Depends(get_db)
):
    """Get all reminders for a patient"""
    return reminder_service.get_patient_reminders(db, patient_id)
