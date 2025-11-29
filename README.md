# Memory Care Companion

A comprehensive LLM-based solution to provide memory care, support, and socialization for individuals living with dementia.

## 🎯 Overview

This system implements evidence-based dementia care principles (CST/iCST/WHELD) through an AI-powered companion that provides:

- **Conversational companionship** with safety guardrails
- **Cognitive stimulation** activities
- **Memory support** through personalized RAG system
- **Safety monitoring** with crisis detection and escalation
- **Caregiver dashboard** for monitoring and management
- **Reminder system** with intelligent escalation

## ✨ Key Features

### For Patients
- **Voice-first interface** optimized for dementia patients (large text, simple UI, slow speech)
- **Natural conversation** with personalized memory context
- **Reminiscence therapy** using life stories and photos
- **Cognitive stimulation** sessions (themed discussions, category fluency, orientation)
- **Gentle reminders** for medications, meals, activities
- **Crisis support** with immediate caregiver notification

### For Caregivers
- **Real-time dashboard** showing engagement, mood, and alerts
- **Safety alerts** for crisis language, distress, or inactivity
- **Conversation analytics** including sentiment trends and patterns
- **Memory book management** to add personal history and photos
- **Reminder configuration** with custom escalation rules
- **Comprehensive reports** on cognitive and behavioral patterns

### Safety & Clinical Features
- **LLM Guardrails**: No medical advice, clear boundaries, safety filters
- **Crisis Detection**: Suicide, self-harm, injury, fall detection
- **Escalation System**: Multi-level alerts to caregivers with SMS/email
- **Conversation Logging**: Secure storage with flagging for review
- **Consent Management**: Explicit consent for recording and data use
- **HIPAA-ready architecture**: Encryption, audit logs, data retention

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI (Python 3.11+)
- PostgreSQL with pgvector for semantic search
- Redis for caching
- OpenAI GPT-4 for conversations
- LangChain for RAG pipeline
- Celery for background tasks

**Frontend:**
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Radix UI for accessible components
- WebSocket for real-time chat
- Web Speech API for voice interface

**Infrastructure:**
- Docker & Docker Compose
- Nginx reverse proxy
- PostgreSQL database
- Redis cache

## 📋 Requirements Implementation

This system implements all requirements from your specification:

### User Roles (Section 3.1)
✅ Person with dementia (primary user)  
✅ Family caregivers with monitoring access  
✅ Professional caregivers/clinicians with analytics  

### Core Features (Section 3.2)
✅ **1. Conversational Companion**: Natural, slow-paced dialogue with personal context  
✅ **2. CST Module**: Themed sessions, category fluency, orientation exercises  
✅ **3. Memory Support**: Personal memory book with RAG retrieval  
✅ **4. Reminders**: Voice reminders with escalation rules  
✅ **5. Safety Monitoring**: Sentiment analysis, crisis detection, caregiver alerts  
✅ **6. Caregiver Portal**: Dashboard, analytics, alert management  

### LLM Requirements (Section 3.3)
✅ **Personalization**: RAG-based memory retrieval with life story graph  
✅ **Safety Guardrails**: No medical advice, crisis response, logging  
✅ **Adaptive Complexity**: Adjustable sentence length/vocabulary by dementia stage  

### Accessibility (Section 3.4)
✅ Voice-first with text option  
✅ Large fonts, high contrast, simple layouts  
✅ Slow, clear speech with configurable speed  
✅ Error handling and graceful degradation  

### Non-Functional (Section 3.5)
✅ Privacy: Explicit consent, encryption, local processing options  
✅ Compliance: Designed for wellness/assistive classification  
✅ Reliability: Offline fallbacks, SMS escalation  

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd windsurf-project-3
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Run database migrations
   alembic upgrade head
   
   # Start API server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Start frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Patient Interface: http://localhost:3000/patient
   - Caregiver Dashboard: http://localhost:3000/caregiver
   - API Documentation: http://localhost:8000/docs

## 📚 Documentation

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user

**Patients:**
- `POST /api/patients` - Create patient profile
- `GET /api/patients/{id}` - Get patient details
- `PUT /api/patients/{id}` - Update patient settings

**Conversations:**
- `WS /ws/conversation/{patient_id}` - WebSocket for real-time chat
- `GET /api/conversations/{id}` - Get conversation history

**Memories:**
- `POST /api/memories` - Create memory entry
- `GET /api/memories/{patient_id}` - Get patient memories

**Reminders:**
- `POST /api/reminders` - Create reminder
- `GET /api/reminders/{patient_id}` - Get patient reminders

**Caregiver:**
- `GET /api/caregiver/dashboard` - Get overview for all patients
- `GET /api/caregiver/patient/{id}/alerts` - Get safety alerts
- `POST /api/caregiver/alert/{id}/acknowledge` - Acknowledge alert

**CST:**
- `POST /api/cst/session/{patient_id}` - Start CST session
- `GET /api/cst/themes` - Get available themes

### Configuration

Key settings in `.env`:

```bash
# Dementia Stage Adaptation
SENTENCE_COMPLEXITY=1  # 1=simple, 2=moderate, 3=standard
SPEECH_SPEED=0.85      # 0.5-1.0, slower for dementia

# Safety Thresholds
MAX_INACTIVITY_HOURS=12
CRISIS_KEYWORDS=["suicide", "kill myself", ...]
DISTRESS_KEYWORDS=["fell", "can't breathe", ...]

# Features
ENABLE_VOICE_RECORDING=true
ENABLE_OFFLINE_MODE=true
REQUIRE_EXPLICIT_CONSENT=true
```

## 🔒 Security & Compliance

### Data Privacy
- All conversations encrypted at rest and in transit
- Explicit consent required for voice recording
- Configurable data retention (default 90 days)
- Option for local processing (no cloud)

### Safety Protocols
- No medical diagnosis or treatment advice
- Clear AI persona ("I'm a digital helper")
- Crisis keyword detection with immediate alerts
- Human review for flagged conversations
- Emergency contact escalation

### Regulatory Considerations
- Designed as wellness/assistive technology (not medical device)
- HIPAA-ready architecture
- Audit logging for all sensitive actions
- For digital therapeutic claims, RCT trials required

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📊 Monitoring

The system includes:
- Prometheus metrics for system health
- Sentry for error tracking
- Custom analytics for clinical insights
- Caregiver dashboard for patient monitoring

## 🤝 Contributing

This is a prototype implementation. For production use:
1. Complete clinical validation studies
2. Obtain appropriate regulatory clearances
3. Implement comprehensive security audit
4. Add full test coverage
5. Set up production infrastructure

## ⚠️ Disclaimer

**This system is designed to support, not replace, human care.**

- Not a medical device
- Not for diagnosis or treatment
- Always consult healthcare professionals
- Requires caregiver supervision
- Emergency situations require human intervention

## 📄 License

MIT License - see LICENSE for details.

## 📧 Contact

For questions about implementation or clinical validation, please open an issue.

---

**Built with evidence-based dementia care principles and modern AI technology.**
