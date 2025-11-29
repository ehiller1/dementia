# Storyline Marketplace - Quick Start Guide

## What You Now Have

### ✅ Complete Architecture
- **STORYLINE_MARKETPLACE.md** → Full system design (17 pages)
- Product vision, user roles, purchase workflow
- Database schema, pricing tiers, analytics framework
- Integration patterns for both MVP and Comprehensive modes

### ✅ Database Models (`models.py`)
1. **`Storyline`** → Marketplace catalog (229 lines)
2. **`FamilyStorylineSubscription`** → Purchase tracking (60 lines)
3. **`StorylineSession`** → Usage analytics (48 lines)
4. **`StorylineContent`** → Family uploads (57 lines)
5. **`FAMILY_MEMBER`** role added to `UserRole` enum

**Total: ~400 lines of production-ready models**

---

## Three-Tier Revenue Model

### Tier 1: Core Storylines ($9.99/mo)
Simple, standalone experiences:
- Music Memory DJ
- Nature Walks
- Comfort & Reassurance

### Tier 2: Interactive Storylines ($14.99/mo)
Requires family content:
- **Family Story Channel** ⭐ (highest priority to implement)
- Grandchild Messenger
- Family Photo Scrapbook

### Tier 3: Specialty Storylines ($19.99/mo)
Deep personalization:
- Service & Veteran Stories
- Hobby Clubs (Gardening, Sports, Cars)
- Life Timeline Tour
- Occupation Replay

---

## Implementation Roadmap

### Week 1-2: Foundation
**Goal**: Marketplace browsing & trial signup

```bash
# 1. Create marketplace API
backend/app/routes/marketplace_routes.py
  - GET /api/marketplace/storylines (list all)
  - GET /api/marketplace/storylines/{slug} (details)
  - POST /api/marketplace/start-trial/{storyline_id}
  
# 2. Seed initial storylines
backend/app/seeds/initial_storylines.py
  - Add 3-5 storylines to database
  
# 3. Build marketplace UI
frontend/app/marketplace/page.tsx
  - Browse storylines
  - View details
  - Start trials
```

### Week 3: Payment Integration
**Goal**: Convert trials to paid subscriptions

```bash
# 1. Stripe integration
backend/app/services/payment_service.py
  - Create subscriptions
  - Handle webhooks
  - Manage cancellations

# 2. Billing UI
frontend/app/marketplace/billing/page.tsx
  - Payment method management
  - Subscription status
  - Cancel/pause
```

### Week 4: First Storyline
**Goal**: Launch "Family Story Channel"

```bash
# 1. Build agent
backend/app/services/agents/family_story_channel_agent.py
  - StorylineAgent base class
  - Photo narrative generation
  - Validation-first responses

# 2. Upload wizard
frontend/app/marketplace/setup/[storyline_id]/page.tsx
  - Photo upload
  - Memory descriptions
  - Tone guidance

# 3. Integration
backend/app/services/ritual_engine.py
  - Add storyline rotation to MVP mode
  
backend/app/services/conversation_service.py
  - Add storyline option to Comprehensive mode
```

### Week 5-6: Expansion
**Goal**: Add 3-5 more storylines

Priority order:
1. Music Memory DJ
2. Nature Walks
3. Grandchild Messenger
4. Gardening Club
5. Veteran Stories

---

## Quick Implementation: Family Story Channel

### Step 1: Create Agent Class

