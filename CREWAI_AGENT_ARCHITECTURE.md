# CrewAI Agent Architecture Documentation

## Overview

The Memory Care Platform uses **CrewAI** framework to organize AI agents into hierarchical teams with specialized roles. This architecture ensures coordinated, intelligent, and safe interactions with patients experiencing dementia.

---

## Why CrewAI?

### Key Benefits

1. **Hierarchical Organization** - Manager agents coordinate specialist agents
2. **Role Specialization** - Each agent has specific expertise and responsibilities
3. **Team Collaboration** - Agents work together on complex tasks
4. **OpenAI Integration** - Native support for GPT-4 and GPT-3.5
5. **Tool Usage** - Agents can call tools to access database, check safety, etc.
6. **Memory & Context** - Maintains conversation history and patient context
7. **Process Control** - Sequential or hierarchical task execution

---

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    MANAGER AGENTS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐  ┌─────────────────┐  ┌──────────┐│
│  │ Care Coordinator   │  │ Storyline       │  │ Ritual   ││
│  │ (Master Manager)   │  │ Director        │  │ Orchestr.││
│  └────────────────────┘  └─────────────────┘  └──────────┘│
│         │                        │                   │     │
└─────────┼────────────────────────┼───────────────────┼─────┘
          │                        │                   │
          ▼                        ▼                   ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│ CORE AGENTS     │    │ STORYLINE       │    │ RITUAL      │
│                 │    │ AGENTS          │    │ AGENTS      │
│ • Companion     │    │ • Family Story  │    │ • Morning   │
│ • Safety        │    │ • Music DJ      │    │ • Memory    │
│ • Orientation   │    │ • Nature Guide  │    │ • Reflection│
│ • Mood Analyst  │    │ • Grandchild    │    └─────────────┘
└─────────────────┘    │ • Hobby Club    │
                       │ • Veteran       │
                       └─────────────────┘
