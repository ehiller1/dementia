# System Architecture

## Overview

The Memory Care Companion system is built on a modern, scalable architecture designed for healthcare applications with strict safety and privacy requirements.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────────┐              ┌───────────────────┐   │
│  │  Patient UI      │              │  Caregiver        │   │
│  │  (Next.js)       │              │  Dashboard        │   │
│  │  - Voice Input   │              │  - Analytics      │   │
│  │  - Large Text    │              │  - Alerts         │   │
│  │  - Simple Nav    │              │  - Reports        │   │
│  └────────┬─────────┘              └─────────┬─────────┘   │
└───────────┼────────────────────────────────────┼───────────┘
            │                                    │
            │  WebSocket / REST API              │
            │                                    │
┌───────────┼────────────────────────────────────┼───────────┐
│           │        Backend Layer               │           │
│  ┌────────▼──────────────────────────────────┬─▼─────────┐ │
│  │          FastAPI Application               │           │ │
│  │  ┌─────────────────────────────────────┐  │           │ │
│  │  │  API Routes                         │  │           │ │
│  │  │  - Auth, Patients, Conversations    │  │           │ │
│  │  │  - Memories, Reminders, Caregiver   │  │           │ │
│  │  └───────────────┬─────────────────────┘  │           │ │
│  │                  │                         │           │ │
│  │  ┌───────────────▼─────────────────────┐  │           │ │
│  │  │  Core Services                      │  │           │ │
│  │  │  ┌──────────────┐ ┌──────────────┐ │  │           │ │
│  │  │  │ LLM Agent    │ │ Memory RAG   │ │  │           │ │
│  │  │  │ - Guardrails │ │ - Embeddings │ │  │           │ │
│  │  │  │ - Personas   │ │ - Retrieval  │ │  │           │ │
│  │  │  └──────────────┘ └──────────────┘ │  │           │ │
│  │  │  ┌──────────────┐ ┌──────────────┐ │  │           │ │
│  │  │  │ Safety       │ │ Reminder     │ │  │           │ │
│  │  │  │ Monitor      │ │ Service      │ │  │           │ │
│  │  │  └──────────────┘ └──────────────┘ │  │           │ │
│  │  │  ┌──────────────┐ ┌──────────────┐ │  │           │ │
│  │  │  │ CST Agent    │ │ Notification │ │  │           │ │
│  │  │  │ (Cognitive)  │ │ Service      │ │  │           │ │
│  │  │  └──────────────┘ └──────────────┘ │  │           │ │
│  │  └─────────────────────────────────────┘  │           │ │
│  └────────────────────────────────────────────┘           │ │
└───────────────────────────────────────────────────────────┘
            │                                    │
            │                                    │
┌───────────┼────────────────────────────────────┼───────────┐
│           │        Data Layer                  │           │
│  ┌────────▼──────────┐              ┌─────────▼─────────┐ │
│  │   PostgreSQL      │              │   Redis Cache     │ │
│  │   - User data     │              │   - Sessions      │ │
│  │   - Conversations │              │   - Temp data     │ │
│  │   - Memories      │              └───────────────────┘ │
│  │   - Embeddings    │                                    │
│  └───────────────────┘                                    │
└───────────────────────────────────────────────────────────┘
            │
            │
┌───────────▼───────────────────────────────────────────────┐
│                    External Services                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │  OpenAI API │  │  Twilio SMS │  │  Email (SMTP)    │  │
│  │  - GPT-4    │  │  - Alerts   │  │  - Notifications │  │
│  │  - Whisper  │  └─────────────┘  └──────────────────┘  │
│  │  - TTS      │                                          │
│  └─────────────┘                                          │
└───────────────────────────────────────────────────────────┘
```

## Data Flow: Conversation

### 1. User Message Flow

```
Patient → Frontend (Voice/Text) → WebSocket → FastAPI
                                                  ↓
                                         Safety Monitor
                                         (Check for crisis)
                                                  ↓
                                         Memory RAG Service
                                         (Retrieve context)
                                                  ↓
                                         LLM Agent
                                         (Generate response)
                                                  ↓
                                         Response → WebSocket → Frontend
                                                  ↓
                                         Database
                                         (Log conversation)
```

### 2. Crisis Detection Flow

```
User Message → Safety Monitor
                    ↓
            Crisis Detected?
                    ↓
              Yes ─────────→ Create Alert
                    ↓              ↓
                    No       Notification Service
                    ↓              ↓
              Continue       Send SMS + Email
                             to Caregivers
                                   ↓
                             Update Dashboard
```

### 3. Reminder Flow

```
Scheduled Time → Celery Background Task
                         ↓
                 Check Due Reminders
                         ↓
                 Deliver to Patient
                         ↓
                 Wait for Acknowledgment
                         ↓
                 Acknowledged? ─── No ──→ Retry (max 3)
                         │                     ↓
                        Yes              Max Retries?
                         │                     ↓
                     Complete              Escalate to
                                          Caregiver
