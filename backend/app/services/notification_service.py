"""
Notification Service for SMS, Email, and Push Notifications
"""

from typing import Optional
from twilio.rest import Client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Handles all external notifications
    """
    
    def __init__(self):
        # Initialize Twilio client
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.twilio_client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
        else:
            self.twilio_client = None
            logger.warning("Twilio credentials not configured - SMS disabled")
    
    async def send_sms(self, to_number: str, message: str) -> bool:
        """
        Send SMS via Twilio
        
        Args:
            to_number: Phone number in E.164 format (+1234567890)
            message: Message text (max 1600 chars)
        
        Returns:
            True if sent successfully
        """
        if not self.twilio_client:
            logger.error("Cannot send SMS - Twilio not configured")
            return False
        
        try:
            message_obj = self.twilio_client.messages.create(
                body=message[:1600],  # Twilio limit
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_number
            )
            
            logger.info(f"SMS sent successfully: {message_obj.sid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return False
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html: Optional[str] = None
    ) -> bool:
        """
        Send email via SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html: Optional HTML body
        
        Returns:
            True if sent successfully
        """
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.error("Cannot send email - SMTP not configured")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = settings.SMTP_USER
            msg['To'] = to_email
            
            # Add plain text part
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html:
                html_part = MIMEText(html, 'html')
                msg.attach(html_part)
            
            # Connect and send
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def format_alert_sms(self, alert_title: str, severity: str) -> str:
        """Format concise SMS for alerts"""
        return f"ALERT [{severity}]: {alert_title}. Check caregiver dashboard for details."
