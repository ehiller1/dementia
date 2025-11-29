from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class ProductMode(str, enum.Enum):
    """Product mode: Daily Ritual (MVP) or Comprehensive Care"""
    DAILY_RITUAL = "daily_ritual"  # MVP: Simple daily ritual
    COMPREHENSIVE = "comprehensive"  # Full feature set

class UserRole(str, enum.Enum):
    PATIENT = "patient"
    FAMILY_MEMBER = "family_member"  # NEW: Purchasing role for storylines
    FAMILY_CAREGIVER = "family_caregiver"
    PROFESSIONAL_CAREGIVER = "professional_caregiver"
    CLINICIAN = "clinician"

class DementiaStage(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class ConversationType(str, enum.Enum):
    CASUAL = "casual"
    REMINISCENCE = "reminiscence"
    ORIENTATION = "orientation"
    CST_SESSION = "cst_session"
    CHECK_IN = "check_in"

class RitualType(str, enum.Enum):
    """MVP Daily Ritual Types (Limited to 3)"""
    GOOD_MORNING = "good_morning"  # Time + greeting + grounding
    MEMORY_SEED = "memory_seed"    # One personal memory
    GENTLE_REFLECTION = "gentle_reflection"  # Feelings + validation

class MoodTag(str, enum.Enum):
    """Simple mood tags for MVP (no complex sentiment scores)"""
    CALM = "calm"
    ENGAGED = "engaged"
    TIRED = "tired"
    CONFUSED = "confused"
    AGITATED = "agitated"

class StorylineCategory(str, enum.Enum):
    """Categories for storyline marketplace modules"""
    FAMILY_SPECIFIC = "family_specific"
    INTEREST_HISTORY = "interest_history"
    SENSORY_MOOD = "sensory_mood"
    DAILY_LIFE = "daily_life"
    RELATIONSHIP_LEGACY = "relationship_legacy"
    GAMES_COGNITIVE = "games_cognitive"
    FAITH_CULTURE = "faith_culture"

class StorylineTier(str, enum.Enum):
    """Pricing tiers for storylines"""
    CORE = "core"              # $9.99/mo
    INTERACTIVE = "interactive" # $14.99/mo
    SPECIALTY = "specialty"     # $19.99/mo
    BUNDLE = "bundle"          # $39.99/mo
    ONE_TIME = "one_time"      # $29.99-$99.99

class SubscriptionStatus(str, enum.Enum):
    """Status of storyline subscriptions"""
    TRIAL = "trial"            # 7-day free trial
    ACTIVE = "active"          # Paying subscription
    CANCELLED = "cancelled"    # User cancelled
    PAUSED = "paused"         # Temporarily paused
    EXPIRED = "expired"       # Trial ended, not converted

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(UserRole), nullable=False)
    phone_number = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    caregiver_relationships = relationship("CaregiverPatientRelationship", back_populates="caregiver")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    date_of_birth = Column(DateTime)
    dementia_stage = Column(Enum(DementiaStage))
    diagnosis = Column(String)
    
    # === PRODUCT MODE SELECTION ===
    product_mode = Column(Enum(ProductMode), default=ProductMode.COMPREHENSIVE)
    
    # === MVP DAILY RITUAL SETTINGS (only used in DAILY_RITUAL mode) ===
    ritual_enabled = Column(Boolean, default=False)
    ritual_time = Column(Time)  # Fixed daily time (e.g., 9:00 AM)
    ritual_duration_minutes = Column(Integer, default=10)  # Fixed 10 min for MVP
    ritual_type = Column(Enum(RitualType), default=RitualType.GOOD_MORNING)
    store_ritual_transcripts = Column(Boolean, default=False)  # Privacy-first for MVP
    
    # === COMPREHENSIVE MODE SETTINGS (existing features) ===
    # Cognitive & Accessibility Settings
    sentence_complexity = Column(Integer, default=1)  # 1=simple, 3=complex
    speech_speed = Column(Float, default=0.85)
    preferred_voice = Column(String, default="alloy")
    hearing_impairment = Column(Boolean, default=False)
    visual_impairment = Column(Boolean, default=False)
    
    # Preferences
    wake_word = Column(String, default="Hey Helper")
    preferred_topics = Column(JSON)  # List of topics
    topics_to_avoid = Column(JSON)  # List of topics to avoid
    
    # Consent & Privacy
    voice_recording_consent = Column(Boolean, default=False)
    data_sharing_consent = Column(Boolean, default=False)
    consent_date = Column(DateTime)
    
    # Clinical Notes (comprehensive mode only)
    comorbidities = Column(JSON)
    medications = Column(JSON)
    clinical_notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    memory_entries = relationship("MemoryEntry", back_populates="patient")
    memory_seeds = relationship("MemorySeed", back_populates="patient")  # MVP simplified memories
    conversations = relationship("Conversation", back_populates="patient")
    ritual_sessions = relationship("RitualSession", back_populates="patient")  # MVP daily rituals
    reminders = relationship("Reminder", back_populates="patient")
    safety_alerts = relationship("SafetyAlert", back_populates="patient")
    caregiver_relationships = relationship("CaregiverPatientRelationship", back_populates="patient")
    storyline_subscriptions = relationship("FamilyStorylineSubscription", back_populates="patient")  # Purchased storylines
    engagement_metrics = relationship("EngagementMetric", back_populates="patient")  # Detailed engagement tracking
    engagement_summaries = relationship("EngagementSummary", back_populates="patient")  # Aggregated analytics

