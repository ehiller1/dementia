from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/memorycare"
    REDIS_URL: str = "redis://localhost:6379"
    
    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    
    # Authentication
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # Safety & Monitoring
    CRISIS_KEYWORDS: str = '["suicide", "kill myself", "end it all", "want to die", "hurt myself"]'
    DISTRESS_KEYWORDS: str = '["fell", "can\'t breathe", "lost", "pain", "help me", "scared"]'
    MAX_INACTIVITY_HOURS: int = 12
    
    # Voice & Speech
    WHISPER_MODEL: str = "whisper-1"
    TTS_VOICE: str = "alloy"
    TTS_SPEED: float = 0.85
    
    # Feature Flags
    ENABLE_VOICE_RECORDING: bool = True
    ENABLE_OFFLINE_MODE: bool = True
    ENABLE_SMART_HOME_INTEGRATION: bool = False
    
    # Regulatory
    REQUIRE_EXPLICIT_CONSENT: bool = True
    LOG_RETENTION_DAYS: int = 90
    
    # MVP Mode (Simplified Daily Ritual Product)
    MVP_MODE: bool = False
    MVP_STORE_TRANSCRIPTS: bool = False
    MVP_DEFAULT_RITUAL_DURATION: int = 10
    MVP_DEFAULT_RITUAL_TIME: str = "09:00"
    
    class Config:
        env_file = ".env"
    
    @property
    def crisis_keywords_list(self) -> List[str]:
        return json.loads(self.CRISIS_KEYWORDS)
    
    @property
    def distress_keywords_list(self) -> List[str]:
        return json.loads(self.DISTRESS_KEYWORDS)

settings = Settings()
