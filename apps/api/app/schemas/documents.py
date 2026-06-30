import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class DocumentCreate(BaseModel):
    """Pydantic schema to validate new draft creation payloads."""
    id: Optional[str] = Field(default=None, description="Client-side generated UUID (for syncing/guest mapping).")
    title: str = Field(default="Untitled Draft", max_length=255)
    content: str = Field(default="", description="HTML document text body.")
    preview: str = Field(default="", description="Plaintext summary excerpt.")

class DocumentUpdate(BaseModel):
    """Pydantic schema to validate draft update payloads."""
    title: Optional[str] = Field(default=None, max_length=255)
    content: Optional[str] = Field(default=None)
    preview: Optional[str] = Field(default=None)
    is_favorite: Optional[bool] = Field(default=None)
    is_pinned: Optional[bool] = Field(default=None)

class DocumentOut(BaseModel):
    """Pydantic serialization schema for documents."""
    id: str
    user_id: int
    title: str
    content: str
    preview: str
    is_favorite: bool
    is_pinned: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class DocumentVersionOut(BaseModel):
    """Pydantic serialization schema for document history versions."""
    id: int
    document_id: str
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class GuestDocumentSyncItem(BaseModel):
    """Pydantic schema representing a single local guest draft to be uploaded."""
    id: str
    title: str
    content: str
    preview: str
    updatedAt: str
    createdAt: str

class GuestSyncRequest(BaseModel):
    """Pydantic schema for migrating guest drafts into user space."""
    documents: List[GuestDocumentSyncItem]
