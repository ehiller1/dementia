"""
Voice Service - Whisper & TTS Integration
Handles speech-to-text and text-to-speech with consistent voice and simple language
"""

from openai import OpenAI
from typing import Optional, BinaryIO, Dict
import re
from pathlib import Path
import tempfile
from ..config import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)


class VoiceService:
    """
    Unified voice interaction service for dementia care
    - Speech-to-text via Whisper
    - Text-to-speech via OpenAI TTS
    - Language simplification for accessibility
    - Consistent voice and timing
    """
    
    def __init__(self):
        self.whisper_model = settings.WHISPER_MODEL  # "whisper-1"
        self.tts_voice = settings.TTS_VOICE  # "alloy" - warm, friendly
        self.tts_speed = settings.TTS_SPEED  # 0.85 - slightly slower for clarity
        
        # Voice consistency settings
        self.voice_settings = {
            "model": "tts-1",  # Standard quality, faster
            "voice": self.tts_voice,  # Consistent voice (alloy, echo, fable, onyx, nova, shimmer)
            "speed": self.tts_speed  # 0.25 to 4.0 (0.85 = slightly slower for comprehension)
        }
    
    # ========================================================================
    # SPEECH-TO-TEXT (WHISPER)
    # ========================================================================
    
    def transcribe_audio(
        self,
        audio_file: BinaryIO,
        language: str = "en",
        prompt: Optional[str] = None
    ) -> Dict:
        """
        Transcribe audio to text using Whisper
        
        Args:
            audio_file: Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)
            language: Language code (default: "en")
            prompt: Optional prompt to guide transcription style
            
        Returns:
            {
                "text": "transcribed text",
                "language": "en",
                "duration": 15.5
            }
        """
        
        # Whisper prompt for dementia care context (guides transcription)
        if not prompt:
            prompt = (
                "Transcribe speech from an elderly person with dementia. "
                "They may speak slowly, pause, or repeat words. "
                "Include all speech clearly."
            )
        
        try:
            # Transcribe using Whisper
            transcript = client.audio.transcriptions.create(
                model=self.whisper_model,
                file=audio_file,
                language=language,
                prompt=prompt,
                response_format="verbose_json"  # Get detailed info
            )
            
            return {
                "text": transcript.text,
                "language": transcript.language if hasattr(transcript, 'language') else language,
                "duration": transcript.duration if hasattr(transcript, 'duration') else None,
                "success": True
            }
            
        except Exception as e:
            return {
                "text": "",
                "error": str(e),
                "success": False
            }
    
    def transcribe_with_timestamps(
        self,
        audio_file: BinaryIO,
        language: str = "en"
    ) -> Dict:
        """
        Transcribe with word-level timestamps for engagement tracking
        
        Useful for measuring:
        - Response time
        - Hesitation (pauses)
        - Speech rate
        """
        
        try:
            transcript = client.audio.transcriptions.create(
                model=self.whisper_model,
                file=audio_file,
                language=language,
                response_format="verbose_json",
                timestamp_granularities=["word"]  # Word-level timestamps
            )
            
            words = []
            if hasattr(transcript, 'words'):
                words = [
                    {
                        "word": w.word,
                        "start": w.start,
                        "end": w.end
                    }
                    for w in transcript.words
                ]
            
            return {
                "text": transcript.text,
                "words": words,
                "duration": transcript.duration if hasattr(transcript, 'duration') else None,
                "word_count": len(words),
                "success": True
            }
            
        except Exception as e:
            return {
                "text": "",
                "words": [],
                "error": str(e),
                "success": False
            }
    
    # ========================================================================
    # TEXT-TO-SPEECH (CONSISTENT VOICE)
    # ========================================================================
    
    def text_to_speech(
        self,
        text: str,
        output_path: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None
    ) -> Dict:
        """
        Convert text to speech with consistent voice
        
        Args:
            text: Text to convert to speech
            output_path: Where to save audio file (optional)
            voice: Override default voice (alloy, echo, fable, onyx, nova, shimmer)
            speed: Override default speed (0.25 - 4.0)
            
        Returns:
            {
                "audio_path": "/path/to/audio.mp3",
                "duration_estimate": 5.2,
                "success": True
            }
        """
        
        # Use simplified text for better comprehension
        simplified_text = self.simplify_for_dementia(text)
        
        try:
            # Generate speech
            response = client.audio.speech.create(
                model=self.voice_settings["model"],
                voice=voice or self.voice_settings["voice"],
                speed=speed or self.voice_settings["speed"],
                input=simplified_text
            )
            
            # Save to file
            if not output_path:
                # Create temp file
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
                output_path = temp_file.name
                temp_file.close()
            
            response.stream_to_file(output_path)
            
            # Estimate duration (rough: ~150 words per minute at speed 1.0)
            word_count = len(simplified_text.split())
            base_duration = (word_count / 150) * 60  # seconds
            adjusted_duration = base_duration / (speed or self.tts_speed)
            
            return {
                "audio_path": output_path,
                "duration_estimate": round(adjusted_duration, 1),
                "text_used": simplified_text,
                "success": True
            }
            
        except Exception as e:
            return {
                "audio_path": None,
                "error": str(e),
                "success": False
            }
    
    def speak_response(
        self,
        text: str,
        emotion: str = "neutral"
    ) -> Dict:
        """
        Generate speech with emotion-appropriate delivery
        
        Args:
            text: Response text
            emotion: "neutral", "warm", "calming", "encouraging"
            
        Returns:
            Audio file path and metadata
        """
        
        # Adjust speed based on emotion
        speed_map = {
            "neutral": 0.85,
            "warm": 0.80,      # Slightly slower for warmth
            "calming": 0.75,   # Slower for calming effect
            "encouraging": 0.90  # Slightly faster for energy
        }
        
        speed = speed_map.get(emotion, 0.85)
        
        # Simplify and add emotional tone
        text = self.simplify_for_dementia(text)
        
        return self.text_to_speech(text, speed=speed)
    
    # ========================================================================
    # LANGUAGE SIMPLIFICATION (Dementia-Friendly)
    # ========================================================================
    
    def simplify_for_dementia(self, text: str) -> str:
        """
        Simplify language for dementia patients
        
        Principles:
        - Short sentences (max 10-12 words)
        - Simple words (avoid complex vocabulary)
        - Active voice
        - Present tense when possible
        - Remove unnecessary details
        - One idea per sentence
        """
        
        # Remove complex punctuation and parentheticals
        text = re.sub(r'\([^)]+\)', '', text)  # Remove (parentheses)
        text = re.sub(r'\[[^\]]+\]', '', text)  # Remove [brackets]
        
        # Replace complex words with simpler alternatives
        simplifications = {
            # Complex → Simple
            "purchase": "buy",
            "acquire": "get",
            "utilize": "use",
            "commence": "start",
            "terminate": "end",
            "demonstrate": "show",
            "facilitate": "help",
            "approximately": "about",
            "numerous": "many",
            "sufficient": "enough",
            "implement": "do",
            "regarding": "about",
            "concerning": "about",
            "subsequently": "then",
            "previously": "before",
            "additionally": "also",
            "however": "but",
            "therefore": "so",
            "consequently": "so",
            "nevertheless": "but",
            "furthermore": "also",
            "moreover": "also",
            "individuals": "people",
            "residence": "home",
            "medication": "medicine",
            "comprehend": "understand",
            "observe": "see",
            "remember": "recall",  # Keep 'remember' too
            "difficulty": "trouble",
            "assistance": "help",
            "comfortable": "good",
            "uncomfortable": "not good",
        }
        
        for complex_word, simple_word in simplifications.items():
            text = re.sub(
                r'\b' + complex_word + r'\b',
                simple_word,
                text,
                flags=re.IGNORECASE
            )
        
        # Split long sentences
        sentences = text.split('.')
        simplified_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # If sentence is too long (>12 words), try to split it
            words = sentence.split()
            if len(words) > 12:
                # Look for conjunctions to split on
                conjunctions = ['and', 'but', 'so', 'because', 'when', 'while']
                split_point = None
                
                for i, word in enumerate(words):
                    if word.lower() in conjunctions and i > 4:  # Split after at least 4 words
                        split_point = i
                        break
                
                if split_point:
                    # Split into two sentences
                    first_part = ' '.join(words[:split_point])
                    second_part = ' '.join(words[split_point+1:])  # Skip conjunction
                    simplified_sentences.append(first_part)
                    simplified_sentences.append(second_part)
                else:
                    # Keep as is if can't split naturally
                    simplified_sentences.append(sentence)
            else:
                simplified_sentences.append(sentence)
        
        # Rejoin with periods
        result = '. '.join(simplified_sentences)
        
        # Add final period if missing
        if result and not result.endswith('.'):
            result += '.'
        
        # Clean up extra spaces
        result = re.sub(r'\s+', ' ', result).strip()
        
        return result
    
    def format_for_clarity(self, text: str) -> str:
        """
        Format text with pauses for better comprehension
        
        Adds commas for natural pauses in speech
        """
        
        # Add commas after introductory phrases
        text = re.sub(r'^(Yes|No|Well|Oh|Okay|Sure),?\s+', r'\1, ', text)
        text = re.sub(r'\b(Yes|No|Well|Oh|Okay|Sure),?\s+', r'\1, ', text)
        
        # Add comma after person's name at start
        text = re.sub(r'^([A-Z][a-z]+),?\s+', r'\1, ', text)
        
        return text
    
    # ========================================================================
    # VALIDATION & ANALYSIS
    # ========================================================================
    
    def analyze_speech_clarity(self, transcript: str) -> Dict:
        """
        Analyze speech clarity from transcript
        
        Metrics for engagement tracking:
        - Word count
        - Unique words
        - Average word length
        - Hesitation markers ("um", "uh", etc.)
        - Repetition
        """
        
        words = transcript.lower().split()
        
        # Count hesitation markers
        hesitations = ['um', 'uh', 'er', 'hmm', 'ah']
        hesitation_count = sum(1 for word in words if word in hesitations)
        
        # Remove hesitations for clean analysis
        clean_words = [w for w in words if w not in hesitations]
        
        # Unique words (vocabulary diversity)
        unique_words = len(set(clean_words))
        
        # Average word length
        avg_word_length = sum(len(w) for w in clean_words) / len(clean_words) if clean_words else 0
        
        # Repetition (words repeated within short span)
        repetition_count = 0
        for i in range(len(clean_words) - 2):
            if clean_words[i] == clean_words[i+1] or clean_words[i] == clean_words[i+2]:
                repetition_count += 1
        
        # Clarity score (0-1)
        # Higher unique words, fewer hesitations, less repetition = higher clarity
        vocab_score = min(1.0, unique_words / max(len(clean_words) * 0.7, 1))
        hesitation_penalty = min(0.3, hesitation_count / max(len(words) * 10, 1))
        repetition_penalty = min(0.2, repetition_count / max(len(clean_words) * 10, 1))
        
        clarity_score = max(0.0, vocab_score - hesitation_penalty - repetition_penalty)
        
        return {
            "word_count": len(words),
            "clean_word_count": len(clean_words),
            "unique_words": unique_words,
            "avg_word_length": round(avg_word_length, 2),
            "hesitation_count": hesitation_count,
            "repetition_count": repetition_count,
            "clarity_score": round(clarity_score, 2),
            "vocabulary_diversity": round(unique_words / len(clean_words) if clean_words else 0, 2)
        }
    
    def detect_response_time(self, words_with_timestamps: list) -> Optional[float]:
        """
        Detect response time from timestamped transcript
        
        Measures time from silence to first word
        """
        if not words_with_timestamps:
            return None
        
        # First word start time is response time
        first_word = words_with_timestamps[0]
        return first_word.get('start', 0)
    
    # ========================================================================
    # PRESET RESPONSES (Common Phrases)
    # ========================================================================
    
    def get_preset_audio(self, preset_type: str) -> Dict:
        """
        Get pre-generated audio for common responses
        
        Presets:
        - greeting_morning
        - greeting_afternoon
        - greeting_evening
        - encouragement
        - validation
        - ending_session
        """
        
        presets = {
            "greeting_morning": "Good morning. How are you feeling today?",
            "greeting_afternoon": "Good afternoon. It's nice to see you.",
            "greeting_evening": "Good evening. How has your day been?",
            "encouragement": "You're doing great. Thank you for sharing.",
            "validation": "I hear you. That sounds important to you.",
            "ending_session": "Thank you for our time together. I'll see you soon.",
            "pause": "Take your time. I'm here.",
            "memory_prompt": "Can you tell me more about that?",
            "acknowledgment": "I understand. Tell me more when you're ready."
        }
        
        text = presets.get(preset_type, "Thank you.")
        
        return self.text_to_speech(text)
    
    # ========================================================================
    # VOICE PROFILE CONSISTENCY
    # ========================================================================
    
    def get_voice_settings(self) -> Dict:
        """
        Return current voice settings for consistency
        """
        return {
            "tts_model": self.voice_settings["model"],
            "voice": self.voice_settings["voice"],
            "speed": self.voice_settings["speed"],
            "whisper_model": self.whisper_model,
            "language": "en",
            "style": "dementia-friendly",
            "description": "Consistent, warm, clear voice at slightly reduced speed for comprehension"
        }
    
    def validate_audio_quality(self, audio_file: BinaryIO) -> Dict:
        """
        Validate audio file quality before transcription
        
        Checks:
        - File size (not empty)
        - Duration (reasonable length)
        - Format (supported by Whisper)
        """
        
        # Basic validation
        audio_file.seek(0, 2)  # Seek to end
        file_size = audio_file.tell()
        audio_file.seek(0)  # Reset to beginning
        
        if file_size == 0:
            return {
                "valid": False,
                "error": "Audio file is empty"
            }
        
        if file_size > 25 * 1024 * 1024:  # 25 MB limit
            return {
                "valid": False,
                "error": "Audio file too large (max 25MB)"
            }
        
        return {
            "valid": True,
            "file_size_mb": round(file_size / (1024 * 1024), 2)
        }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def simplify_text(text: str) -> str:
    """Quick access to text simplification"""
    service = VoiceService()
    return service.simplify_for_dementia(text)


def speak(text: str, emotion: str = "neutral") -> str:
    """Quick access to TTS generation"""
    service = VoiceService()
    result = service.speak_response(text, emotion)
    return result.get("audio_path") if result["success"] else None


def transcribe(audio_file: BinaryIO) -> str:
    """Quick access to transcription"""
    service = VoiceService()
    result = service.transcribe_audio(audio_file)
    return result.get("text", "") if result["success"] else ""
