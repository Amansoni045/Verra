import datetime
import re
from typing import List, Optional, Tuple
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from app.db.models import User, Document, DocumentVersion, Settings, Session as UserSession
from app.core.security import hash_password
from app.schemas.auth import UserRegister
from app.schemas.documents import DocumentCreate, DocumentUpdate
from app.schemas.settings import SettingsUpdate

def extract_auto_title(html_content: str) -> Optional[str]:
    """Generates an intelligent document title based on text content, ignoring greetings/fillers."""
    # Strip HTML tags to get plaintext
    text = re.sub(r"<[^>]*>", " ", html_content)
    text = re.sub(r"\s+", " ", text).strip()
    
    # Split into words
    words = re.findall(r"\b\w+\b", text)
    if len(words) < 5:
        # Require a threshold of 5 words before auto-generating a title
        return None
        
    greetings = {"hi", "hello", "hey", "hii", "dear", "greetings"}
    filler = {"is", "my", "name", "a", "the", "an", "and", "or", "but", "to", "of", "in", "on", "at", "for", "with", "this", "that", "these", "those"}
    
    meaningful_words = []
    for w in words:
        w_lower = w.lower()
        if w_lower not in greetings and w_lower not in filler:
            meaningful_words.append(w)
            
    # Fallback: if we filtered out too many, relax constraints to satisfy the 3-word minimum
    if len(meaningful_words) < 3:
        meaningful_words = [w for w in words if w.lower() not in greetings]
        
    if len(meaningful_words) >= 3:
        # Take first 3-4 words, capitalize them, and join
        title = " ".join(meaningful_words[:4]).title()
        return title
        
    return None

# User Operations
def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.scalars(select(User).filter(User.id == user_id, User.deleted_at == None)).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.scalars(select(User).filter(User.email == email, User.deleted_at == None)).first()

def create_user(db: Session, user_in: UserRegister) -> User:
    """Registers a new user account and provisions default writing preferences."""
    pw_hash, salt = hash_password(user_in.password)
    user = User(
        email=user_in.email,
        password_hash=pw_hash,
        salt=salt,
        provider="credentials"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create default user settings
    default_settings = Settings(
        user_id=user.id,
        temperature=0.8,
        max_words=12,
        font_size="xl",
        editor_font="serif",
        focus_level="standard"
    )
    db.add(default_settings)
    db.commit()
    
    return user

# Document Operations
def get_user_documents(db: Session, user_id: int) -> List[Document]:
    """Retrieves all non-deleted documents for the user, ordered by last update."""
    return list(db.scalars(
        select(Document)
        .filter(Document.user_id == user_id, Document.deleted_at == None)
        .order_by(Document.updated_at.desc())
    ).all())

def get_document_by_id(db: Session, doc_id: str, user_id: int) -> Optional[Document]:
    """Retrieves a specific active document for the user."""
    return db.scalars(
        select(Document)
        .filter(Document.id == doc_id, Document.user_id == user_id, Document.deleted_at == None)
    ).first()

def create_document(db: Session, user_id: int, doc_in: DocumentCreate) -> Document:
    """Creates a new document, automatically generating the title if not provided."""
    title = doc_in.title
    is_custom = False
    
    # Auto-generate title if default placeholder was passed
    if title == "Untitled Draft" or not title.strip():
        auto_title = extract_auto_title(doc_in.content)
        if auto_title:
            title = auto_title
    else:
        is_custom = True

    doc = Document(
        id=doc_in.id, # Client-side uuid support
        user_id=user_id,
        title=title,
        is_custom_title=is_custom,
        content=doc_in.content,
        preview=doc_in.preview
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def update_document(db: Session, user_id: int, doc_id: str, doc_in: DocumentUpdate) -> Optional[Document]:
    """Updates document details, performing auto-title generation if is_custom_title is false."""
    doc = get_document_by_id(db, doc_id, user_id)
    if not doc:
        return None
        
    update_data = doc_in.model_dump(exclude_unset=True)
    
    # Title updating logic
    if "title" in update_data and update_data["title"]:
        new_title = update_data["title"]
        if new_title != doc.title and new_title != "Untitled Draft":
            doc.is_custom_title = True
            doc.title = new_title
            
    # Auto-title generation triggers on content update if no custom title is set
    if "content" in update_data and not doc.is_custom_title:
        auto_title = extract_auto_title(update_data["content"])
        if auto_title:
            doc.title = auto_title
            
    # Apply remainder updates
    for field, val in update_data.items():
        if field != "title":
            setattr(doc, field, val)
            
    doc.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc

def delete_document(db: Session, user_id: int, doc_id: str) -> bool:
    """Performs a soft delete of a user document."""
    doc = get_document_by_id(db, doc_id, user_id)
    if not doc:
        return False
    doc.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return True

# Document Version History
def create_document_version(db: Session, doc_id: str, content: str) -> DocumentVersion:
    """Saves a new historical snapshot version of a document."""
    version = DocumentVersion(
        document_id=doc_id,
        content=content
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version

def get_document_versions(db: Session, doc_id: str, user_id: int) -> List[DocumentVersion]:
    """Retrieves the history versions of a document, verifying user ownership."""
    doc = get_document_by_id(db, doc_id, user_id)
    if not doc:
        return []
    return list(db.scalars(
        select(DocumentVersion)
        .filter(DocumentVersion.document_id == doc_id)
        .order_by(DocumentVersion.created_at.desc())
    ).all())

# Settings Operations
def get_user_settings(db: Session, user_id: int) -> Settings:
    """Fetches user writing configuration settings, creating defaults if missing."""
    settings_obj = db.scalars(select(Settings).filter(Settings.user_id == user_id)).first()
    if not settings_obj:
        settings_obj = Settings(
            user_id=user_id,
            temperature=0.8,
            max_words=12,
            font_size="xl",
            editor_font="serif",
            focus_level="standard"
        )
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj

def update_user_settings(db: Session, user_id: int, settings_in: SettingsUpdate) -> Settings:
    """Updates user writing configuration settings."""
    settings_obj = get_user_settings(db, user_id)
    update_data = settings_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(settings_obj, field, val)
    db.commit()
    db.refresh(settings_obj)
    return settings_obj

# Session Operations
def create_session(db: Session, token_jti: str, user_id: int, expires_at: datetime.datetime) -> UserSession:
    session = UserSession(
        id=token_jti,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def is_session_active(db: Session, token_jti: str) -> bool:
    session = db.scalars(select(UserSession).filter(UserSession.id == token_jti)).first()
    if not session:
        return False
    return session.is_active and session.expires_at > datetime.datetime.utcnow()

def revoke_session(db: Session, token_jti: str) -> bool:
    session = db.scalars(select(UserSession).filter(UserSession.id == token_jti)).first()
    if not session:
        return False
    session.is_active = False
    db.commit()
    return True
