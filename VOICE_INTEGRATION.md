# Voice Integration - Whisper & TTS Complete Guide

## Overview

Comprehensive voice interaction system with **consistent voice, timing, and simple language** designed specifically for dementia care.

### Key Features

✅ **Speech-to-Text** - OpenAI Whisper for transcription  
✅ **Text-to-Speech** - Consistent voice output  
✅ **Language Simplification** - Dementia-friendly communication  
✅ **Engagement Tracking** - Auto-records verbal metrics  
✅ **Consistent Settings** - Same voice, same speed, same style  
✅ **Quality Analysis** - Speech clarity scoring  

---

## Voice Settings (Consistent Across Platform)

### Text-to-Speech (TTS)
- **Voice**: `alloy` - Warm, friendly, neutral tone
- **Speed**: `0.85` - Slightly slower (15% reduction) for better comprehension
- **Model**: `tts-1` - Standard quality, fast generation
- **Style**: Dementia-friendly (simplified language)

### Speech-to-Text (STT)
- **Model**: `whisper-1` - OpenAI Whisper
- **Language**: `en` (English, auto-detected)
- **Response Format**: Verbose JSON with timestamps
- **Context-Aware**: Optimized for elderly speech patterns

---

## Language Simplification

### Principles

1. **Short Sentences** - Max 10-12 words per sentence
2. **Simple Words** - Avoid complex vocabulary
3. **Active Voice** - "You did this" vs "This was done by you"
4. **Present Tense** - When possible for immediacy
5. **One Idea Per Sentence** - No compound thoughts
6. **Clear Structure** - Remove parentheticals and asides

### Word Simplifications

| Complex Word | Simple Alternative |
|--------------|-------------------|
| purchase | buy |
| utilize | use |
| commence | start |
| demonstrate | show |
| approximately | about |
| numerous | many |
| subsequently | then |
| individuals | people |
| residence | home |
| medication | medicine |
| comprehend | understand |
| assistance | help |

### Example

**Before Simplification**:
```
"I'd like to demonstrate how you can utilize this application to purchase 
some additional features that will subsequently facilitate your ability 
to comprehend the various functionalities."
```

**After Simplification**:
```
"Let me show you how to use this app. You can buy extra features. 
These will help you understand how things work."
```

---

## API Endpoints

### POST /api/voice/transcribe
**Convert speech to text**

**Form Data**:
```json
{
  "audio": <audio_file>,  // mp3, wav, m4a, etc.
  "patient_id": 1,         // Optional
  "language": "en",        // Optional, default: en
  "track_engagement": true // Optional, records metrics
}
```

**Response**:
```json
{
  "text": "I remember going fishing with my father",
  "language": "en",
  "duration": 3.5,
  "word_count": 7,
  "clarity_analysis": {
    "word_count": 7,
    "unique_words": 7,
    "hesitation_count": 0,
    "repetition_count": 0,
    "clarity_score": 0.92,
    "vocabulary_diversity": 1.0
  },
  "success": true
}
```

---

### POST /api/voice/transcribe-with-timestamps
**Transcribe with word-level timing**

Useful for measuring:
- Response time (how quickly they respond)
- Hesitation patterns (pauses)
- Speech rate analysis

**Response**:
```json
{
  "text": "I remember that",
  "words": [
    {"word": "I", "start": 0.0, "end": 0.1},
    {"word": "remember", "start": 0.15, "end": 0.65},
    {"word": "that", "start": 0.70, "end": 0.95}
  ],
  "word_count": 3,
  "duration": 0.95,
  "response_time_seconds": 0.0,
  "success": true
}
```

---

### POST /api/voice/speak
**Convert text to speech**

**Request Body**:
```json
{
  "text": "Good morning! How are you feeling today?",
  "emotion": "warm",     // neutral, warm, calming, encouraging
  "patient_id": 1        // Optional
}
```

**Response**: Audio file (MP3)
- Headers include duration estimate and simplified text used

**Emotion Speed Settings**:
- `neutral`: 0.85 (default)
- `warm`: 0.80 (slower, more comforting)
- `calming`: 0.75 (very slow, soothing)
- `encouraging`: 0.90 (slightly faster, energetic)

---

### GET /api/voice/speak-preset/{preset_type}
**Get pre-generated common phrases**

**Available Presets**:
- `greeting_morning` - "Good morning. How are you feeling today?"
- `greeting_afternoon` - "Good afternoon. It's nice to see you."
- `greeting_evening` - "Good evening. How has your day been?"
- `encouragement` - "You're doing great. Thank you for sharing."
- `validation` - "I hear you. That sounds important to you."
- `ending_session` - "Thank you for our time together. I'll see you soon."
- `pause` - "Take your time. I'm here."
- `memory_prompt` - "Can you tell me more about that?"
- `acknowledgment` - "I understand. Tell me more when you're ready."

**Example**:
```bash
GET /api/voice/speak-preset/greeting_morning
# Returns: MP3 audio file
```

---

### POST /api/voice/simplify
**Simplify text for dementia patients**