```

---

## Agent Catalog

### 🎯 MANAGER AGENTS

#### 1. Care Coordinator (Master Manager)
**Role**: Orchestrate all patient interactions  
**Goal**: Route requests to appropriate agents, ensure seamless care experiences  
**Delegates To**: All core and specialist agents  
**LLM**: GPT-4 (precise, temperature=0.3)

**Responsibilities**:
- Assess patient needs and route to correct agent
- Monitor interaction quality
- Step in when agents need support
- Ensure consistency across sessions

---

#### 2. Storyline Director
**Role**: Manage all storyline modules  
**Goal**: Ensure each storyline creates meaningful, joyful experiences  
**Delegates To**: All storyline agents  
**LLM**: GPT-4 (precise, temperature=0.3)

**Responsibilities**:
- Quality control for storyline sessions
- Monitor engagement and satisfaction
- Optimize timing and sequencing
- Coordinate between storyline agents

---

#### 3. Ritual Orchestrator
**Role**: Manage MVP daily rituals  
**Goal**: Create consistent, comforting daily routine  
**Delegates To**: Morning, Memory Seed, Reflection agents  
**LLM**: GPT-4 (precise, temperature=0.3)

**Responsibilities**:
- Maintain ritual timing and structure
- Balance variety with predictability
- Adapt based on mood
- Protect daily rhythm of safety

---

### 💙 CORE MEMORY CARE AGENTS

#### 4. Memory Care Companion
**Role**: Primary patient interface  
**Goal**: Provide warm, supportive companionship  
**Delegation**: No (focused on direct interaction)  
**LLM**: GPT-4 (empathetic, temperature=0.8)

**Backstory**: 20 years of dementia care experience. Knows that validation matters more than factual accuracy. Uses person-centered care principles.

**Key Behaviors**:
- Never correct or test memory
- Validate emotions and experiences
- Use simple, warm language
- Recognize distress, respond with comfort

**Tools Used**:
- Patient Profile Tool
- Memory Search Tool
- Conversation History Tool
- Time Context Tool

---

#### 5. Safety & Wellbeing Monitor
**Role**: Monitor for safety concerns  
**Goal**: Detect distress, crisis situations, trigger interventions  
**Delegation**: Yes (can escalate to emergency contacts)  
**LLM**: GPT-4 (precise, temperature=0.3)

**Backstory**: Specialized in recognizing subtle distress signs, crisis indicators, and escalation patterns.

**Key Responsibilities**:
- Detect crisis language (self-harm, suicide)
- Identify severe distress or medical emergencies
- Monitor agitation levels
- Alert caregivers when appropriate

**Tools Used**:
- Safety Assessment Tool
- Mood Tracking Tool
- Patient Profile Tool

---

#### 6. Gentle Orientation Guide
**Role**: Provide reality orientation  
**Goal**: Ground in time/place without causing distress  
**Delegation**: No  
**LLM**: GPT-4 (empathetic, temperature=0.8)

**Backstory**: Understands delicate balance between grounding and respecting altered reality. Never argues with perceptions.

**Key Techniques**:
- Validation before orientation
- Context clues over direct corrections
- "You're in a safe place" vs "No, you're not at home"
- Uses familiar anchors

**Tools Used**:
- Time Context Tool
- Patient Profile Tool
- Memory Search Tool

---

#### 7. Mood & Engagement Analyst
**Role**: Analyze emotional state and patterns  
**Goal**: Provide insights for better care personalization  
**Delegation**: No  
**LLM**: GPT-4 (precise, temperature=0.3)

**Backstory**: Behavioral analyst specializing in non-verbal communication and emotional intelligence in dementia care.

**Analysis Focus**:
- Emotional states from language
- Engagement through response quality
- Mood shifts and triggers
- Activity-emotion correlations

**Tools Used**:
- Mood Tracking Tool
- Conversation History Tool
- Patient Profile Tool

---

### 📖 STORYLINE AGENTS (Marketplace Modules)

#### 8. Family Memory Storyteller
**Role**: Family Story Channel narrator  
**Goal**: Transform family photos into warm narratives  
**Delegation**: No  
**LLM**: GPT-4 (creative, temperature=0.9)

**Storyline**: Family Story Channel ($14.99/mo)

**Approach**:
- Focus on feelings over facts
- Use sensory details
- Present tense for aliveness
- Accept any version they remember

**Tools Used**:
- Storyline Content Retrieval Tool
- Patient Profile Tool
- Mood Tracking Tool

---

#### 9. Memory Music Curator
**Role**: Music Memory DJ host  
**Goal**: Select music that triggers positive memories  
**Delegation**: No  
**LLM**: GPT-4 (creative, temperature=0.9)

**Storyline**: Music Memory DJ ($9.99/mo)

**Expertise**:
- Music across decades
- Life stage matching
- Emotional response reading
- Mood-based playlists

**Tools Used**:
- Patient Profile Tool
- Mood Tracking Tool
- Time Context Tool

---

#### 10. Nature & Mindfulness Guide
**Role**: Virtual nature experience guide  
**Goal**: Reduce anxiety through calming nature scenes  
**Delegation**: No  
**LLM**: GPT-4 (empathetic, temperature=0.8)

**Storyline**: Nature Walks ($9.99/mo)

**Approach**:
- Slow, descriptive narration
- Sensory-rich imagery
- Simple present-moment questions
- Adaptation to energy levels

**Tools Used**:
- Patient Profile Tool
- Mood Tracking Tool
- Time Context Tool

---

#### 11. Intergenerational Communication Bridge
**Role**: Grandchild Messenger facilitator  
**Goal**: Connect grandparents and grandchildren  
**Delegation**: No  
**LLM**: GPT-4 (empathetic, temperature=0.8)

**Storyline**: Grandchild Messenger ($14.99/mo)

**Bridging Skills**:
- Simplify complex messages
- Help elders express love easily
- Create structured prompts
- Capture responses for grandkids

**Tools Used**:
- Patient Profile Tool
- Conversation History Tool

---

#### 12. Hobby Club Facilitator
**Role**: Hobby club host (gardening, sports, etc.)  
**Goal**: Affirm expertise through lifelong interests  
**Delegation**: No  
**LLM**: GPT-4 (creative, temperature=0.9)

**Storyline**: Hobby Clubs ($19.99/mo)

**Philosophy**:
- Position person as expert
- Use hobby for meaningful conversation
- Never quiz, always inquire
- Connect present to past competencies

**Tools Used**:
- Patient Profile Tool
- Memory Search Tool
- Mood Tracking Tool

---

#### 13. Veteran Service Companion
**Role**: Honor military service  
**Goal**: Explore non-traumatic service aspects  
**Delegation**: Yes (if trauma triggers appear)  
**LLM**: GPT-4 (empathetic, temperature=0.8)

**Storyline**: Service & Veteran Stories ($19.99/mo)

**Focus Areas**:
- Camaraderie, not combat
- Pride and identity
- Roles, locations, daily life
- PTSD trigger awareness

**Tools Used**:
- Patient Profile Tool
- Safety Assessment Tool
- Memory Search Tool

---

### 🌅 RITUAL AGENTS (MVP Daily Rituals)

#### 14. Morning Ritual Guide
**Role**: Good morning ritual facilitator  
**Goal**: Set calm, secure tone for the day  
**Delegation**: No  
**LLM**: GPT-4 (empathetic, temperature=0.8)

**Ritual**: Good Morning (MVP Mode)

**Ritual Elements**:
- Gentle awakening and orientation
- Warm, familiar greeting
- Positive framing
- Brief expectations overview

**Tools Used**:
- Time Context Tool
- Patient Profile Tool
- Mood Tracking Tool

---

#### 15. Memory Seed Cultivator
**Role**: Memory seed ritual guide  
**Goal**: Explore one memory with warmth, no testing  
**Delegation**: No  
**LLM**: GPT-4 (creative, temperature=0.9)

**Ritual**: Memory Seed (MVP Mode)

**Method**:
- Present memory as gift
- Invite response without requiring
- Follow their lead
- Focus on feelings, not facts

**Tools Used**:
- Memory Seed Retrieval Tool
- Patient Profile Tool
- Mood Tracking Tool

---

#### 16. Reflective Listening Companion
**Role**: Gentle reflection ritual host  
**Goal**: Validate feelings, create safe emotional space  
**Delegation**: Yes (if severe distress)  
**LLM**: GPT-4 (empathetic, temperature=0.8)

**Ritual**: Gentle Reflection (MVP Mode)

**Approach**:
- Open-ended emotional invitations
- Deep validation
- Comfortable with difficult emotions
- Gentle redirection if needed

**Tools Used**:
- Patient Profile Tool
- Mood Tracking Tool
- Safety Assessment Tool

---

### 👥 CAREGIVER SUPPORT AGENTS

#### 17. Care Insights Analyst
**Role**: Generate caregiver reports  
**Goal**: Translate data into actionable insights  
**Delegation**: No  
**LLM**: GPT-4 (precise, temperature=0.3)

**Analysis Areas**:
- Engagement patterns
- Mood triggers and correlations
- Health shift indicators
- Context-aware recommendations

**Tools Used**:
- Mood Tracking Tool
- Conversation History Tool
- Patient Profile Tool

---

#### 18. Personalization Advisor
**Role**: Recommend storylines and activities  
**Goal**: Suggest what will resonate with individual  
**Delegation**: No  
**LLM**: GPT-4 (precise, temperature=0.3)

**Recommendation Factors**:
- Past engagement
- Life history and interests
- Current mood/energy
- Balance of familiarity and novelty

**Tools Used**:
- Patient Profile Tool
- Mood Tracking Tool
- Memory Search Tool

---

#### 19. Content Quality Guardian
**Role**: Review family uploads  
**Goal**: Ensure appropriate, high-quality content  
**Delegation**: No  
**LLM**: GPT-4 (precise, temperature=0.3)

**Review Criteria**:
- Photo quality and clarity
- Emotional appropriateness
- Complexity level
- Privacy and dignity

**Tools Used**:
- Storyline Content Retrieval Tool

---

## Crew Configurations

### 1. Patient Interaction Crew

**Process**: Hierarchical  
**Manager**: Care Coordinator  
**Members**:
- Memory Care Companion
- Safety Monitor
- Orientation Guide
- Mood Analyst

**Use Cases**:
- General patient conversations
- Check-ins
- Comprehensive mode interactions

---

### 2. Storyline Execution Crew

**Process**: Hierarchical  
**Manager**: Storyline Director  
**Members** (varies by storyline type):
- Specific Storyline Agent (Family Story, Music DJ, etc.)
- Mood Analyst
- Safety Monitor

**Use Cases**:
- Running purchased storyline sessions
- Family Story Channel, Music DJ, Nature Walks, etc.

---

### 3. Daily Ritual Crew

**Process**: Hierarchical  
**Manager**: Ritual Orchestrator  
**Members**:
- Specific Ritual Agent (Morning, Memory Seed, Reflection)
- Mood Analyst
- Safety Monitor

**Use Cases**:
- MVP daily ritual sessions
- Predictable morning/memory/reflection routines

---

### 4. Caregiver Insights Crew

**Process**: Sequential (builds on previous)  
**Members** (in order):
1. Mood & Engagement Analyst
2. Personalization Advisor
3. Care Insights Analyst

**Use Cases**:
- Weekly/monthly caregiver reports
- Engagement analytics
- Recommendations for improvement

---

### 5. Content Review Crew

**Process**: Sequential  
**Members**:
- Content Quality Guardian

**Use Cases**:
- Reviewing family-uploaded photos/memories
- Ensuring content appropriateness

---

## Tools Available to Agents

### 1. Patient Profile Tool
**What**: Retrieves full patient profile  
**Used By**: All agents  
**Returns**: Name, stage, preferences, life history, triggers

### 2. Memory Search Tool
**What**: Searches patient memories  
**Used By**: Companion, Hobby Club, Veteran agents  
**Returns**: Relevant memory entries

### 3. Memory Seed Retrieval Tool
**What**: Gets simple memory seeds (MVP)  
**Used By**: Memory Seed ritual agent  
**Returns**: Family members, photos, descriptions

### 4. Conversation History Tool
**What**: Recent conversation messages  
**Used By**: Companion, Analyst agents  
**Returns**: Last N messages with timestamps

### 5. Safety Assessment Tool
**What**: Analyzes message for safety concerns  
**Used By**: Safety Monitor, all managers  
**Returns**: Risk level + recommended actions

### 6. Storyline Content Retrieval Tool
**What**: Gets family-uploaded content  
**Used By**: Storyline agents  
**Returns**: Photos, memories with family guidance

### 7. Mood Tracking Tool
**What**: Recent mood patterns  
**Used By**: Analysts, managers  
**Returns**: Mood tags, trends, recommendations

### 8. Time Context Tool
**What**: Current time and contextual info  
**Used By**: Morning ritual, orientation agents  
**Returns**: Time, date, time-of-day suggestions

---

## LLM Configurations

### Empathetic LLM (Patient-Facing)
- **Model**: GPT-4
- **Temperature**: 0.8 (warm, natural)
- **Max Tokens**: 500
- **Use**: Companion, Orientation, Rituals, most Storylines

### Precise LLM (Analytical)
- **Model**: GPT-4
- **Temperature**: 0.3 (focused, consistent)
- **Max Tokens**: 1000
- **Use**: Safety Monitor, Analysts, Managers

### Creative LLM (Storytelling)
- **Model**: GPT-4
- **Temperature**: 0.9 (highly creative)
- **Max Tokens**: 800
- **Use**: Family Story, Music DJ, Memory Seed

### Fast LLM (Simple Tasks)
- **Model**: GPT-3.5-turbo
- **Temperature**: 0.7
- **Max Tokens**: 300
- **Use**: Quick checks, simple responses

---

## Integration with Application

### Service Layer (`agent_service.py`)

```python
from app.agents.agent_service import AgentService