class CaregiverPatientRelationship(Base):
    __tablename__ = "caregiver_patient_relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    relationship_type = Column(String)  # "spouse", "child", "professional", etc.
    can_view_conversations = Column(Boolean, default=True)
    can_manage_reminders = Column(Boolean, default=True)
    can_update_memory = Column(Boolean, default=True)
    emergency_contact = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    caregiver = relationship("User", back_populates="caregiver_relationships")
    patient = relationship("Patient", back_populates="caregiver_relationships")

class MemoryEntry(Base):
    __tablename__ = "memory_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Entry Type
    entry_type = Column(String)  # "person", "place", "event", "routine", "preference"
    
    # Content
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # Structured Data for Different Types
    metadata = Column(JSON)  # Flexible structure for different memory types
    # For person: {"relationship": "son", "age": 45, "occupation": "teacher"}
    # For event: {"date": "1985-06-15", "location": "Chicago", "attendees": [...]}
    # For routine: {"time": "08:00", "frequency": "daily", "steps": [...]}
    
    # Importance & Usage
    importance_score = Column(Float, default=5.0)  # 1-10 scale
    usage_frequency = Column(String, default="normal")  # "frequent", "normal", "occasional"
    last_referenced = Column(DateTime)
    reference_count = Column(Integer, default=0)
    
    # Media
    photo_url = Column(String)
    video_url = Column(String)
    audio_url = Column(String)
    
    # Embedding for RAG
    embedding = Column(JSON)  # Store as JSON array for portability
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    patient = relationship("Patient", back_populates="memory_entries")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    conversation_type = Column(Enum(ConversationType))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    duration_seconds = Column(Integer)
    
    # Conversation Metadata
    turn_count = Column(Integer, default=0)
    words_spoken = Column(Integer, default=0)
    
    # Sentiment & Emotion Analysis
    average_sentiment = Column(Float)  # -1 to 1
    dominant_emotion = Column(String)  # "happy", "sad", "anxious", "confused", etc.
    emotion_scores = Column(JSON)
    
    # Clinical Observations
    coherence_score = Column(Float)  # How coherent was the conversation?
    repetition_detected = Column(Boolean, default=False)
    confusion_detected = Column(Boolean, default=False)
    agitation_detected = Column(Boolean, default=False)
    
    # Safety Flags
    crisis_detected = Column(Boolean, default=False)
    distress_detected = Column(Boolean, default=False)
    flagged_for_review = Column(Boolean, default=False)
    review_notes = Column(Text)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    
    # Summary
    summary = Column(Text)
    key_topics = Column(JSON)
    memories_referenced = Column(JSON)  # List of memory_entry IDs
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="conversations")
    turns = relationship("ConversationTurn", back_populates="conversation")