```python
# backend/app/services/agents/family_story_channel_agent.py

from typing import List, Dict
from sqlalchemy.orm import Session
from ..models import Patient, FamilyStorylineSubscription, StorylineContent
from ..services.llm_agent import MemoryCareAgent
from openai import AsyncOpenAI

class FamilyStoryChannelAgent:
    """
    Turns family photos and memories into warm, repeatable narratives.
    """
    
    def __init__(self, db: Session, subscription: FamilyStorylineSubscription):
        self.db = db
        self.subscription = subscription
        self.patient = subscription.patient
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    def get_content_for_session(self) -> List[StorylineContent]:
        """Select 1-3 photos for today's session"""
        
        # Get all approved content
        content = self.db.query(StorylineContent).filter(
            StorylineContent.subscription_id == self.subscription.id,
            StorylineContent.is_active == True,
            StorylineContent.approved == True
        ).order_by(
            StorylineContent.last_used_at.asc().nullsfirst(),
            StorylineContent.times_used.asc()
        ).limit(3).all()
        
        return content
    
    async def generate_narrative(self, content_items: List[StorylineContent]) -> str:
        """Create warm narrative from family content"""
        
        family_descriptions = "\n\n".join([
            f"Photo {i+1}: {item.title}\n"
            f"Description: {item.description}\n"
            f"People: {', '.join(item.people_in_content or [])}\n"
            f"Family note: {item.tone_note or 'No special note'}"
            for i, item in enumerate(content_items)
        ])
        
        prompt = f"""Create a warm, 2-3 minute story for a person with dementia using these family memories:

{family_descriptions}

Requirements:
- Use simple, warm language
- Mention family member names naturally
- Focus on feelings and connection, not facts
- 3-4 short paragraphs
- End with gentle question
- Keep sentences under 15 words
- No testing or "do you remember" phrases

Story:"""
        
        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=300
        )
        
        return response.choices[0].message.content
    
    async def start_session(self) -> Dict:
        """Initialize session and return context"""
        
        content = self.get_content_for_session()
        
        if not content:
            return {
                "error": "No family content available",
                "message": "Please add some family photos first"
            }
        
        # Generate narrative
        narrative = await self.generate_narrative(content)
        
        # Update usage tracking
        for item in content:
            item.times_used += 1
            item.last_used_at = datetime.utcnow()
        self.db.commit()
        
        return {
            "storyline_type": "family_story_channel",
            "content_ids": [c.id for c in content],
            "photos": [c.file_url for c in content],
            "narrative": narrative,
            "people_mentioned": list(set([
                name for c in content 
                for name in (c.people_in_content or [])
            ]))
        }
    
    async def generate_response(
        self, 
        user_message: str, 
        session_context: Dict,
        conversation_history: List[Dict]
    ) -> str:
        """Generate agent response during story session"""
        
        system_prompt = f"""You are sharing a family story with {self.patient.user.full_name}.

Current story: {session_context['narrative']}

TONE RULES (MANDATORY):
- NEVER correct memories
- NEVER test recall ("Do you remember?")
- Validate emotions over facts
- Accept any version of the story they tell
- Keep responses under 2 sentences
- Express warmth about family

If they share their own version of events, respond with:
"That sounds wonderful. I love hearing about [topic]."
"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            *conversation_history[-5:],  # Last 5 turns
            {"role": "user", "content": user_message}
        ]
        
        response = await self.client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0.8,
            max_tokens=100
        )
        
        return response.choices[0].message.content
```

### Step 2: Add to Ritual Rotation

```python
# backend/app/services/ritual_engine.py

class RitualEngine:
    
    def select_todays_activity(self, patient_id: int) -> Dict:
        """
        Choose between base ritual types and purchased storylines.
        
        Algorithm:
        - 60% base rituals (Good Morning, Memory Seed, Gentle Reflection)
        - 40% purchased storylines
        """
        
        patient = self.db.query(Patient).filter(Patient.id == patient_id).first()
        
        # Get active storyline subscriptions
        storylines = self.db.query(FamilyStorylineSubscription).filter(
            FamilyStorylineSubscription.patient_id == patient_id,
            FamilyStorylineSubscription.status == SubscriptionStatus.ACTIVE,
            FamilyStorylineSubscription.schedule_enabled == True
        ).all()
        
        # Decide: base ritual or storyline?
        if storylines and random.random() > 0.6:  # 40% chance for storyline
            # Select least recently used storyline
            storyline = min(storylines, key=lambda s: s.last_used_at or datetime.min)
            
            return {
                "type": "storyline",
                "storyline_id": storyline.storyline_id,
                "subscription_id": storyline.id,
                "agent_type": storyline.storyline.agent_type
            }
        else:
            # Use base ritual
            return {
                "type": "base_ritual",
                "ritual_type": patient.ritual_type
            }
```

### Step 3: Marketplace API Routes

