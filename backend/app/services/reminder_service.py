"""
Reminder Service with Escalation Logic
Handles scheduled reminders and escalation to caregivers
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, time as dt_time
from ..models import (
    Reminder, ReminderExecution, Patient, 
    CaregiverPatientRelationship, User
)
from .notification_service import NotificationService
import logging

logger = logging.getLogger(__name__)

class ReminderService:
    """
    Manages reminders with smart escalation
    """
    
    def __init__(self):
        self.notification_service = NotificationService()
    
    def create_reminder(
        self,
        db: Session,
        patient_id: int,
        title: str,
        description: str,
        reminder_type: str,
        time: str,
        days_of_week: List[int],
        is_recurring: bool = True,
        max_retry_count: int = 3,
        retry_interval_minutes: int = 10,
        escalate_to_caregiver: bool = True,
        created_by: int = None
    ) -> Reminder:
        """Create a new reminder"""
        
        reminder = Reminder(
            patient_id=patient_id,
            title=title,
            description=description,
            reminder_type=reminder_type,
            time=time,
            days_of_week=days_of_week,
            is_recurring=is_recurring,
            max_retry_count=max_retry_count,
            retry_interval_minutes=retry_interval_minutes,
            escalate_to_caregiver=escalate_to_caregiver,
            created_by=created_by,
            is_active=True
        )
        
        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        
        return reminder
    
    def get_due_reminders(
        self,
        db: Session,
        current_time: datetime
    ) -> List[Reminder]:
        """
        Get all reminders that are due now
        Checks day of week and time
        """
        
        current_day = current_time.weekday()  # 0 = Monday
        current_time_str = current_time.strftime("%H:%M")
        
        # Get all active reminders
        all_reminders = db.query(Reminder).filter(
            Reminder.is_active == True
        ).all()
        
        due_reminders = []
        
        for reminder in all_reminders:
            # Check if today is a scheduled day
            if current_day not in reminder.days_of_week:
                continue
            
            # Check if time matches (within 1 minute window)
            reminder_time = datetime.strptime(reminder.time, "%H:%M").time()
            current_time_only = current_time.time()
            
            # Allow 1-minute window
            time_diff = abs(
                (current_time_only.hour * 60 + current_time_only.minute) -
                (reminder_time.hour * 60 + reminder_time.minute)
            )
            
            if time_diff <= 1:
                # Check if already executed today
                today_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
                existing_execution = db.query(ReminderExecution).filter(
                    ReminderExecution.reminder_id == reminder.id,
                    ReminderExecution.scheduled_time >= today_start,
                    ReminderExecution.status != "missed"
                ).first()
                
                if not existing_execution:
                    due_reminders.append(reminder)
        
        return due_reminders
    
    async def deliver_reminder(
        self,
        db: Session,
        reminder: Reminder,
        scheduled_time: datetime
    ) -> ReminderExecution:
        """
        Deliver a reminder to the patient
        Creates execution record
        """
        
        # Create execution record
        execution = ReminderExecution(
            reminder_id=reminder.id,
            scheduled_time=scheduled_time,
            delivered_at=datetime.utcnow(),
            status="delivered",
            retry_count=0
        )
        
        db.add(execution)
        db.commit()
        db.refresh(execution)
        
        logger.info(f"Reminder delivered: {reminder.title} (execution_id: {execution.id})")
        
        # In a real system, this would trigger:
        # - Voice announcement through smart speaker
        # - Push notification to mobile app
        # - Visual alert on tablet/display
        
        return execution
    
    async def acknowledge_reminder(
        self,
        db: Session,
        execution_id: int
    ) -> bool:
        """
        Mark reminder as acknowledged by patient
        """
        
        execution = db.query(ReminderExecution).filter(
            ReminderExecution.id == execution_id
        ).first()
        
        if not execution:
            return False
        
        execution.acknowledged_at = datetime.utcnow()
        execution.status = "acknowledged"
        db.commit()
        
        logger.info(f"Reminder acknowledged: execution_id {execution_id}")
        return True
    
    async def check_unacknowledged_reminders(self, db: Session):
        """
        Check for unacknowledged reminders and handle retries/escalation
        Should be run periodically (e.g., every minute)
        """
        
        # Get unacknowledged executions
        unacknowledged = db.query(ReminderExecution).filter(
            ReminderExecution.status == "delivered",
            ReminderExecution.acknowledged_at.is_(None)
        ).all()
        
        for execution in unacknowledged:
            reminder = db.query(Reminder).filter(
                Reminder.id == execution.reminder_id
            ).first()
            
            if not reminder:
                continue
            
            # Calculate time since delivery
            time_since_delivery = (
                datetime.utcnow() - execution.delivered_at
            ).total_seconds() / 60  # minutes
            
            # Check if we should retry
            if time_since_delivery >= reminder.retry_interval_minutes:
                if execution.retry_count < reminder.max_retry_count:
                    # Retry reminder
                    execution.retry_count += 1
                    execution.delivered_at = datetime.utcnow()  # Update delivery time
                    db.commit()
                    
                    logger.info(
                        f"Retrying reminder {reminder.title} "
                        f"(attempt {execution.retry_count}/{reminder.max_retry_count})"
                    )
                    
                else:
                    # Max retries reached - escalate if enabled
                    if reminder.escalate_to_caregiver and not execution.escalated:
                        await self._escalate_to_caregiver(db, reminder, execution)
                    else:
                        # Mark as missed
                        execution.status = "missed"
                        db.commit()
                        logger.warning(f"Reminder missed: {reminder.title}")
    
    async def _escalate_to_caregiver(
        self,
        db: Session,
        reminder: Reminder,
        execution: ReminderExecution
    ):
        """
        Escalate missed reminder to caregivers
        """
        
        patient = db.query(Patient).filter(
            Patient.id == reminder.patient_id
        ).first()
        
        if not patient:
            return
        
        # Get caregivers who can manage reminders
        relationships = db.query(CaregiverPatientRelationship).filter(
            CaregiverPatientRelationship.patient_id == reminder.patient_id,
            CaregiverPatientRelationship.can_manage_reminders == True
        ).all()
        
        for rel in relationships:
            caregiver = db.query(User).filter(
                User.id == rel.caregiver_id
            ).first()
            
            if not caregiver:
                continue
            
            # Send notification
            message = f"""Reminder not acknowledged:

