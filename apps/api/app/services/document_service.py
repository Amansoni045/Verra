import datetime
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db import crud
from app.db.models import Document, DocumentVersion
from app.schemas.documents import DocumentCreate, DocumentUpdate, GuestSyncRequest

def create_user_document(db: Session, user_id: int, doc_in: DocumentCreate) -> Document:
    """Creates a new user document, setting client ID or generating a UUID."""
    if not doc_in.id:
        doc_in.id = str(uuid.uuid4())
    return crud.create_document(db, user_id, doc_in)

def get_user_document_by_id(db: Session, doc_id: str, user_id: int) -> Optional[Document]:
    return crud.get_document_by_id(db, doc_id, user_id)

def get_all_user_documents(db: Session, user_id: int) -> List[Document]:
    return crud.get_user_documents(db, user_id)

def update_user_document(db: Session, user_id: int, doc_id: str, doc_in: DocumentUpdate) -> Optional[Document]:
    """Updates a user document."""
    return crud.update_document(db, user_id, doc_id, doc_in)

def soft_delete_user_document(db: Session, user_id: int, doc_id: str) -> bool:
    return crud.delete_document(db, user_id, doc_id)

def save_document_version_background(db: Session, doc_id: str, user_id: int, current_content: str):
    """Saves a new historical version of the document if changes are significant (throttled)."""
    # 1. Verify owner permission
    doc = crud.get_document_by_id(db, doc_id, user_id)
    if not doc:
        return
        
    # 2. Fetch the latest version
    versions = crud.get_document_versions(db, doc_id, user_id)
    
    should_save = False
    if not versions:
        should_save = True
    else:
        latest = versions[0]
        # Skip if content is identical
        if latest.content != current_content:
            # Check length difference or time delta threshold (e.g. 5 minutes)
            time_diff = datetime.datetime.utcnow() - latest.created_at
            char_diff = abs(len(current_content) - len(latest.content))
            
            # Save if time delta is over 5 minutes or character change is over 50 chars
            if time_diff.total_seconds() > 300 or char_diff > 50:
                should_save = True
                
    if should_save:
        crud.create_document_version(db, doc_id, current_content)

def get_document_version_history(db: Session, doc_id: str, user_id: int) -> List[DocumentVersion]:
    return crud.get_document_versions(db, doc_id, user_id)

def migrate_guest_documents(db: Session, user_id: int, sync_in: GuestSyncRequest) -> int:
    """Migrates localStorage guest drafts into the database, handling title conflicts."""
    migrated_count = 0
    
    for item in sync_in.documents:
        # Check if the document ID is already registered in the DB
        existing_doc = db.query(Document).filter(Document.id == item.id).first()
        
        if existing_doc:
            # Conflict handling: if it belongs to another user or if content differs, keep both!
            if existing_doc.user_id != user_id or existing_doc.content != item.content:
                # Keep both by appending suffix and generating a new ID
                new_id = str(uuid.uuid4())
                new_title = f"{item.title} (Local Copy)"
                doc_create = DocumentCreate(
                    id=new_id,
                    title=new_title,
                    content=item.content,
                    preview=item.preview
                )
                crud.create_document(db, user_id, doc_create)
                migrated_count += 1
            else:
                # Content is identical, ignore/skip sync
                pass
        else:
            # Document does not exist, upload directly
            doc_create = DocumentCreate(
                id=item.id,
                title=item.title,
                content=item.content,
                preview=item.preview
            )
            crud.create_document(db, user_id, doc_create)
            migrated_count += 1
            
    return migrated_count