**Request**:
```json
{
  "text": "I would appreciate it if you could demonstrate how to utilize this functionality."
}
```

**Response**:
```json
{
  "original": "I would appreciate it if you could demonstrate how to utilize this functionality.",
  "simplified": "Please show me how to use this.",
  "formatted": "Please show me how to use this.",
  "original_word_count": 14,
  "simplified_word_count": 6
}
```

---

### POST /api/voice/analyze-clarity
**Analyze speech clarity**

**Form Data**:
```
text: "Um, I think I remember, uh, going to the, um, the lake house"
```

**Response**:
```json
{
  "word_count": 14,
  "clean_word_count": 11,
  "unique_words": 10,
  "avg_word_length": 4.27,
  "hesitation_count": 3,
  "repetition_count": 1,
  "clarity_score": 0.68,
  "vocabulary_diversity": 0.91
}
```

---

### GET /api/voice/settings
**Get current voice configuration**

**Response**:
```json
{
  "tts_model": "tts-1",
  "voice": "alloy",
  "speed": 0.85,
  "whisper_model": "whisper-1",
  "language": "en",
  "style": "dementia-friendly",
  "description": "Consistent, warm, clear voice at slightly reduced speed for comprehension"
}
```

---

### GET /api/voice/voices
**List available TTS voices**

**Response**:
```json
{
  "current_voice": "alloy",
  "available_voices": [
    {
      "id": "alloy",
      "description": "Neutral, balanced (current default)",
      "best_for": "General use, dementia care"
    },
    {
      "id": "nova",
      "description": "Female, warm",
      "best_for": "Friendly, conversational"
    },
    // ... more voices
  ],
  "speed_settings": {
    "current": 0.85,
    "neutral": 0.85,
    "warm": 0.80,
    "calming": 0.75,
    "encouraging": 0.90
  }
}
```

---

## Integration with Engagement Tracking

### Automatic Metric Recording

When `track_engagement=true`, transcription automatically records:

```python
{
  "verbal_response_count": 1,
  "total_words_spoken": <word_count>,
  "avg_response_length_words": <word_count>,
  "verbal_clarity_score": <0.0-1.0>,
  "hesitation_count": <count>,
  "session_duration_seconds": <duration>,
  "time_of_day": "morning|afternoon|evening"
}
```

These metrics appear in the analytics dashboard under **Verbal Response** metrics.

---

## Usage Examples

### Example 1: Basic Transcription

```python
# Frontend - Upload audio
const formData = new FormData()
formData.append('audio', audioBlob)
formData.append('patient_id', '1')
formData.append('track_engagement', 'true')

const response = await fetch('/api/voice/transcribe', {
  method: 'POST',
  body: formData
})

const result = await response.json()
console.log('Patient said:', result.text)
console.log('Clarity score:', result.clarity_analysis.clarity_score)
```

---

### Example 2: Generate Consistent Response

```python
# Backend - Generate speech response
from app.services.voice_service import VoiceService

voice = VoiceService()

# Simplify and speak
response_text = "That's a wonderful memory about fishing with your father!"
result = voice.speak_response(response_text, emotion="warm")

# Returns audio file at result['audio_path']
# Duration: ~5 seconds
# Voice: alloy, Speed: 0.80 (warm emotion)
```

---

### Example 3: Voice Conversation Loop

```python
# Complete conversation flow

# 1. Patient speaks (recorded audio)
audio_file = open('patient_speech.mp3', 'rb')
transcript = voice.transcribe_audio(audio_file)

print(f"Patient: {transcript['text']}")
# Output: "I remember going fishing"

# 2. Generate appropriate response
response_text = "Fishing sounds wonderful. Can you tell me more about that?"

# 3. Simplify for clarity
simplified = voice.simplify_for_dementia(response_text)
# Output: "Fishing sounds nice. Tell me more about it."

# 4. Convert to speech with warm emotion
audio_result = voice.speak_response(simplified, emotion="warm")

# 5. Play audio_result['audio_path'] to patient
```

---

## Voice Consistency Across Platform

### Why Consistency Matters

For dementia patients, **consistency reduces confusion**:
- ✅ Same voice = Familiar, trustworthy
- ✅ Same speed = Predictable, comprehensible  
- ✅ Same style = Reduces cognitive load

### How We Ensure Consistency

1. **Single Voice Profile**
   - All TTS uses `alloy` voice
   - Warm, neutral tone
   - No variation unless explicitly requested

2. **Controlled Speed**
   - Base speed: 0.85 (15% slower than normal)
   - Slight variations only for emotional context
   - Never exceeds 0.90 speed

3. **Automatic Simplification**
   - All text simplified before TTS
   - Complex words replaced
   - Sentences shortened
   - No jargon or technical terms

4. **Preset Phrases**
   - Common greetings pre-generated
   - Instant playback
   - No generation delay
   - Exactly same every time

---

## Speech Clarity Analysis

### Metrics Tracked

