"""
Safety Monitoring & Alert System
Detects concerning patterns and triggers appropriate responses
"""

from typing import List, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models import (
    Patient, Conversation, ConversationTurn, SafetyAlert, 
    AlertSeverity, CaregiverPatientRelationship, User
)
from ..config import settings
from .notification_service import NotificationService
import re

class SafetyMonitor:
    """
    Monitors conversations and patterns for safety concerns
    """
    
    def __init__(self):
        self.notification_service = NotificationService()
    
    async def analyze_message(
        self,
        db: Session,
        patient_id: int,
        message: str,
        conversation_id: int
    ) -> Tuple[bool, Optional[SafetyAlert]]:
        """
        Analyze a message for safety concerns
        
        Returns:
            (requires_immediate_action, alert_created)
        """
        
        # Check for crisis keywords
        crisis_detected, crisis_keywords = self._detect_crisis(message)
        
        # Check for distress keywords
        distress_detected, distress_keywords = self._detect_distress(message)
        
        # Check for confusion/delusion patterns
        confusion_detected = self._detect_confusion_patterns(message)
        
        alert = None
        immediate_action = False
        
        # Create alert if needed
        if crisis_detected:
            alert = await self._create_crisis_alert(
                db, patient_id, conversation_id, message, crisis_keywords
            )
            immediate_action = True
            
        elif distress_detected:
            alert = await self._create_distress_alert(
                db, patient_id, conversation_id, message, distress_keywords
            )
            immediate_action = True
        
        return immediate_action, alert
    
    def _detect_crisis(self, message: str) -> Tuple[bool, List[str]]:
        """Detect crisis keywords (suicide, self-harm)"""
        found_keywords = []
        message_lower = message.lower()
        
        for keyword in settings.crisis_keywords_list:
            if keyword.lower() in message_lower:
                found_keywords.append(keyword)
        
        return len(found_keywords) > 0, found_keywords
    
    def _detect_distress(self, message: str) -> Tuple[bool, List[str]]:
        """Detect distress keywords (fall, pain, lost)"""
        found_keywords = []
        message_lower = message.lower()
        
        for keyword in settings.distress_keywords_list:
            if keyword.lower() in message_lower:
                found_keywords.append(keyword)
        
        return len(found_keywords) > 0, found_keywords
    
    def _detect_confusion_patterns(self, message: str) -> bool:
        """
        Detect patterns indicating severe confusion or delusion
        """
        confusion_patterns = [
            r"people\s+in\s+my\s+house",
            r"stealing\s+(?:my|from\s+me)",
            r"(?:mother|father|spouse)\s+(?:is\s+)?(?:alive|here|waiting)",
            r"need\s+to\s+(?:go\s+)?(?:work|job|office)",
            r"where\s+(?:am\s+i|is\s+this)",
            r"who\s+are\s+you"
        ]
        
        message_lower = message.lower()
        for pattern in confusion_patterns:
            if re.search(pattern, message_lower):
                return True
        
        return False
    
    async def _create_crisis_alert(
        self,
        db: Session,
        patient_id: int,
        conversation_id: int,
        trigger_text: str,
        keywords: List[str]
    ) -> SafetyAlert:
        """Create and notify crisis alert"""
        
        alert = SafetyAlert(
            patient_id=patient_id,
            alert_type="crisis",
            severity=AlertSeverity.CRITICAL,
            title="Crisis Language Detected",
            description=f"Patient used concerning language that may indicate suicide risk or self-harm. Keywords: {', '.join(keywords)}",
            conversation_id=conversation_id,
            trigger_text=trigger_text[:500]  # Limit length
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # Send immediate notifications
        await self._send_emergency_notifications(db, patient_id, alert)
        
        return alert
    
    async def _create_distress_alert(
        self,
        db: Session,
        patient_id: int,
        conversation_id: int,
        trigger_text: str,
        keywords: List[str]
    ) -> SafetyAlert:
        """Create and notify distress alert"""
        
        alert = SafetyAlert(
            patient_id=patient_id,
            alert_type="distress",
            severity=AlertSeverity.CRITICAL,
            title="Distress Detected",
            description=f"Patient reported distress or potential injury. Keywords: {', '.join(keywords)}",
            conversation_id=conversation_id,
            trigger_text=trigger_text[:500]
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # Send immediate notifications
        await self._send_emergency_notifications(db, patient_id, alert)
        
        return alert
    
    async def _send_emergency_notifications(
        self,
        db: Session,
        patient_id: int,
        alert: SafetyAlert
    ):
        """Send emergency notifications to all caregivers"""
        
        # Get all caregivers for this patient
        relationships = db.query(CaregiverPatientRelationship).filter(
            CaregiverPatientRelationship.patient_id == patient_id
        ).all()
        
        notifications_sent = []
        
        for rel in relationships:
            caregiver = db.query(User).filter(User.id == rel.caregiver_id).first()
            if not caregiver:
                continue
            
            # Send SMS if emergency contact
            if rel.emergency_contact and caregiver.phone_number:
                sms_sent = await self.notification_service.send_sms(
                    to_number=caregiver.phone_number,
                    message=f"URGENT: {alert.title} - {alert.description[:100]}. Please check on patient immediately."
                )
                if sms_sent:
                    notifications_sent.append({
                        "type": "sms",
                        "recipient": caregiver.email,
                        "timestamp": datetime.utcnow().isoformat()
                    })
            
            # Always send email
            email_sent = await self.notification_service.send_email(
                to_email=caregiver.email,
                subject=f"URGENT ALERT: {alert.title}",
                body=self._format_alert_email(alert, caregiver.full_name)
            )
            if email_sent:
                notifications_sent.append({
                    "type": "email",
                    "recipient": caregiver.email,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        # Update alert with notifications sent
        alert.notifications_sent = notifications_sent
        db.commit()
    
    def _format_alert_email(self, alert: SafetyAlert, caregiver_name: str) -> str:
        """Format alert email body"""
        return f"""Dear {caregiver_name},

This is an urgent alert from the Memory Care Companion system.

ALERT: {alert.title}
SEVERITY: {alert.severity.value.upper()}
TIME: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}

DESCRIPTION:
{alert.description}

WHAT WAS SAID:
"{alert.trigger_text}"

RECOMMENDED ACTION:
Please check on the patient immediately. If this indicates a medical emergency, call 911.

You can view more details and mark this alert as resolved in the caregiver dashboard.

---
Memory Care Companion System
This is an automated alert. Please do not reply to this email.
"""
    
    async def check_inactivity(
        self,
        db: Session,
        patient_id: int
    ) -> Optional[SafetyAlert]:
        """
        Check if patient has been inactive for too long
        Creates warning alert if no conversation in MAX_INACTIVITY_HOURS
        """
        
        # Get last conversation
        last_conversation = db.query(Conversation).filter(
            Conversation.patient_id == patient_id
        ).order_by(
            Conversation.start_time.desc()
        ).first()
        
        if not last_conversation:
            return None
        
        hours_since_last = (datetime.utcnow() - last_conversation.start_time).total_seconds() / 3600
        
        if hours_since_last > settings.MAX_INACTIVITY_HOURS:
            # Check if we already created an alert for this inactivity period
            existing_alert = db.query(SafetyAlert).filter(
                SafetyAlert.patient_id == patient_id,
                SafetyAlert.alert_type == "inactivity",
                SafetyAlert.resolved_at.is_(None),
                SafetyAlert.created_at > last_conversation.start_time
            ).first()
            
            if existing_alert:
                return None  # Already alerted
            
            # Create inactivity alert
            alert = SafetyAlert(
                patient_id=patient_id,
                alert_type="inactivity",
                severity=AlertSeverity.WARNING,
                title="Extended Inactivity",
                description=f"No interaction with system for {int(hours_since_last)} hours (threshold: {settings.MAX_INACTIVITY_HOURS} hours)"
            )
            
            db.add(alert)
            db.commit()
            db.refresh(alert)
            
            # Send notifications to caregivers
            await self._send_inactivity_notifications(db, patient_id, alert, hours_since_last)
            
            return alert
        
        return None
    
    async def _send_inactivity_notifications(
        self,
        db: Session,
        patient_id: int,
        alert: SafetyAlert,
        hours: float
    ):
        """Send inactivity notifications"""
        
        relationships = db.query(CaregiverPatientRelationship).filter(
            CaregiverPatientRelationship.patient_id == patient_id
        ).all()
        
        notifications_sent = []
        
        for rel in relationships:
            caregiver = db.query(User).filter(User.id == rel.caregiver_id).first()
            if not caregiver:
                continue
            
            email_sent = await self.notification_service.send_email(
                to_email=caregiver.email,
                subject=f"Inactivity Alert: No interaction for {int(hours)} hours",
                body=f"""Dear {caregiver.full_name},

The Memory Care Companion system has not detected any interaction with the patient for {int(hours)} hours.

This may be normal if the patient is sleeping or away from the device. However, please check to ensure they are safe and the device is functioning properly.

Last interaction: {alert.created_at.strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
Memory Care Companion System
"""
            )
            
            if email_sent:
                notifications_sent.append({
                    "type": "email",
                    "recipient": caregiver.email,
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        alert.notifications_sent = notifications_sent
        db.commit()
    
    async def analyze_conversation_patterns(
        self,
        db: Session,
        patient_id: int,
        days: int = 7
    ) -> Dict:
        """
        Analyze conversation patterns over time to detect changes
        Returns metrics that can indicate cognitive decline or distress
        """
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        conversations = db.query(Conversation).filter(
            Conversation.patient_id == patient_id,
            Conversation.start_time >= cutoff_date
        ).all()
        
        if not conversations:
            return {"error": "No conversations in period"}
        
        # Calculate metrics
        total_conversations = len(conversations)
        total_duration = sum(c.duration_seconds or 0 for c in conversations) / 60  # minutes
        avg_duration = total_duration / total_conversations if total_conversations > 0 else 0
        
        # Sentiment trends
        sentiments = [c.average_sentiment for c in conversations if c.average_sentiment is not None]
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
        
        # Count flags
        crisis_count = sum(1 for c in conversations if c.crisis_detected)
        distress_count = sum(1 for c in conversations if c.distress_detected)
        confusion_count = sum(1 for c in conversations if c.confusion_detected)
        
        # Recent vs previous half
        mid_point = len(conversations) // 2
        recent_convs = conversations[mid_point:]
        previous_convs = conversations[:mid_point]
        
        recent_sentiment = sum(c.average_sentiment for c in recent_convs if c.average_sentiment) / len(recent_convs) if recent_convs else 0
        previous_sentiment = sum(c.average_sentiment for c in previous_convs if c.average_sentiment) / len(previous_convs) if previous_convs else 0
        
        sentiment_change = recent_sentiment - previous_sentiment
        
        return {
            "period_days": days,
            "total_conversations": total_conversations,
            "total_duration_minutes": round(total_duration, 1),
            "average_duration_minutes": round(avg_duration, 1),
            "average_sentiment": round(avg_sentiment, 2),
            "sentiment_trend": "declining" if sentiment_change < -0.1 else "improving" if sentiment_change > 0.1 else "stable",
            "sentiment_change": round(sentiment_change, 2),
            "crisis_events": crisis_count,
            "distress_events": distress_count,
            "confusion_events": confusion_count,
            "engagement_per_day": round(total_conversations / days, 1)
        }
