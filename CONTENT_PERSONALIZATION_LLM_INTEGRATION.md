# Content Personalization & LLM Integration Guide

## Overview

This document describes the content personalization system that allows caregivers and family members to configure storylines with photos, music, and memories. This personalized content is then used by the LLM to create ritualized, familiar experiences for people with dementia.

## Architecture

### Frontend Configuration Flow

**Location:** `/my-storylines/configuration/[id]`

Each storyline configuration page includes three types of personalization:

1. **Photo Library** (Family Story Channel, Grandchild Messenger)
2. **Music Library** (Music Memory DJ)
3. **Memory Stories** (All storylines)

### Data Structure

#### Photos
```typescript
{
  id: string
  name: string              // filename
  description: string       // "Emily graduating from college, spring 2019"
  tags: string[]           // ['family', 'milestone']
}
```

#### Songs
```typescript
{
  id: string
  title: string            // "Moon River"
  artist: string           // "Andy Williams"
  year: string             // "1961"
  notes: string            // "Her favorite song from her wedding"
}
```

#### Memories
```typescript
{
  id: string
  title: string            // "Sunday dinners"
  content: string          // Full description
  emotionalTone: string    // 'warm' | 'joyful' | 'peaceful' | 'proud'
}
```

---

## How It Works: Caregiver Flow

### Step 1: Navigate to Configuration

From `/my-storylines`:
1. Click **"Configure"** on any active storyline
2. Arrives at `/my-storylines/configuration/[id]`

### Step 2: Upload & Describe Photos (Family Storylines)

**For Family Story Channel or Grandchild Messenger:**

1. **Upload Area:**
   - Drag & drop or click to upload photos
   - Accepts JPG, PNG, GIF (max 10MB)
   - In production: uploads to cloud storage, returns URL

2. **Add Description:**
   - For each photo, caregiver adds:
     - **Description:** "Emily graduating from college, spring 2019"
     - **Tags:** family, milestone, celebration
   
3. **LLM Preview:**
   - Each photo card shows example LLM prompt:
   - *"Let's look at this photo of Emily graduating from college, spring 2019. What do you remember about this day?"*

### Step 3: Select Music (Music Storylines)

**For Music Memory DJ:**

1. **Add Favorite Song:**
   - Click "+ Add Favorite Song"
   - Enter:
     - Song title
     - Artist
     - Year
     - **Personal notes:** "Her favorite song from her wedding"

2. **LLM Preview:**
   - Each song card shows example prompt:
   - *"Let's listen to Moon River by Andy Williams. Her favorite song from her wedding. Do you remember when you first heard this song?"*

### Step 4: Describe Memories (All Storylines)

**Available for all storyline types:**

1. **Add Memory:**
   - Click "+ Add Memory or Story"
   - Fill in form:
     - **Title:** "Sunday dinners"
     - **Description:** Full narrative about the memory
     - **Emotional Tone:** Warm & Comforting / Joyful / Peaceful / Proud

2. **Example Memory:**
```
Title: Sunday dinners
Content: We always had Sunday dinner together. Mom would make pot roast 
and we'd all gather around the table. The kids would tell stories about 
their week. It was the highlight of everyone's Sunday.
Tone: Warm & Comforting
```

3. **LLM Context:**
   - Shows how memory will be used:
   - *"This memory will be used to personalize conversations and create familiar reference points during ritual sessions."*

### Step 5: Save Configuration

- Click **"Save Configuration"**
- In production: sends all data to backend API
- Backend stores in database associated with:
  - Storyline ID
  - Patient ID
  - Caregiver ID

---

## LLM Integration: Backend API Contract

### Endpoint: Generate Ritual Session

**POST** `/api/storylines/generate-session`

#### Request Body
```json
{
  "storylineId": "1",
  "patientId": "patient-123",
  "ritualPhase": "greeting",
  "sessionContext": {
    "timeOfDay": "afternoon",
    "previousSessionDate": "2024-11-28",
    "recentTopics": ["family", "garden"]
  },
  "personalizedContent": {
    "photos": [
      {
        "id": "photo-1",
        "url": "https://storage.../emily-graduation.jpg",
        "description": "Emily graduating from college, spring 2019",
        "tags": ["family", "milestone"]
      }
    ],
    "songs": [
      {
        "id": "song-1",
        "title": "Moon River",
        "artist": "Andy Williams",
        "year": "1961",
        "notes": "Her favorite song from her wedding",
        "spotifyUri": "spotify:track:..."
      }
    ],
    "memories": [
      {
        "id": "memory-1",
        "title": "Sunday dinners",
        "content": "We always had Sunday dinner together...",
        "emotionalTone": "warm"
      }
    ]
  }
}
```

#### LLM System Prompt Template