1. **Word Count** - Total words spoken
2. **Unique Words** - Vocabulary diversity
3. **Hesitation Count** - "um", "uh", "er" markers
4. **Repetition Count** - Repeated words nearby
5. **Average Word Length** - Complexity indicator
6. **Clarity Score** - Composite 0-1 score

### Clarity Score Calculation

```python
clarity_score = (
    vocabulary_diversity_score
    - hesitation_penalty
    - repetition_penalty
)
```

**Interpretation**:
- 0.90-1.00: Excellent clarity
- 0.75-0.89: Good clarity
- 0.60-0.74: Fair clarity
- Below 0.60: Low clarity (may indicate confusion)

---

## Supported Audio Formats

### Input (Transcription)
- ✅ MP3
- ✅ MP4
- ✅ MPEG
- ✅ MPGA
- ✅ M4A
- ✅ WAV
- ✅ WEBM

**Max File Size**: 25MB

### Output (TTS)
- MP3 (128kbps)
- Optimized for streaming
- Small file sizes

---

## Best Practices

### 1. Recording Patient Speech

```javascript
// Use MediaRecorder API
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm'  // Widely supported
})

const audioChunks = []
mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data)
}

mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
  
  // Send to API
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')
  formData.append('patient_id', patientId)
  formData.append('track_engagement', 'true')
  
  const response = await fetch('/api/voice/transcribe', {
    method: 'POST',
    body: formData
  })
}

// Start recording
mediaRecorder.start()

// Stop after timeout or button press
setTimeout(() => mediaRecorder.stop(), 30000)  // 30 second max
```

---

### 2. Playing TTS Response

```javascript
// Fetch audio from API
const response = await fetch('/api/voice/speak', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Good morning! How are you today?",
    emotion: "warm",
    patient_id: 1
  })
})

// Get audio blob
const audioBlob = await response.blob()
const audioUrl = URL.createObjectURL(audioBlob)

// Play audio
const audio = new Audio(audioUrl)
audio.play()

// Clean up after playing
audio.onended = () => {
  URL.revokeObjectURL(audioUrl)
}
```

---

### 3. Using Preset Phrases

```javascript
// Instant greeting - no generation delay
const audio = new Audio('/api/voice/speak-preset/greeting_morning')
audio.play()

// Validation response
const validation = new Audio('/api/voice/speak-preset/validation')
validation.play()
```

---

## Performance Optimization

### 1. Caching Presets
- All preset phrases pre-generated
- Stored server-side
- Instant response time

### 2. Streaming TTS
- Audio streams as it generates
- No wait for full generation
- Perceived faster response

### 3. Parallel Processing
- Transcribe while generating response
- Overlap operations
- Reduce total latency

---

## Error Handling

### Common Errors

**1. Audio File Too Large**
```json
{
  "detail": "Audio file too large (max 25MB)"
}
```
**Solution**: Compress audio or split into chunks

**2. Unsupported Format**
```json
{
  "detail": "Unsupported audio format"
}
```
**Solution**: Convert to MP3, WAV, or WEBM

**3. Empty Audio**
```json
{
  "detail": "Audio file is empty"
}
```
**Solution**: Verify recording captured audio

**4. Transcription Failed**
```json
{
  "text": "",
  "success": false,
  "error": "Whisper API error"
}
```
**Solution**: Check audio quality, try re-recording

---

## Integration Checklist

- [x] Whisper configured (`WHISPER_MODEL=whisper-1`)
- [x] TTS configured (`TTS_VOICE=alloy`, `TTS_SPEED=0.85`)
- [x] Voice service created (`voice_service.py`)
- [x] API routes created (`voice_routes.py`)
- [x] Routes registered in main app
- [x] Language simplification implemented
- [x] Engagement tracking integrated
- [x] Preset phrases available
- [x] Speech clarity analysis
- [ ] Frontend audio recording component
- [ ] Frontend audio playback component
- [ ] Voice conversation UI

---

## Testing

### Test Transcription
```bash
curl -X POST "http://localhost:8000/api/voice/transcribe" \
  -F "audio=@test_audio.mp3" \
  -F "patient_id=1" \
  -F "track_engagement=true"
```

### Test TTS
```bash
curl -X POST "http://localhost:8000/api/voice/speak" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you feeling today?",
    "emotion": "warm"
  }' \
  --output response.mp3
```

### Test Simplification
```bash
curl -X POST "http://localhost:8000/api/voice/simplify" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I would like to demonstrate the utilization of this application."
  }'
```

---

## Summary

**Complete voice integration** with:

✅ **Whisper Transcription** - High-quality speech-to-text  
✅ **Consistent TTS** - Same voice (alloy), same speed (0.85)  
✅ **Language Simplification** - Automatic dementia-friendly text  
✅ **Engagement Tracking** - Auto-records verbal metrics  
✅ **Clarity Analysis** - Scores speech quality  
✅ **Preset Phrases** - Instant common responses  
✅ **Multiple Emotions** - Warm, calming, encouraging tones  
✅ **API Complete** - 8 endpoints for all voice operations  

**Same time, same voice, same style, simple language** - exactly as requested! 🎤