class ConversationTurn(Base):
    __tablename__ = "conversation_turns"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    
    turn_number = Column(Integer, nullable=False)
    speaker = Column(String, nullable=False)  # "patient" or "assistant"
    
    # Content
    text = Column(Text, nullable=False)
    audio_url = Column(String)
    
    # Analysis
    sentiment = Column(Float)
    emotion = Column(String)
    contains_crisis_keyword = Column(Boolean, default=False)
    contains_distress_keyword = Column(Boolean, default=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="turns")

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Reminder Details
    title = Column(String, nullable=False)
    description = Column(Text)
    reminder_type = Column(String)  # "medication", "meal", "appointment", "hygiene", etc.
    
    # Scheduling
    time = Column(String, nullable=False)  # "08:00"
    days_of_week = Column(JSON)  # [0,1,2,3,4,5,6] for Mon-Sun
    is_recurring = Column(Boolean, default=True)
    
    # Escalation
    max_retry_count = Column(Integer, default=3)
    retry_interval_minutes = Column(Integer, default=10)
    escalate_to_caregiver = Column(Boolean, default=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    patient = relationship("Patient", back_populates="reminders")
    executions = relationship("ReminderExecution", back_populates="reminder")

class ReminderExecution(Base):
    __tablename__ = "reminder_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    reminder_id = Column(Integer, ForeignKey("reminders.id"))
    
    scheduled_time = Column(DateTime, nullable=False)
    delivered_at = Column(DateTime)
    acknowledged_at = Column(DateTime)
    
    retry_count = Column(Integer, default=0)
    escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime)
    
    status = Column(String)  # "pending", "delivered", "acknowledged", "missed", "escalated"
    
    # Relationships
    reminder = relationship("Reminder", back_populates="executions")

class SafetyAlert(Base):
    __tablename__ = "safety_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    alert_type = Column(String, nullable=False)  # "crisis", "distress", "inactivity", "fall"
    severity = Column(Enum(AlertSeverity), nullable=False)
    
    # Content
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # Context
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    trigger_text = Column(Text)
    
    # Response
    acknowledged_at = Column(DateTime)
    acknowledged_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Notifications
    notifications_sent = Column(JSON)  # List of notification records
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="safety_alerts")

class CSTSession(Base):
    __tablename__ = "cst_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Session Details
    session_type = Column(String)  # "themed_discussion", "category_fluency", "orientation", "problem_solving"
    theme = Column(String)  # "music", "hometown", "holidays", etc.
    
    # Configuration
    target_duration_minutes = Column(Integer, default=30)
    difficulty_level = Column(Integer, default=1)  # 1-3
    
    # Results
    actual_duration_minutes = Column(Integer)
    completion_status = Column(String)  # "completed", "partial", "skipped"
    
    # Performance Metrics
    engagement_score = Column(Float)  # 1-10
    correct_responses = Column(Integer, default=0)
    total_prompts = Column(Integer, default=0)
    
    # Session Content
    activities = Column(JSON)  # List of activities performed
    notes = Column(Text)
    
    scheduled_at = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)

# ============================================================================
# MVP DAILY RITUAL MODELS (Simplified for MVP Product Mode)
# ============================================================================