```python
# backend/app/routes/marketplace_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..database import get_db
from ..models import Storyline, FamilyStorylineSubscription, SubscriptionStatus
from ..routes.auth_routes import get_current_user

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])

@router.get("/storylines")
def list_storylines(
    category: str = None,
    featured: bool = None,
    db: Session = Depends(get_db)
):
    """Browse all available storylines"""
    
    query = db.query(Storyline).filter(Storyline.is_active == True)
    
    if category:
        query = query.filter(Storyline.category == category)
    
    if featured:
        query = query.filter(Storyline.featured == True)
        query = query.order_by(Storyline.featured_order)
    
    storylines = query.all()
    
    return [
        {
            "id": s.id,
            "name": s.name,
            "slug": s.slug,
            "description": s.description,
            "category": s.category.value,
            "tier": s.tier.value,
            "price_monthly": s.price_monthly,
            "thumbnail_url": s.thumbnail_url,
            "setup_time_minutes": s.setup_time_minutes,
            "requires_family_content": s.requires_family_content
        }
        for s in storylines
    ]

@router.get("/storylines/{slug}")
def get_storyline_details(slug: str, db: Session = Depends(get_db)):
    """Get detailed information about a storyline"""
    
    storyline = db.query(Storyline).filter(Storyline.slug == slug).first()
    
    if not storyline:
        raise HTTPException(status_code=404, detail="Storyline not found")
    
    return {
        **storyline.__dict__,
        "sample_session_url": f"/samples/{slug}.mp4"  # Preview video
    }

@router.post("/start-trial/{storyline_id}")
def start_trial(
    storyline_id: int,
    patient_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Start 7-day free trial of a storyline"""
    
    storyline = db.query(Storyline).filter(Storyline.id == storyline_id).first()
    
    if not storyline:
        raise HTTPException(status_code=404, detail="Storyline not found")
    
    # Check if already subscribed
    existing = db.query(FamilyStorylineSubscription).filter(
        FamilyStorylineSubscription.patient_id == patient_id,
        FamilyStorylineSubscription.storyline_id == storyline_id,
        FamilyStorylineSubscription.status.in_([
            SubscriptionStatus.TRIAL, 
            SubscriptionStatus.ACTIVE
        ])
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already subscribed")
    
    # Create trial subscription
    subscription = FamilyStorylineSubscription(
        patient_id=patient_id,
        storyline_id=storyline_id,
        purchased_by=current_user.id,
        status=SubscriptionStatus.TRIAL,
        trial_ends_at=datetime.utcnow() + timedelta(days=7)
    )
    
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    
    return {
        "subscription_id": subscription.id,
        "trial_ends_at": subscription.trial_ends_at,
        "next_step": "configure" if storyline.requires_family_content else "ready"
    }
```

---

## Revenue Projections

### Year 1 (Conservative)
- 1,000 patients on base product ($29/mo) = $29,000/mo
- 35% adopt 1 storyline (+$10/mo avg) = $10,150/mo
- 15% adopt 2+ storylines (+$25/mo avg) = $3,750/mo

**Total: $42,900/month = $514,800/year**

### Year 2 (Growth)
- 5,000 patients on base product = $145,000/mo
- 50% adopt 1 storyline (+$12/mo avg) = $30,000/mo
- 30% adopt 2+ storylines (+$30/mo avg) = $45,000/mo

**Total: $220,000/month = $2.64M/year**

### Upsell Multiplier: **1.5x** (50% increase in ARPU)

---

## Success Metrics to Track

### Product Adoption
- **Trial Start Rate**: % of families who start a trial
  - Target: 40% within first 3 months
- **Trial Conversion Rate**: % of trials that become paid
  - Target: 60%
- **Avg Storylines per Family**: 2.5 by month 6

### Engagement
- **Session Completion Rate**: >85% for storylines
- **Patient-Initiated Use**: 20%+ of sessions
- **Mood Improvement**: +1.5 points average

### Revenue
- **ARPU Lift**: 1.4-1.6x multiplier
- **Storyline Revenue %**: 30% of total by month 12
- **Churn Reduction**: 25% lower churn for families with storylines

---

## Next Steps

1. **Seed Initial Storylines** → Create 3-5 in database
2. **Build Marketplace UI** → Browse + trial signup
3. **Implement Payment** → Stripe integration
4. **Launch First Storyline** → Family Story Channel
5. **Add 2-3 More** → Music DJ, Nature Walks
6. **Measure & Iterate** → Track metrics, optimize

---

**The foundation is complete. Ready to build!** 🚀