```
You are a compassionate AI companion for someone with dementia. Your role is to 
create a gentle, ritualized conversation experience.

RITUAL PHASE: {ritualPhase}
- greeting: Welcome them warmly, ask how they're feeling
- sharing: Engage with a memory or photo, validate their responses
- closing: Affirm the visit, suggest next activity

PERSONALIZED CONTENT AVAILABLE:
{if photos}
Photos:
- {photo.description} (tags: {photo.tags})
{/if}

{if songs}
Favorite Songs:
- {song.title} by {song.artist} ({song.year}) - {song.notes}
{/if}

{if memories}
Important Memories:
- {memory.title}: {memory.content} (tone: {memory.emotionalTone})
{/if}

RULES:
1. Never test memory - always validate and affirm
2. Use personalized content naturally in conversation
3. Keep responses short (2-3 sentences)
4. Match emotional tone to content
5. If they don't remember, gently share the information
6. Stay in current ritual phase

EXAMPLE (greeting phase with photo):
"Hello! It's our time to visit together. I have a wonderful photo to show you 
today - it's from Emily's college graduation in 2019. How are you feeling 
right now?"
```

#### Response Body
```json
{
  "utterance": "Hello! It's our time to visit together. I have a wonderful photo to show you today - it's from Emily's college graduation in 2019. How are you feeling right now?",
  "visualContent": {
    "type": "photo",
    "url": "https://storage.../emily-graduation.jpg",
    "caption": "Emily's graduation, spring 2019"
  },
  "audioContent": {
    "type": "tts",
    "text": "Hello! It's our time to visit together...",
    "voiceSettings": {
      "rate": 0.85,
      "pitch": 1.0
    }
  },
  "nextPhase": "sharing",
  "suggestedFollowUps": [
    "Tell me about that day",
    "What do you remember about Emily's graduation?",
    "That must have been a proud moment"
  ]
}
```

---

## Patient Experience: How Content Appears

### During Ritual Session

**Phase 1: Greeting**
- Visual: Photo fades in on screen
- Audio: TTS speaks greeting + photo context
- Text: Displays in large, accessible font

**Phase 2: Sharing**
- Visual: Photo remains visible
- Audio: TTS speaks follow-up question
- Patient responds (voice or text)
- LLM generates validating response using memory context

**Phase 3: Closing**
- Visual: Gentle transition
- Audio: Affirming closing statement
- Suggests next activity (music, more photos, rest)

### Example Session Flow (Family Story Channel)

```
[GREETING - Photo appears: Emily in cap and gown]
AI: "Hello! It's our time to visit together. I have a wonderful photo 
to show you today - it's from Emily's college graduation in 2019. 
How are you feeling right now?"

Patient: "I'm okay. Is that Emily?"

[SHARING - Photo stays visible]
AI: "Yes, that's Emily at her college graduation. You must have been 
so proud that day. What do you remember about it?"

Patient: "I don't remember much..."

AI: "That's perfectly okay. Emily graduated in the spring of 2019. 
It was a beautiful sunny day. The whole family was there to celebrate 
with her. She was so happy to see you there."

Patient: "That's nice."

[CLOSING - Photo fades gently]
AI: "I enjoyed our time together looking at Emily's graduation photo. 
We can talk again soon. Would you like to listen to some music now, 
or look at more pictures?"
```

---

## Music Storyline Integration

### Music Memory DJ with Personalized Songs

**Backend adds music playback:**

```json
{
  "utterance": "Good afternoon. It's time for our music session. I have some wonderful songs from the 1960s lined up for you today. Let's start with your favorite, Moon River by Andy Williams. This was your wedding song. Feel free to sing along.",
  "audioContent": {
    "type": "music",
    "spotifyUri": "spotify:track:...",
    "title": "Moon River",
    "artist": "Andy Williams",
    "fadeInDuration": 2000
  },
  "visualContent": {
    "type": "album_art",
    "url": "https://...",
    "overlayText": "Moon River\nAndy Williams"
  }
}
```

**Patient sees:**
- Album art or music-themed visual
- Large text: "Moon River - Andy Williams"
- Hears: AI intro → music fades in → plays for ~3 minutes

**After song:**
```
AI: "That was Moon River, your wedding song. Do you remember 
dancing to this song?"
```

---

## Memory Stories: Context Injection

### How Memories Enhance LLM Responses

**Without memory context:**
```
Patient: "I like gardens."
AI: "That's nice. Gardens are beautiful."
```

**With memory context (from caregiver):**
```
Memory: "Dad spent every summer morning in the garden. 
He loved his roses and tomatoes."

Patient: "I like gardens."
AI: "You've always loved gardens! I remember you spent every 
summer morning tending to your roses and tomatoes. What was 
your favorite thing to grow?"
```

### Emotional Tone Matching

Memories include emotional tone tags that guide LLM response style:

- **Warm:** Gentle, affirming, family-focused
- **Joyful:** Upbeat, celebratory, energetic
- **Peaceful:** Calm, soothing, meditative
- **Proud:** Affirming accomplishments, recognizing achievements

