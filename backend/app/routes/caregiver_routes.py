"""
Caregiver Dashboard Routes
Provides monitoring, reporting, and management features
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import (
    User, Patient, Conversation, SafetyAlert, Reminder,
    CaregiverPatientRelationship, MemoryEntry
)
from ..services.safety_monitor import SafetyMonitor
from ..services.reminder_service import ReminderService

router = APIRouter()
safety_monitor = SafetyMonitor()
reminder_service = ReminderService()

class PatientDashboard(BaseModel):
    patient_id: int
    patient_name: str
    last_interaction: Optional[datetime]
    conversations_today: int
    conversations_this_week: int
    active_alerts: int
    pending_reminders: int
    average_sentiment_7d: Optional[float]
    engagement_trend: str  # "improving", "stable", "declining"

class ConversationSummary(BaseModel):
    id: int
    conversation_type: str
    start_time: datetime
    duration_minutes: Optional[int]
    sentiment: Optional[float]
    flagged: bool
    crisis_detected: bool
    
    class Config:
        from_attributes = True

class AlertSummary(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    created_at: datetime
    acknowledged: bool
    
    class Config:
        from_attributes = True

@router.get("/dashboard", response_model=List[PatientDashboard])
async def get_caregiver_dashboard(
    caregiver_id: int,
    db: Session = Depends(get_db)
):
    """
    Get dashboard overview for all patients under this caregiver's care
    """
    
    # Get all patient relationships
    relationships = db.query(CaregiverPatientRelationship).filter(
        CaregiverPatientRelationship.caregiver_id == caregiver_id
    ).all()
    
    dashboards = []
    
    for rel in relationships:
        patient = db.query(Patient).filter(Patient.id == rel.patient_id).first()
        if not patient:
            continue
        
        user = db.query(User).filter(User.id == patient.user_id).first()
        
        # Last interaction
        last_conv = db.query(Conversation).filter(
            Conversation.patient_id == patient.id
        ).order_by(Conversation.start_time.desc()).first()
        
        last_interaction = last_conv.start_time if last_conv else None
        
        # Conversations today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        convs_today = db.query(Conversation).filter(
            Conversation.patient_id == patient.id,
            Conversation.start_time >= today_start
        ).count()
        
        # Conversations this week
        week_start = datetime.utcnow() - timedelta(days=7)
        convs_week = db.query(Conversation).filter(
            Conversation.patient_id == patient.id,
            Conversation.start_time >= week_start
        ).count()
        
        # Active alerts
        active_alerts = db.query(SafetyAlert).filter(
            SafetyAlert.patient_id == patient.id,
            SafetyAlert.resolved_at.is_(None)
        ).count()
        
        # Pending reminders (today's reminders not yet acknowledged)
        pending_reminders = 0  # Simplified for now
        
        # Average sentiment (last 7 days)
        recent_convs = db.query(Conversation).filter(
            Conversation.patient_id == patient.id,
            Conversation.start_time >= week_start,
            Conversation.average_sentiment.isnot(None)
        ).all()
        
        avg_sentiment = None
        if recent_convs:
            sentiments = [c.average_sentiment for c in recent_convs if c.average_sentiment]
            avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else None
        
        # Engagement trend
        patterns = await safety_monitor.analyze_conversation_patterns(
            db=db,
            patient_id=patient.id,
            days=7
        )
        engagement_trend = patterns.get("sentiment_trend", "unknown")
        
        dashboards.append(PatientDashboard(
            patient_id=patient.id,
            patient_name=user.full_name if user else "Unknown",
            last_interaction=last_interaction,
            conversations_today=convs_today,
            conversations_this_week=convs_week,
            active_alerts=active_alerts,
            pending_reminders=pending_reminders,
            average_sentiment_7d=avg_sentiment,
            engagement_trend=engagement_trend
        ))
    
    return dashboards

@router.get("/patient/{patient_id}/conversations", response_model=List[ConversationSummary])
async def get_patient_conversations(
    patient_id: int,
    caregiver_id: int,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get recent conversations for a patient"""
    
    # Verify caregiver has access
    rel = db.query(CaregiverPatientRelationship).filter(
        CaregiverPatientRelationship.caregiver_id == caregiver_id,
        CaregiverPatientRelationship.patient_id == patient_id,
        CaregiverPatientRelationship.can_view_conversations == True
    ).first()
    
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get conversations
    cutoff = datetime.utcnow() - timedelta(days=days)
    conversations = db.query(Conversation).filter(
        Conversation.patient_id == patient_id,
        Conversation.start_time >= cutoff
    ).order_by(Conversation.start_time.desc()).all()
    
    return [
        ConversationSummary(
            id=c.id,
            conversation_type=c.conversation_type.value,
            start_time=c.start_time,
            duration_minutes=c.duration_seconds // 60 if c.duration_seconds else None,
            sentiment=c.average_sentiment,
            flagged=c.flagged_for_review,
            crisis_detected=c.crisis_detected
        )
        for c in conversations
    ]

