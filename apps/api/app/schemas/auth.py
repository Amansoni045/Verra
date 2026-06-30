import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    """Pydantic schema for validation of user registration requests."""
    email: str = Field(..., description="Unique email address.")
    password: str = Field(..., min_length=8, max_length=100, description="Minimum 8 character secure password.")

class UserLogin(BaseModel):
    """Pydantic schema for validation of login requests."""
    email: str = Field(..., description="Registered email address.")
    password: str = Field(..., description="Account password.")
    remember_me: bool = Field(default=False, description="Extend session validity length.")

class UserOut(BaseModel):
    """Pydantic serialization schema for returned user details."""
    id: int
    email: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    """Pydantic serialization schema for active session tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenRefresh(BaseModel):
    """Pydantic schema to request a new access token via refresh token."""
    refresh_token: str