class MemorySeed(Base):
    """
    Simplified memory model for MVP Daily Ritual mode.
    Much simpler than MemoryEntry - just name, description, photo, and tone note.
    """
    __tablename__ = "memory_seeds"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Simple Memory Content
    name = Column(String, nullable=False)  # e.g., "Your daughter Emily"
    short_description = Column(Text)  # Brief description
    photo_url = Column(String)  # Optional photo
    
    # Tone Guidance for AI
    tone_note = Column(Text)  # e.g., "This story always makes her smile"
    
    # Usage Tracking (for rotation, not testing)
    times_used = Column(Integer, default=0)
    last_used_at = Column(DateTime)
    
    # Simple categorization
    memory_category = Column(String)  # "person", "place", "event", "hobby"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))  # Caregiver who added it
    
    # Relationships
    patient = relationship("Patient", back_populates="memory_seeds")

class RitualSession(Base):
    """
    Tracks daily ritual sessions for MVP mode.
    Much simpler than Conversation - just completion status and mood tag.
    """
    __tablename__ = "ritual_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    
    # Session Details
    ritual_type = Column(Enum(RitualType), nullable=False)
    scheduled_date = Column(DateTime, nullable=False)  # The day it was scheduled for
    
    # Simple Tracking (MVP: No complex analytics)
    completed = Column(Boolean, default=False)  # ✅ or ❌
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    duration_seconds = Column(Integer)
    
    # MVP Simple Mood Tag (not sentiment score)
    mood_tag = Column(Enum(MoodTag))  # calm, engaged, tired, confused, agitated
    
    # Memory Seed Used (if ritual type was MEMORY_SEED)
    memory_seed_id = Column(Integer, ForeignKey("memory_seeds.id"))
    
    # Minimal Content (only if store_ritual_transcripts enabled)
    summary = Column(Text)  # Brief summary, not full transcript
    transcript = Column(Text)  # Full transcript (only if privacy settings allow)
    
    # Session Ended Naturally or Early
    ended_by_user = Column(Boolean, default=False)  # Did they say "I'm tired"?
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="ritual_sessions")

# ============================================================================
# STORYLINE MARKETPLACE MODELS (Optional Add-On Modules)
# ============================================================================

class Storyline(Base):
    """
    Catalog of purchasable storylines (marketplace modules).
    Each storyline is a specialized interactive experience.
    """
    __tablename__ = "storylines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "Family Story Channel"
    slug = Column(String, unique=True, nullable=False)  # "family-story-channel"
    description = Column(Text)
    long_description = Column(Text)  # Detailed marketing copy
    category = Column(Enum(StorylineCategory), nullable=False)
    tier = Column(Enum(StorylineTier), nullable=False)
    
    # Pricing
    price_monthly = Column(Float)  # Recurring subscription
    price_onetime = Column(Float)  # One-time purchase (null if subscription only)
    
    # Marketing Assets
    preview_video_url = Column(String)
    thumbnail_url = Column(String)
    hero_image_url = Column(String)
    benefits = Column(JSON)  # List of key benefits ["Upload unlimited photos", ...]
    testimonials = Column(JSON)  # Customer testimonials with names/quotes
    
    # Requirements & Configuration
    requires_family_content = Column(Boolean, default=False)
    setup_time_minutes = Column(Integer)  # Estimated setup time
    configuration_schema = Column(JSON)  # What data family needs to provide
    
    # Technical Specifications
    agent_type = Column(String)  # Which agent class handles this storyline
    session_duration_minutes = Column(Integer, default=10)
    supports_multiplayer = Column(Boolean, default=False)
    
    # Availability
    is_active = Column(Boolean, default=True)
    release_date = Column(DateTime)
    featured = Column(Boolean, default=False)
    featured_order = Column(Integer)  # Display order when featured
    
    # Analytics (aggregated across all users)
    total_purchases = Column(Integer, default=0)
    total_subscriptions = Column(Integer, default=0)
    avg_engagement_score = Column(Float)
    avg_trial_to_paid_rate = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions = relationship("FamilyStorylineSubscription", back_populates="storyline")