Patient has not responded to "{reminder.title}" reminder after {execution.retry_count} attempts.

Reminder details:
- Type: {reminder.reminder_type}
- Scheduled: {execution.scheduled_time.strftime('%I:%M %p')}
- Description: {reminder.description}

Please check on the patient.

View details: [Dashboard Link]
"""
            
            # Send email
            await self.notification_service.send_email(
                to_email=caregiver.email,
                subject=f"Reminder Not Acknowledged: {reminder.title}",
                body=message
            )
            
            # Send SMS to emergency contacts
            if rel.emergency_contact and caregiver.phone_number:
                sms_message = f"Patient has not acknowledged '{reminder.title}' reminder. Please check on them."
                await self.notification_service.send_sms(
                    to_number=caregiver.phone_number,
                    message=sms_message
                )
        
        # Mark as escalated
        execution.escalated = True
        execution.escalated_at = datetime.utcnow()
        execution.status = "escalated"
        db.commit()
        
        logger.info(f"Reminder escalated to caregivers: {reminder.title}")
    
    def get_patient_reminders(
        self,
        db: Session,
        patient_id: int,
        include_inactive: bool = False
    ) -> List[Reminder]:
        """Get all reminders for a patient"""
        
        query = db.query(Reminder).filter(
            Reminder.patient_id == patient_id
        )
        
        if not include_inactive:
            query = query.filter(Reminder.is_active == True)
        
        return query.order_by(Reminder.time).all()
    
    def get_reminder_adherence_stats(
        self,
        db: Session,
        patient_id: int,
        days: int = 30
    ) -> dict:
        """
        Calculate reminder adherence statistics
        """
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all executions in period
        executions = db.query(ReminderExecution).join(Reminder).filter(
            Reminder.patient_id == patient_id,
            ReminderExecution.scheduled_time >= cutoff_date
        ).all()
        
        if not executions:
            return {"period_days": days, "no_data": True}
        
        total = len(executions)
        acknowledged = sum(1 for e in executions if e.status == "acknowledged")
        missed = sum(1 for e in executions if e.status == "missed")
        escalated = sum(1 for e in executions if e.status == "escalated")
        
        # Group by reminder type
        by_type = {}
        for execution in executions:
            reminder = db.query(Reminder).filter(
                Reminder.id == execution.reminder_id
            ).first()
            
            if reminder:
                if reminder.reminder_type not in by_type:
                    by_type[reminder.reminder_type] = {
                        "total": 0,
                        "acknowledged": 0,
                        "missed": 0
                    }
                
                by_type[reminder.reminder_type]["total"] += 1
                if execution.status == "acknowledged":
                    by_type[reminder.reminder_type]["acknowledged"] += 1
                elif execution.status == "missed":
                    by_type[reminder.reminder_type]["missed"] += 1
        
        # Calculate adherence rates
        for type_name in by_type:
            type_data = by_type[type_name]
            type_data["adherence_rate"] = (
                type_data["acknowledged"] / type_data["total"] * 100
                if type_data["total"] > 0 else 0
            )
        
        return {
            "period_days": days,
            "total_reminders": total,
            "acknowledged": acknowledged,
            "missed": missed,
            "escalated": escalated,
            "overall_adherence_rate": (acknowledged / total * 100) if total > 0 else 0,
            "by_type": by_type
        }
