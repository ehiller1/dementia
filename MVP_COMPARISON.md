# MVP vs Comprehensive System Comparison

## Key Differences

| Feature | MVP (Daily Ritual) | Comprehensive System | Strategy |
|---------|-------------------|---------------------|----------|
| **Philosophy** | Simple daily ritual | Complete care companion | MVP is subset |
| **Session Frequency** | 1x per day, fixed time | Unlimited, on-demand | Add MVP mode flag |
| **Session Duration** | Fixed 10 min | Flexible 2-60 min | Add `ritual_mode` setting |
| **Conversation Types** | 3 ritual types only | 10+ conversation types | Filter by MVP mode |
| **Memory System** | Simple "seeds" | Full knowledge graph | Add `MemorySeed` model |
| **Caregiver Dashboard** | ✅/❌ + mood only | Full analytics | Create MVP dashboard view |
| **Data Storage** | Minimal (no transcripts) | Full conversation logs | Add privacy flag |
| **Safety** | Tone rules only | Crisis detection + escalation | Keep both, MVP uses subset |
| **Interface** | One button | Full conversation UI | Create `/elder` route |

---

## What We Keep from Comprehensive System

✅ **Reusable Components:**
1. LLM Agent base (adapt prompts for rituals)
2. Safety Monitor (tone validation)
3. Notification Service (daily ritual reminders)
4. Database models (extend for MVP)
5. Authentication system
6. WebSocket infrastructure

---

## What We Build New for MVP

### 1. Daily Ritual Engine
**New Service**: `backend/app/services/ritual_engine.py`
- Schedule one ritual per day
- Track completion (✅/❌)
- No "failure" state, just retry tomorrow
- Fixed duration with gentle closing

### 2. Three Ritual Types
**Extend LLM Agent**: Add ritual-specific prompts
- **Good Morning Ritual**: Time + greeting + grounding
- **Memory Seed Conversation**: One personal memory
- **Gentle Reflection**: Feelings + validation + optional gratitude

### 3. Memory Seeds
**New Model**: `MemorySeed` (simplified from `MemoryEntry`)
- Name + short description only
- Optional photo
- Tone note ("This makes her smile")
- Reuse frequently, never test recall

### 4. Simplified Interfaces
- **Elder Interface**: `/elder` route with one "Start My Visit" button
- **MVP Dashboard**: `/caregiver/mvp` with completion calendar + mood tags

### 5. Mood Tags Only
**New Field**: `mood_tag` (calm / engaged / tired)
- No sentiment analysis scores
- Simple human-readable tags
- Caregiver-visible only

---

## Implementation Strategy

### Phase 1: Add MVP Mode (Recommended)
Both systems coexist, toggled by configuration:

```python
# .env
MVP_MODE=true  # Enables simplified ritual mode
STORE_TRANSCRIPTS=false  # Privacy-first for MVP
```

**Benefits:**
- Easy A/B testing
- Graduable feature unlock
- Single codebase

### Phase 2: MVP Models
Extend existing models:

```python
class Patient(Base):
    # Existing comprehensive fields...
    
    # MVP-specific fields
    mvp_mode = Column(Boolean, default=False)
    ritual_time = Column(Time)  # e.g., 9:00 AM
    ritual_duration_minutes = Column(Integer, default=10)
    ritual_type = Column(Enum(RitualType))  # good_morning, memory_seed, reflection
```

### Phase 3: MVP Services
New simplified services that wrap comprehensive ones:

- `RitualEngine` → uses `MemoryCareAgent` with ritual prompts
- `MemorySeedManager` → uses `MemoryRAG` with simplified schema
- `MVPAnalytics` → filters complex analytics to ✅/❌ + mood

---

## Code Reuse Map

| MVP Requirement | Existing Code to Reuse | New Code Needed |
|----------------|------------------------|-----------------|
| Daily ritual scheduling | `ReminderService` infrastructure | `RitualEngine` with daily scheduling |
| Warm opening/closing | `MemoryCareAgent.generate_response()` | Ritual-specific prompts |
| Voice interaction | WebSocket + TTS ready | None (already exists) |
| Memory seeds | `MemoryRAG` semantic search | `MemorySeed` simplified model |
| "Start My Visit" UI | Patient interface structure | One-button simplified version |
| Completion tracking | `CSTSession` model pattern | `RitualSession` model |
| Mood tags | Sentiment analysis exists | Simple 3-tag mapping |
| No transcripts | Privacy flags exist | Default to `store_transcript=false` |
| Caregiver 10-min setup | Patient creation flow | Simplified form (5 fields max) |
| Delete all data | Database cascade deletes | One-click delete endpoint |