# In routes
async def handle_message(patient_id: int, message: str):
    service = AgentService(db)
    result = await service.handle_patient_message(
        patient_id=patient_id,
        message=message
    )
    return result
```

### Quick Access Functions

```python
from app.agents.agent_service import (
    process_patient_message,
    execute_storyline,
    execute_ritual,
    generate_insights
)

# Patient message
response = await process_patient_message(db, patient_id, "Hello")

# Storyline
session = await execute_storyline(db, subscription_id, "family_story_channel")

# Ritual
ritual = await execute_ritual(db, patient_id, "good_morning")

# Insights
report = await generate_insights(db, patient_id, "last_week")
```

---

## Example: Patient Conversation Flow

```
1. Patient sends message: "I want to go home"

2. Care Coordinator receives message
   ↓
3. Uses Patient Profile Tool → Gets context
   ↓
4. Uses Safety Assessment Tool → Checks for crisis
   ↓
5. Determines: Needs Companion + Orientation
   ↓
6. Companion Agent generates validating response:
   "I understand you're thinking about home. Home is 
    important to you. You're safe here with me."
   ↓
7. Orientation Agent adds gentle grounding:
   "It's Tuesday afternoon. Your daughter will visit 
    this evening."
   ↓
8. Mood Analyst tags mood: "confused, yearning"
   ↓
