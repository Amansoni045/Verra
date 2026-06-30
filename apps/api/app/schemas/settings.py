from typing import Optional
from pydantic import BaseModel, Field

class SettingsUpdate(BaseModel):
    """Pydantic schema to validate updates to user writing preferences."""
    temperature: Optional[float] = Field(default=None, ge=0.01, le=2.0, description="Creativity level scale.")
    max_words: Optional[int] = Field(default=None, ge=1, le=100, description="Prediction output limit.")
    font_size: Optional[str] = Field(default=None, description="Workspace typography scale.")
    editor_font: Optional[str] = Field(default=None, description="Workspace typography style.")
    focus_level: Optional[str] = Field(default=None, description="Distraction mode configuration.")

class SettingsOut(BaseModel):
    """Pydantic serialization schema for preferences payload."""
    temperature: float
    max_words: int
    font_size: str
    editor_font: str
    focus_level: str

    class Config:
        from_attributes = True
