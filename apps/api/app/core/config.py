import os
from pydantic import BaseModel, Field

class Settings(BaseModel):
    """Core settings and environment validation schemas for Verra v1.0."""
    # Database and Authentication settings
    DATABASE_URL: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///verra.db"))
    JWT_SECRET: str = Field(default_factory=lambda: os.getenv("JWT_SECRET", "verra-production-secret-key-32-character-long"))
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=30)
    
    # Execution Environment settings
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)
    LOG_LEVEL: str = Field(default="INFO")
    
    # Model Weights configuration
    MODEL_PATH: str = Field(default_factory=lambda: os.getenv("MODEL_PATH", ""))

    # Autocomplete Generation configurations
    DECODING_STRATEGY: str = Field(default="top_k")
    TOP_K: int = Field(default=8)
    TEMPERATURE: float = Field(default=0.8)
    PROBABILITY_FLOOR: float = Field(default=0.01)
    
    # Completion & Stopping limits
    CONFIDENCE_THRESHOLD: float = Field(default=0.025)
    MAX_COMPLETION_WORDS: int = Field(default=12)
    MIN_INPUT_WORDS: int = Field(default=3)
    REPETITION_WINDOW: int = Field(default=4)
    
    # Beam Search configuration
    BEAM_WIDTH: int = Field(default=3)
    LENGTH_PENALTY_ALPHA: float = Field(default=0.6)

    # Quality Assessment metrics
    MIN_QUALITY_SCORE: float = Field(default=0.02)
    SENTENCE_END_BONUS: float = Field(default=0.15)
    REPETITION_PENALTY_WEIGHT: float = Field(default=0.20)
    LENGTH_PENALTY_WEIGHT: float = Field(default=0.05)

# Instantiated settings module
settings = Settings()