9. Safety Monitor: "Clear - no immediate concerns"
   ↓
10. Response sent to patient + logged
```

---

## Testing Agents

### Unit Tests

```python
# Test individual agent creation
def test_companion_agent():
    agent = MemoryCareAgents.companion_agent()
    assert agent.role == "Memory Care Companion"
    assert agent.llm is not None

# Test crew creation
def test_patient_crew():
    crew = CrewFactory.get_patient_interaction_crew()
    assert len(crew.agents) == 5  # Coordinator + 4 agents
```

### Integration Tests

```python
# Test full conversation flow
async def test_conversation_flow():
    service = AgentService(db)
    result = await service.handle_patient_message(
        patient_id=1,
        message="I'm feeling confused"
    )
    assert "response" in result
    assert result["safety_level"] in ["clear", "monitor"]
```

---

## Performance Considerations

### Caching
- Crew instances are cached to avoid recreation
- Patient profiles cached for session duration
- Tool results cached within single interaction

### Async Execution
- All agent calls are async to avoid blocking
- Uses thread pool for CrewAI execution
- Parallel tool calls where possible

### Token Management
- Different token limits per agent type
- Conversation history limited to last 5-10 messages
- Memory search results limited

---

## Safety Protocols

### Crisis Detection
1. Safety Monitor analyzes every message
2. Crisis keywords trigger immediate alerts
3. Manager escalates to emergency contacts
4. Conversation paused until caregiver intervention

### Boundaries
- All agents identify as virtual companions
- No impersonation of real people
- Clear about AI limitations
- Transparency about capabilities

---

## Future Enhancements

### Planned Agent Additions
- **Translation Agent** - Multi-language support
- **Cultural Liaison Agent** - Cultural sensitivity
- **Activity Scheduler Agent** - Optimize timing
- **Group Social Agent** - Multi-patient sessions

### Planned Tools
- **Calendar Integration Tool**
- **Photo Analysis Tool** (computer vision)
- **Voice Tone Analysis Tool**
- **External API Tools** (weather, news)

---

## Summary

**20 specialized agents** organized into **5 crews** working collaboratively to provide:
- Compassionate patient interaction
- Engaging storyline experiences
- Comforting daily rituals
- Actionable caregiver insights
- Content quality assurance

All powered by **OpenAI GPT-4** with **CrewAI orchestration** and **8 custom tools** for database access and safety monitoring.

**Result**: Scalable, intelligent, safe memory care platform with agent specialization and hierarchical coordination.