@router.get("/patient/{patient_id}/alerts", response_model=List[AlertSummary])
async def get_patient_alerts(
    patient_id: int,
    caregiver_id: int,
    include_resolved: bool = False,
    db: Session = Depends(get_db)
):
    """Get safety alerts for a patient"""
    
    # Verify access
    rel = db.query(CaregiverPatientRelationship).filter(
        CaregiverPatientRelationship.caregiver_id == caregiver_id,
        CaregiverPatientRelationship.patient_id == patient_id
    ).first()
    
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get alerts
    query = db.query(SafetyAlert).filter(
        SafetyAlert.patient_id == patient_id
    )
    
    if not include_resolved:
        query = query.filter(SafetyAlert.resolved_at.is_(None))
    
    alerts = query.order_by(SafetyAlert.created_at.desc()).limit(50).all()
    
    return [
        AlertSummary(
            id=a.id,
            alert_type=a.alert_type,
            severity=a.severity.value,
            title=a.title,
            created_at=a.created_at,
            acknowledged=a.acknowledged_at is not None
        )
        for a in alerts
    ]

@router.post("/alert/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    caregiver_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Acknowledge a safety alert"""
    
    alert = db.query(SafetyAlert).filter(SafetyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Verify access
    rel = db.query(CaregiverPatientRelationship).filter(
        CaregiverPatientRelationship.caregiver_id == caregiver_id,
        CaregiverPatientRelationship.patient_id == alert.patient_id
    ).first()
    
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = caregiver_id
    if notes:
        alert.resolution_notes = notes
    
    db.commit()
    
    return {"status": "acknowledged", "alert_id": alert_id}

@router.post("/alert/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    caregiver_id: int,
    notes: str,
    db: Session = Depends(get_db)
):
    """Resolve a safety alert"""
    
    alert = db.query(SafetyAlert).filter(SafetyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Verify access
    rel = db.query(CaregiverPatientRelationship).filter(
        CaregiverPatientRelationship.caregiver_id == caregiver_id,
        CaregiverPatientRelationship.patient_id == alert.patient_id
    ).first()
    
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    alert.resolved_at = datetime.utcnow()
    alert.resolution_notes = notes
    
    db.commit()
    
    return {"status": "resolved", "alert_id": alert_id}

@router.get("/patient/{patient_id}/analytics")
async def get_patient_analytics(
    patient_id: int,
    caregiver_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analytics for a patient
    """
    
    # Verify access
    rel = db.query(CaregiverPatientRelationship).filter(
        CaregiverPatientRelationship.caregiver_id == caregiver_id,
        CaregiverPatientRelationship.patient_id == patient_id
    ).first()
    
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get conversation patterns
    conversation_patterns = await safety_monitor.analyze_conversation_patterns(
        db=db,
        patient_id=patient_id,
        days=days
    )
    
    # Get reminder adherence
    reminder_stats = reminder_service.get_reminder_adherence_stats(
        db=db,
        patient_id=patient_id,
        days=days
    )
    
    # Get alert summary
    cutoff = datetime.utcnow() - timedelta(days=days)
    alerts = db.query(SafetyAlert).filter(
        SafetyAlert.patient_id == patient_id,
        SafetyAlert.created_at >= cutoff
    ).all()
    
    alert_summary = {
        "total": len(alerts),
        "by_type": {},
        "by_severity": {}
    }
    
    for alert in alerts:
        # By type
        if alert.alert_type not in alert_summary["by_type"]:
            alert_summary["by_type"][alert.alert_type] = 0
        alert_summary["by_type"][alert.alert_type] += 1
        
        # By severity
        severity = alert.severity.value
        if severity not in alert_summary["by_severity"]:
            alert_summary["by_severity"][severity] = 0
        alert_summary["by_severity"][severity] += 1
    
    return {
        "period_days": days,
        "conversation_patterns": conversation_patterns,
        "reminder_adherence": reminder_stats,
        "alerts": alert_summary,
        "generated_at": datetime.utcnow().isoformat()
    }