---

## Technical Implementation Notes

### Frontend State Management

Current implementation uses React `useState` for demo purposes.

**Production recommendations:**
- Use React Context or Redux for cross-component state
- Persist to localStorage for offline editing
- Sync to backend on save

### File Upload Flow

**Current:** Mock upload UI

**Production implementation:**
1. User selects file
2. Frontend uploads to cloud storage (S3, Cloudinary)
3. Receives back URL
4. Stores URL + metadata in database
5. LLM receives URL in context

### Database Schema

**Storyline Configuration Table:**
```sql
CREATE TABLE storyline_configurations (
  id UUID PRIMARY KEY,
  storyline_id INT,
  patient_id UUID,
  caregiver_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE storyline_photos (
  id UUID PRIMARY KEY,
  config_id UUID REFERENCES storyline_configurations(id),
  url TEXT,
  description TEXT,
  tags TEXT[],
  uploaded_at TIMESTAMP
);

CREATE TABLE storyline_songs (
  id UUID PRIMARY KEY,
  config_id UUID REFERENCES storyline_configurations(id),
  title TEXT,
  artist TEXT,
  year TEXT,
  notes TEXT,
  spotify_uri TEXT
);

CREATE TABLE storyline_memories (
  id UUID PRIMARY KEY,
  config_id UUID REFERENCES storyline_configurations(id),
  title TEXT,
  content TEXT,
  emotional_tone TEXT,
  created_at TIMESTAMP
);
```

---

## Privacy & Security Considerations

### Photo Storage
- Store in private cloud bucket
- Generate signed URLs with expiration
- Never expose raw storage URLs to client
- HIPAA-compliant storage if applicable

### Content Moderation
- Scan uploaded photos for inappropriate content
- Review memory descriptions for sensitive information
- Allow caregivers to mark content as "private" (not for LLM training)

### Data Retention
- Allow caregivers to delete content anytime
- Cascade deletes to remove from LLM context
- Export functionality for data portability

---

## Future Enhancements

### 1. AI-Assisted Content Creation
- Suggest photo descriptions based on image recognition
- Auto-tag photos with faces, locations, events
- Generate memory prompts based on photos

### 2. Voice Notes
- Allow caregivers to record voice notes about memories
- Transcribe and use in LLM context
- Play original voice during sessions for familiarity

### 3. Video Clips
- Short video messages from family members
- AI extracts key moments and transcribes
- Plays during ritual sessions

### 4. Collaborative Memory Building
- Multiple family members can contribute
- Version history for memories
- Comments and additions from siblings

### 5. Smart Scheduling
- AI suggests best times to show certain content
- Learns which photos/songs work best at different times
- Adapts ritual flow based on engagement patterns

---

## Testing the Flow

### Manual Testing Steps

1. **Navigate to configuration:**
   ```
   http://localhost:3000/my-storylines/configuration/1
   ```

2. **Verify photo section appears** (Family Story Channel)
   - See upload area
   - See 3 sample photos with descriptions
   - See LLM prompt preview on each

3. **Test memory addition:**
   - Click "+ Add Memory or Story"
   - Fill in title, description, emotional tone
   - Click "Save Memory"
   - Verify it appears in list with delete button

4. **Navigate to Music DJ:**
   ```
   http://localhost:3000/my-storylines/configuration/2
   ```

5. **Verify music section appears:**
   - See "+ Add Favorite Song" button
   - See 3 sample songs with context
   - See LLM prompt preview

### API Integration Testing

**Mock LLM endpoint for testing:**

```bash
curl -X POST http://localhost:8000/api/storylines/generate-session \
  -H "Content-Type: application/json" \
  -d '{
    "storylineId": "1",
    "patientId": "patient-123",
    "ritualPhase": "greeting",
    "personalizedContent": {
      "photos": [{
        "description": "Emily graduating from college, spring 2019",
        "tags": ["family", "milestone"]
      }]
    }
  }'
```

**Expected response:**
```json
{
  "utterance": "Hello! It's our time to visit together. I have a wonderful photo to show you today - it's from Emily's college graduation in 2019. How are you feeling right now?",
  "visualContent": {
    "type": "photo",
    "caption": "Emily's graduation, spring 2019"
  }
}
```

---

## Summary

This content personalization system creates a bridge between:

1. **Caregivers** who know the patient's history, preferences, and meaningful moments
2. **LLM** that generates gentle, ritualized conversations
3. **Patient** who experiences familiar, comforting interactions

By allowing caregivers to upload photos, select music, and describe memories, the system ensures that every ritual session is:
- **Personalized** to the individual's life story
- **Familiar** with recognizable content
- **Comforting** with appropriate emotional tone
- **Ritualized** with predictable structure

The LLM uses this rich context to create conversations that feel natural, validating, and meaningful—never testing memory, always affirming and connecting.