---

## MVP-Specific Tone Rules

The MVP emphasizes **emotional validation over factual correction**. This is already partially implemented in the comprehensive system but needs stronger emphasis:

### Current System Prompt (Comprehensive)
```
You are a supportive companion for someone with dementia.
Never correct memories bluntly. Validate emotions.
```

### MVP Ritual Prompt (Enhanced)
```
You are a daily visitor who brings warmth and familiarity.

TONE RULES (MANDATORY):
1. Never correct memories, even gently
2. Never argue or challenge
3. Validate emotions over facts
4. Accept delusions without reinforcement
5. If unsure, express care: "That sounds important to you"

EXAMPLE:
Elder: "I need to pick up my kids from school."
You: "It sounds like you care deeply about them. Tell me about your kids?"

You are NOT diagnosing, NOT teaching, NOT testing memory.
You are simply being present.
```

---

## Success Metrics Mapping

| MVP Metric | Data Source | Already Tracked? |
|------------|-------------|------------------|
| % days ritual completed | `RitualSession.completed` | ✅ (via `CSTSession` pattern) |
| Weeks of continued use | User retention query | ✅ (via timestamps) |
| Caregiver stress reduction | Manual survey (not in system) | ❌ External |
| Elder willingness to return | Engagement rate | ✅ (conversation_count) |

---

## What NOT to Build (Explicit Exclusions)

Per MVP requirements, we actively **remove/hide** these from MVP mode:

❌ **Clinical diagnostics** (confusion detection, decline tracking)  
❌ **Insurance/billing** (not planned anyway)  
❌ **Deep analytics** (sentiment trends, pattern analysis)  
❌ **Smart speaker integrations** (Alexa/Google Home)  
❌ **Facility-wide admin** (multi-patient management for facilities)  
❌ **Multiple rituals per day** (hard limit: 1)  
❌ **Dynamic schedules** (fixed time only)  
❌ **Transcript viewing** (privacy-first)  
❌ **Complex charts** (only ✅/❌ calendar)  
❌ **Scores/ratings** (no numerical assessments)

---

## Recommended Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
├─────────────────────────────────────────┤
│  /elder          │  /caregiver/mvp      │  ← MVP Routes
│  (One button)    │  (Simple dashboard)  │
├──────────────────┼──────────────────────┤
│  /patient        │  /caregiver          │  ← Comprehensive Routes
│  (Full features) │  (Full analytics)    │
└─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         Backend API (FastAPI)           │
├─────────────────────────────────────────┤
│  MVP Mode Check Middleware              │
│  ├─ If mvp_mode: Filter features        │
│  └─ If comprehensive: Full features     │
├─────────────────────────────────────────┤
│  New MVP Services:                      │
│  ├─ RitualEngine                        │
│  ├─ MemorySeedManager                   │
│  └─ MVPAnalytics                        │
├─────────────────────────────────────────┤
│  Existing Services (reused):            │
│  ├─ MemoryCareAgent (ritual prompts)   │
│  ├─ SafetyMonitor (tone validation)    │
│  └─ NotificationService (reminders)    │
└─────────────────────────────────────────┘
```

---

## Migration Path: Comprehensive → MVP

If a patient starts in MVP and wants more features:

1. Flip `mvp_mode = False` in database
2. All existing data still valid
3. Unlock full conversation types
4. Enable transcript viewing
5. Show full analytics

**Data compatibility**: 100% (MVP is subset)

---

## One-Line Product Definitions

**MVP**: *A daily conversational ritual that gives elders with memory loss a reason to show up each day—and gives caregivers peace of mind.*

**Comprehensive**: *An AI-powered memory care companion providing 24/7 support, cognitive stimulation, safety monitoring, and caregiver relief for dementia patients.*

---

## Next Steps

1. ✅ Create MVP configuration flags
2. ✅ Build `RitualEngine` service
3. ✅ Add `MemorySeed` model
4. ✅ Create `/elder` one-button interface
5. ✅ Build `/caregiver/mvp` simple dashboard
6. ✅ Add ritual-specific LLM prompts
7. ✅ Implement mood tagging (3 tags)
8. ✅ Add "minimal data" privacy mode
9. ✅ Create MVP setup wizard (< 10 min)
10. ✅ Document mode switching

**Timeline Estimate**: 2-3 days to add MVP mode to existing comprehensive system.
