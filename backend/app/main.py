"""
Main FastAPI Application
Memory Care Companion API
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from .database import get_db, engine
from .models import Base
from .config import settings
from .services.llm_agent import MemoryCareAgent, CognitiveStimulationAgent
from .services.memory_rag import MemoryRAG
from .services.safety_monitor import SafetyMonitor
from .services.reminder_service import ReminderService

# Create database tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Memory Care Companion API",
    description="AI-powered memory care and support system for dementia patients",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
memory_care_agent = MemoryCareAgent()
cst_agent = CognitiveStimulationAgent()
memory_rag = MemoryRAG()
safety_monitor = SafetyMonitor()
reminder_service = ReminderService()

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Import routes
from .routes import (
    auth_routes,
    patient_routes,
    conversation_routes,
    memory_routes,
    reminder_routes,
    caregiver_routes,
    cst_routes,
    mvp_routes,  # MVP Daily Ritual routes
    analytics_routes,  # Engagement Analytics routes
    voice_routes,  # Voice & Whisper routes
    training_routes  # Caregiver Training routes
)

# Include routers
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patient_routes.router, prefix="/api/patients", tags=["Patients"])
app.include_router(conversation_routes.router, prefix="/api/conversations", tags=["Conversations"])
app.include_router(memory_routes.router, prefix="/api/memories", tags=["Memories"])
app.include_router(reminder_routes.router, prefix="/api/reminders", tags=["Reminders"])
app.include_router(caregiver_routes.router, prefix="/api/caregiver", tags=["Caregiver"])
app.include_router(cst_routes.router, prefix="/api/cst", tags=["Cognitive Stimulation"])
app.include_router(mvp_routes.router, tags=["MVP Daily Ritual"])  # MVP mode routes
app.include_router(analytics_routes.router, tags=["Engagement Analytics"])  # Analytics routes
app.include_router(voice_routes.router, tags=["Voice & Speech"])  # Whisper & TTS routes
app.include_router(training_routes.router, tags=["Caregiver Training"])  # Training & feedback routes

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Memory Care Companion API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    """Detailed health check"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
        "config": {
            "voice_recording_enabled": settings.ENABLE_VOICE_RECORDING,
            "offline_mode_enabled": settings.ENABLE_OFFLINE_MODE,
            "smart_home_enabled": settings.ENABLE_SMART_HOME_INTEGRATION
        }
    }

@app.websocket("/ws/conversation/{patient_id}")
async def conversation_websocket(
    websocket: WebSocket,
    patient_id: int,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time conversation
    Allows bidirectional communication for voice/text chat
    """
    await websocket.accept()
    
    logger.info(f"WebSocket connection established for patient {patient_id}")
    
    try:
        # Initialize conversation
        from .models import Patient, Conversation, ConversationType
        
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            await websocket.send_json({"error": "Patient not found"})
            await websocket.close()
            return
        
        # Create conversation record
        conversation = Conversation(
            patient_id=patient_id,
            conversation_type=ConversationType.CASUAL,
            start_time=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        conversation_history = []
        
        # Send welcome message
        welcome_message = "Hello! I'm here to chat with you. How are you feeling today?"
        await websocket.send_json({
            "type": "assistant_message",
            "content": welcome_message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            if data.get("type") == "user_message":
                user_message = data.get("content", "")
                
                logger.info(f"Received message from patient {patient_id}: {user_message[:50]}...")
                
                # Check for safety concerns
                immediate_action, alert = await safety_monitor.analyze_message(
                    db=db,
                    patient_id=patient_id,
                    message=user_message,
                    conversation_id=conversation.id
                )
                
                if immediate_action and alert:
                    # Send crisis response
                    crisis_response = await memory_care_agent.generate_crisis_response(
                        patient=patient,
                        crisis_type=alert.alert_type
                    )
                    
                    await websocket.send_json({
                        "type": "assistant_message",
                        "content": crisis_response,
                        "is_crisis_response": True,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
                    # Log turn
                    from .models import ConversationTurn
                    user_turn = ConversationTurn(
                        conversation_id=conversation.id,
                        turn_number=len(conversation_history),
                        speaker="patient",
                        text=user_message,
                        contains_crisis_keyword=True
                    )
                    assistant_turn = ConversationTurn(
                        conversation_id=conversation.id,
                        turn_number=len(conversation_history) + 1,
                        speaker="assistant",
                        text=crisis_response
                    )
                    db.add(user_turn)
                    db.add(assistant_turn)
                    db.commit()
                    
                    continue
                
                # Retrieve relevant memories
                memories = await memory_rag.get_context_for_conversation(
                    db=db,
                    patient_id=patient_id,
                    recent_messages=[user_message],
                    conversation_type="casual"
                )
                
                # Generate response
                response = await memory_care_agent.generate_response(
                    patient=patient,
                    user_message=user_message,
                    conversation_history=conversation_history,
                    conversation_type=ConversationType.CASUAL,
                    retrieved_memories=memories
                )
                
                # Send response
                await websocket.send_json({
                    "type": "assistant_message",
                    "content": response,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Update conversation history
                conversation_history.append({"role": "user", "content": user_message})
                conversation_history.append({"role": "assistant", "content": response})
                
                # Log turns
                from .models import ConversationTurn
                user_turn = ConversationTurn(
                    conversation_id=conversation.id,
                    turn_number=len(conversation_history) - 1,
                    speaker="patient",
                    text=user_message
                )
                assistant_turn = ConversationTurn(
                    conversation_id=conversation.id,
                    turn_number=len(conversation_history),
                    speaker="assistant",
                    text=response
                )
                db.add(user_turn)
                db.add(assistant_turn)
                db.commit()
                
                logger.info(f"Sent response to patient {patient_id}")
            
            elif data.get("type") == "end_conversation":
                # End conversation
                conversation.end_time = datetime.utcnow()
                conversation.duration_seconds = int(
                    (conversation.end_time - conversation.start_time).total_seconds()
                )
                conversation.turn_count = len(conversation_history)
                db.commit()
                
                await websocket.send_json({
                    "type": "conversation_ended",
                    "timestamp": datetime.utcnow().isoformat()
                })
                break
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for patient {patient_id}")
        # Update conversation end time
        if conversation:
            conversation.end_time = datetime.utcnow()
            if conversation.start_time:
                conversation.duration_seconds = int(
                    (conversation.end_time - conversation.start_time).total_seconds()
                )
            db.commit()
    
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {e}")
        await websocket.send_json({"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