class FamilyStorylineSubscription(Base):
    """
    Tracks which storylines a family has purchased/subscribed to.
    One subscription per patient per storyline.
    """
    __tablename__ = "family_storyline_subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    storyline_id = Column(Integer, ForeignKey("storylines.id"))
    purchased_by = Column(Integer, ForeignKey("users.id"))  # Family member who purchased
    
    # Subscription Status
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIAL)
    subscription_type = Column(String, default="monthly")  # monthly, annual, onetime
    
    # Dates
    started_at = Column(DateTime, default=datetime.utcnow)
    trial_ends_at = Column(DateTime)  # 7-day free trial end date
    next_billing_date = Column(DateTime)
    cancelled_at = Column(DateTime)
    paused_at = Column(DateTime)
    
    # Payment
    amount_paid = Column(Float)  # Total amount paid to date
    currency = Column(String, default="USD")
    stripe_subscription_id = Column(String, unique=True)  # Stripe subscription ID
    stripe_customer_id = Column(String)  # Stripe customer ID
    last_payment_date = Column(DateTime)
    last_payment_amount = Column(Float)
    
    # Configuration (family-provided content and settings)
    configuration_data = Column(JSON)  # Storyline-specific settings
    is_configured = Column(Boolean, default=False)
    setup_completed_at = Column(DateTime)
    
    # Schedule (when to run this storyline)
    schedule_enabled = Column(Boolean, default=True)
    schedule_frequency = Column(String)  # "daily", "3x_weekly", "on_demand"
    schedule_time = Column(Time)  # Preferred time of day
    schedule_days = Column(JSON)  # ["monday", "wednesday", "friday"] or null for daily
    
    # Usage & Analytics
    total_sessions = Column(Integer, default=0)
    completed_sessions = Column(Integer, default=0)
    last_used_at = Column(DateTime)
    avg_session_duration = Column(Float)
    engagement_score = Column(Float)  # 0-100 based on completion, mood, etc.
    
    # Family Notes
    family_notes = Column(Text)  # Private notes from family about this storyline
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="storyline_subscriptions")
    storyline = relationship("Storyline", back_populates="subscriptions")
    purchaser = relationship("User", foreign_keys=[purchased_by])
    sessions = relationship("StorylineSession", back_populates="subscription")
    content = relationship("StorylineContent", back_populates="subscription")

class StorylineSession(Base):
    """
    Individual storyline interaction sessions.
    Tracks each time a storyline is used.
    """
    __tablename__ = "storyline_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("family_storyline_subscriptions.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    storyline_id = Column(Integer, ForeignKey("storylines.id"))
    
    # Session Details
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    duration_seconds = Column(Integer)
    completed = Column(Boolean, default=False)
    
    # How Session Started
    triggered_by = Column(String)  # "schedule", "patient", "caregiver", "ritual_rotation"
    
    # Content Used in This Session
    content_items_used = Column(JSON)  # List of content IDs used (photos, memories, etc.)
    
    # Engagement Metrics
    mood_before = Column(String)  # Mood tag before session
    mood_after = Column(String)   # Mood tag after session
    engagement_level = Column(Integer)  # 1-5 scale (1=low, 5=high)
    patient_initiated = Column(Boolean, default=False)
    ended_by_patient = Column(Boolean, default=False)
    
    # Interaction Counts
    agent_messages_count = Column(Integer, default=0)
    patient_responses_count = Column(Integer, default=0)
    positive_reactions = Column(Integer, default=0)  # Smiles, laughter detected
    
    # Session Outcomes
    session_summary = Column(Text)  # Brief AI-generated summary
    highlights = Column(JSON)  # Key moments ["Patient smiled at photo of Emily", ...]
    issues_encountered = Column(JSON)  # Any problems ["Audio quality poor", ...]
    
    # Privacy (transcript only if permitted)
    transcript = Column(Text)  # Full conversation transcript
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    subscription = relationship("FamilyStorylineSubscription", back_populates="sessions")

