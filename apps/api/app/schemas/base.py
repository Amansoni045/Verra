from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    """Standardized success response envelope for all API endpoints."""
    success: bool = True
    message: str = ""
    data: Optional[T] = None

class ErrorResponse(BaseModel):
    """Standardized error response envelope for all API failures."""
    success: bool = False
    message: str
    error: Optional[str] = None
    code: str