```

## Database Schema

### Core Tables

**users**
- id, email, hashed_password, full_name, role
- phone_number, is_active, created_at

**patients**
- id, user_id, date_of_birth, dementia_stage
- sentence_complexity, speech_speed, preferred_voice
- hearing_impairment, visual_impairment
- consent flags, clinical notes

**conversations**
- id, patient_id, conversation_type
- start_time, end_time, duration_seconds
- average_sentiment, emotion_scores
- crisis_detected, flagged_for_review

**conversation_turns**
- id, conversation_id, turn_number
- speaker, text, audio_url
- sentiment, emotion, crisis flags

**memory_entries**
- id, patient_id, entry_type, title, description
- metadata (JSON), importance_score
- embedding (vector), photo_url
- reference_count, last_referenced

**reminders**
- id, patient_id, title, description
- time, days_of_week, is_recurring
- max_retry_count, escalate_to_caregiver

**safety_alerts**
- id, patient_id, alert_type, severity
- trigger_text, conversation_id
- acknowledged_at, resolved_at, notifications_sent

## Security Architecture

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Separate permissions for patients, caregivers, clinicians

### Data Protection

- TLS/SSL for all communications
- Database encryption at rest
- Field-level encryption for sensitive data
- Secure credential storage (hashed passwords)

### Audit Logging

- All API requests logged
- Conversation access tracked
- Alert acknowledgments recorded
- Data export/deletion audited

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers (can add more instances)
- Load balancer for API traffic
- Database read replicas for analytics
- Redis cluster for caching

### Performance Optimization

- Response caching for frequent queries
- Database indexes on common queries
- Connection pooling
- Async operations for external APIs

### Background Processing

- Celery workers for:
  - Reminder delivery
  - Inactivity checks
  - Sentiment analysis
  - Report generation
  - Email/SMS sending

## Monitoring & Observability

### Metrics (Prometheus)

- API response times
- Database query performance
- External API latency (OpenAI, Twilio)
- WebSocket connection count
- Memory usage, CPU usage

### Logging

- Structured JSON logs
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Separate logs for:
  - Application events
  - Security events
  - Conversation transcripts (with consent)
  - System errors

### Alerting

- System health alerts (CPU, memory, disk)
- API error rate thresholds
- Database connection failures
- External service outages

## Deployment Architecture

### Development Environment

```
localhost:3000 → Next.js (Frontend)
localhost:8000 → FastAPI (Backend)
localhost:5432 → PostgreSQL
localhost:6379 → Redis
```

### Production Environment

```
CDN → Static Assets
    ↓
Load Balancer
    ↓
┌─────────────────┬─────────────────┐
│  Web Server 1   │  Web Server 2   │
│  (Next.js)      │  (Next.js)      │
└────────┬────────┴────────┬─────────┘
         │                 │
    API Load Balancer
         │
┌────────┼─────────┬───────────────┐
│ API Server 1     │ API Server 2  │
│ (FastAPI)        │ (FastAPI)     │
└────────┬─────────┴───────┬───────┘
         │                 │
    ┌────┴─────────────────┴────┐
    │   Database Cluster        │
    │   Primary + Read Replicas │
    └───────────────────────────┘
```

## Disaster Recovery

### Backup Strategy

- Database: Daily full backups + continuous WAL archiving
- Retention: 30 days online, 1 year archive
- Conversation logs: Encrypted backups with patient consent

### Recovery Time Objectives

- Database recovery: < 1 hour (RTO)
- Data loss: < 5 minutes (RPO with WAL)
- Service restoration: < 30 minutes

## Compliance & Regulations

### HIPAA Readiness

- Business Associate Agreement (BAA) required
- PHI encryption at rest and in transit
- Access logging and audit trails
- Data retention and disposal policies

### GDPR Compliance

- Right to access personal data
- Right to erasure ("right to be forgotten")
- Data portability
- Consent management

### Medical Device Considerations

- **Current Classification**: Wellness/Assistive Technology
- **Not Claiming**: Medical diagnosis, treatment, or disease management
- **For Digital Therapeutic**: Would require FDA submission, RCTs

## Future Enhancements

### Phase 2 Features

- Multi-language support
- Family member voice recordings for prompts
- Video chat integration
- Wearable device integration (vitals monitoring)
- Mobile apps (iOS/Android)

### Phase 3 Features

- Group virtual activities
- Music therapy module
- Art therapy integration
- Integration with EHR systems
- Predictive analytics for decline patterns

### Research Opportunities

- Clinical validation studies
- Efficacy vs. traditional CST
- Cost-effectiveness analysis
- Long-term outcome tracking