class StorylineContent(Base):
    """
    Family-uploaded content for storylines.
    Photos, audio clips, text memories, videos, etc.
    """
    __tablename__ = "storyline_content"
    
    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("family_storyline_subscriptions.id"))
    uploaded_by = Column(Integer, ForeignKey("users.id"))  # Family member
    
    # Content Type & Files
    content_type = Column(String, nullable=False)  # photo, audio, video, text_memory
    file_url = Column(String)  # S3 URL or similar
    thumbnail_url = Column(String)
    file_size_bytes = Column(Integer)
    duration_seconds = Column(Integer)  # For audio/video
    
    # Metadata (family provides)
    title = Column(String, nullable=False)
    description = Column(Text)
    people_in_content = Column(JSON)  # ["Emily (daughter)", "Sam (grandson)"]
    location = Column(String)  # "Chicago", "Lake Michigan", etc.
    date_of_memory = Column(DateTime)  # Approximate date of the memory
    era = Column(String)  # "1950s", "1980s", etc.
    
    # Guidance for AI Agent
    tone_note = Column(Text)  # "This always makes her smile", "He gets emotional"
    topics_to_explore = Column(JSON)  # ["fishing", "family", "laughter"]
    topics_to_avoid = Column(JSON)  # Sensitive topics to skip
    suggested_prompts = Column(JSON)  # Questions family suggests asking
    
    # Categorization
    tags = Column(JSON)  # ["family", "outdoor", "happy", "grandchildren"]
    primary_emotion = Column(String)  # "joy", "pride", "nostalgia"
    
    # Usage Tracking
    times_used = Column(Integer, default=0)
    last_used_at = Column(DateTime)
    avg_engagement_when_used = Column(Float)  # How well does this content perform
    
    # Moderation & Quality
    approved = Column(Boolean, default=True)
    flagged = Column(Boolean, default=False)
    flag_reason = Column(String)
    quality_score = Column(Float)  # AI-assessed quality (resolution, clarity, etc.)
    
    # Status
    is_active = Column(Boolean, default=True)
    archived_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscription = relationship("FamilyStorylineSubscription", back_populates="content")
    uploader = relationship("User", foreign_keys=[uploaded_by])

# ============================================================================
# ENGAGEMENT TRACKING & ANALYTICS
# ============================================================================

class EngagementType(str, enum.Enum):
    """Types of engagement interactions"""
    VERBAL_RESPONSE = "verbal_response"
    MEMORY_RECITATION = "memory_recitation"
    VISUAL_ENGAGEMENT = "visual_engagement"
    EMOTIONAL_RESPONSE = "emotional_response"
    PHYSICAL_GESTURE = "physical_gesture"
    CONVERSATION_INITIATION = "conversation_initiation"
    QUESTION_ANSWERING = "question_answering"
    STORYTELLING = "storytelling"
    SONG_PARTICIPATION = "song_participation"
    ACTIVITY_COMPLETION = "activity_completion"


class MemoryAccuracy(str, enum.Enum):
    """Accuracy levels for memory recitation"""
    ACCURATE = "accurate"  # Correct recall
    PARTIALLY_ACCURATE = "partially_accurate"  # Some details correct
    CONFABULATED = "confabulated"  # Memory mixing/creating
    NO_RECALL = "no_recall"  # Unable to remember
    VALIDATED_FEELING = "validated_feeling"  # Factually wrong but emotionally valid


class EngagementMetric(Base):
    """
    Granular engagement tracking for each interaction.
    Captures detailed metrics for analytics dashboard.
    """
    __tablename__ = "engagement_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    
    # Session Context
    conversation_id = Column(Integer, ForeignKey("conversations.id"), index=True)
    ritual_session_id = Column(Integer, ForeignKey("ritual_sessions.id"), index=True)
    storyline_session_id = Column(Integer, ForeignKey("storyline_sessions.id"), index=True)
    
    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # ========================================================================
    # VERBAL RESPONSE METRICS
    # ========================================================================
    verbal_response_count = Column(Integer, default=0)  # Number of verbal responses
    avg_response_length_words = Column(Integer)  # Average words per response
    total_words_spoken = Column(Integer, default=0)
    response_time_seconds = Column(Float)  # Time to respond after prompt
    verbal_clarity_score = Column(Numeric(3, 2))  # 0.00-1.00 (speech clarity)
    initiated_conversation = Column(Boolean, default=False)  # Did they start talking?
    
    # ========================================================================
    # MEMORY RECITATION METRICS
    # ========================================================================
    memory_prompts_given = Column(Integer, default=0)  # How many memory prompts
    memory_responses_attempted = Column(Integer, default=0)
    memory_accuracy = Column(Enum(MemoryAccuracy))  # Overall accuracy for session
    accurate_recalls = Column(Integer, default=0)  # Count of accurate memories
    partial_recalls = Column(Integer, default=0)
    confabulations = Column(Integer, default=0)
    no_recalls = Column(Integer, default=0)
    
    # Specific memory details
    memory_names_recalled = Column(JSON)  # ["Emily", "John", "Sarah"]
    memory_events_recalled = Column(JSON)  # ["fishing trip", "wedding"]
    memory_dates_recalled = Column(JSON)  # ["1987", "June"]
    memory_places_recalled = Column(JSON)  # ["lake house", "church"]
    
    # Memory confidence
    recall_confidence_score = Column(Numeric(3, 2))  # 0.00-1.00
    hesitation_count = Column(Integer, default=0)  # "um", "I think", pauses
    
    # ========================================================================
    # VISUAL ENGAGEMENT METRICS
    # ========================================================================
    visual_cues_presented = Column(Integer, default=0)  # Photos, videos shown
    visual_cues_noticed = Column(Integer, default=0)  # Did they look/react?
    visual_engagement_duration_seconds = Column(Float)  # Total time looking
    avg_time_per_image_seconds = Column(Float)
    
    # Image-specific tracking
    images_viewed = Column(JSON)  # [{"id": 1, "duration": 45, "reaction": "smiled"}]
    favorite_images = Column(JSON)  # Images with highest engagement
    images_sparked_memory = Column(JSON)  # Images that triggered recall
    
    # Visual attention
    eye_contact_maintained = Column(Boolean)  # Looking at screen/photos
    visual_recognition_score = Column(Numeric(3, 2))  # 0.00-1.00
    pointed_at_images = Column(Boolean, default=False)
    asked_about_images = Column(Boolean, default=False)
    
    # ========================================================================
    # EMOTIONAL RESPONSE METRICS
    # ========================================================================
    primary_emotion = Column(String)  # "joy", "calm", "sadness", "confusion"
    emotional_valence = Column(Numeric(3, 2))  # -1.00 (negative) to 1.00 (positive)
    emotional_arousal = Column(Numeric(3, 2))  # 0.00 (calm) to 1.00 (excited)
    
    # Emotional indicators
    smiled_count = Column(Integer, default=0)
    laughed_count = Column(Integer, default=0)
    cried_or_teared_up = Column(Boolean, default=False)
    showed_frustration = Column(Boolean, default=False)
    showed_agitation = Column(Boolean, default=False)
    showed_contentment = Column(Boolean, default=False)
    
    # ========================================================================
    # PHYSICAL ENGAGEMENT METRICS
    # ========================================================================
    physical_gestures = Column(JSON)  # ["nodding", "pointing", "clapping"]
    reached_out_to_touch = Column(Boolean, default=False)
    leaned_forward = Column(Boolean, default=False)  # Sign of engagement
    fidgeting_noted = Column(Boolean, default=False)  # Sign of discomfort
    restlessness_score = Column(Numeric(3, 2))  # 0.00-1.00
    
    # ========================================================================
    # OVERALL ENGAGEMENT SCORES
    # ========================================================================
    overall_engagement_score = Column(Numeric(3, 2), nullable=False)  # 0.00-1.00
    attention_span_seconds = Column(Integer)  # How long stayed engaged
    distraction_count = Column(Integer, default=0)  # Times attention wandered
    
    # Quality indicators
    quality_of_interaction = Column(Numeric(3, 2))  # 0.00-1.00
    depth_of_conversation = Column(Numeric(3, 2))  # Superficial to deep
    reciprocity_score = Column(Numeric(3, 2))  # Two-way interaction quality
    
    # ========================================================================
    # CONTEXTUAL FACTORS
    # ========================================================================
    time_of_day = Column(String)  # "morning", "afternoon", "evening"
    session_duration_seconds = Column(Integer)
    interruptions_count = Column(Integer, default=0)
    caregiver_present = Column(Boolean, default=False)
    
    # Environmental
    location = Column(String)  # "living room", "bedroom"
    background_noise_level = Column(String)  # "quiet", "moderate", "loud"
    
    # ========================================================================
    # CONTENT EFFECTIVENESS
    # ========================================================================
    content_type_used = Column(String)  # "family_photo", "music", "memory_seed"
    content_id = Column(Integer)  # ID of photo, song, seed used
    content_effectiveness_score = Column(Numeric(3, 2))  # How well content worked
    
    # ========================================================================
    # COMPARISON & TRENDS
    # ========================================================================
    compared_to_baseline = Column(Numeric(4, 2))  # % change from baseline
    trend_direction = Column(String)  # "improving", "stable", "declining"
    
    # Notes
    notes = Column(Text)  # Additional observations
    ai_assessment = Column(Text)  # AI-generated assessment
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="engagement_metrics")
    conversation = relationship("Conversation")


class EngagementSummary(Base):
    """
    Aggregated engagement metrics by time period.
    Pre-calculated for fast dashboard loading.
    """
    __tablename__ = "engagement_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    
    # Time Period
    period_type = Column(String, nullable=False)  # "daily", "weekly", "monthly"
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False)
    
    # Aggregated Metrics
    total_sessions = Column(Integer, default=0)
    total_duration_minutes = Column(Integer, default=0)
    avg_session_duration_minutes = Column(Float)
    
    # Verbal Metrics (Averaged)
    avg_verbal_response_count = Column(Float)
    avg_words_per_session = Column(Float)
    avg_verbal_clarity = Column(Numeric(3, 2))
    conversation_initiation_rate = Column(Numeric(3, 2))  # % of times they started
    
    # Memory Metrics (Averaged)
    avg_memory_accuracy_score = Column(Numeric(3, 2))
    accurate_recall_rate = Column(Numeric(3, 2))  # % accurate
    partial_recall_rate = Column(Numeric(3, 2))
    no_recall_rate = Column(Numeric(3, 2))
    total_memories_attempted = Column(Integer, default=0)
    total_accurate_memories = Column(Integer, default=0)
    
    # Visual Metrics (Averaged)
    avg_visual_engagement_score = Column(Numeric(3, 2))
    avg_images_per_session = Column(Float)
    avg_time_per_image = Column(Float)
    visual_recognition_rate = Column(Numeric(3, 2))
    
    # Emotional Metrics
    avg_emotional_valence = Column(Numeric(3, 2))  # -1 to 1
    positive_emotion_rate = Column(Numeric(3, 2))  # % of positive emotions
    smile_frequency = Column(Float)  # Smiles per session
    distress_incidents = Column(Integer, default=0)
    
    # Overall Scores
    avg_overall_engagement = Column(Numeric(3, 2), nullable=False)
    avg_interaction_quality = Column(Numeric(3, 2))
    avg_attention_span_seconds = Column(Float)
    
    # Trends
    trend_vs_previous_period = Column(Numeric(4, 2))  # % change
    trend_direction = Column(String)  # "improving", "stable", "declining"
    
    # Best Performance
    best_time_of_day = Column(String)  # When they're most engaged
    most_effective_content_type = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="engagement_summaries")
