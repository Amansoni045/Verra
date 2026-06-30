from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.api.routes.auth import get_current_user
from app.services import document_service
from app.schemas.base import SuccessResponse
from app.schemas.documents import (
    DocumentCreate, 
    DocumentUpdate, 
    DocumentOut, 
    DocumentVersionOut, 
    GuestSyncRequest
)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("", response_model=SuccessResponse[List[DocumentOut]])
def list_documents(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Lists all active drafts for the logged-in user."""
    docs = document_service.get_all_user_documents(db, current_user.id)
    docs_out = [DocumentOut.model_validate(d) for d in docs]
    return SuccessResponse(message="Documents retrieved successfully.", data=docs_out)

@router.post("", response_model=SuccessResponse[DocumentOut])
def create_document(
    doc_in: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new document draft."""
    doc = document_service.create_user_document(db, current_user.id, doc_in)
    doc_out = DocumentOut.model_validate(doc)
    return SuccessResponse(message="Document created successfully.", data=doc_out)

@router.post("/sync", response_model=SuccessResponse[int])
def sync_guest_documents(
    sync_in: GuestSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Migrates guest drafts from local storage into the user's database space."""
    count = document_service.migrate_guest_documents(db, current_user.id, sync_in)
    return SuccessResponse(message=f"Successfully migrated {count} local drafts.", data=count)

@router.get("/{doc_id}", response_model=SuccessResponse[DocumentOut])
def get_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves content details of a specific user draft."""
    doc = document_service.get_user_document_by_id(db, doc_id, current_user.id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found or access denied."
        )
    doc_out = DocumentOut.model_validate(doc)
    return SuccessResponse(message="Document retrieved.", data=doc_out)

@router.put("/{doc_id}", response_model=SuccessResponse[DocumentOut])
def update_document(
    doc_id: str,
    doc_in: DocumentUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates draft metadata and text body, logging version history in the background."""
    doc = document_service.update_user_document(db, current_user.id, doc_id, doc_in)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found or access denied."
        )
        
    # Queue version archival checks as a non-blocking background task
    if doc_in.content is not None:
        background_tasks.add_task(
            document_service.save_document_version_background,
            db=db,
            doc_id=doc_id,
            user_id=current_user.id,
            current_content=doc_in.content
        )
        
    doc_out = DocumentOut.model_validate(doc)
    return SuccessResponse(message="Document saved successfully.", data=doc_out)

@router.delete("/{doc_id}", response_model=SuccessResponse[bool])
def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft deletes a document draft."""
    success = document_service.soft_delete_user_document(db, current_user.id, doc_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Draft not found or access denied."
        )
    return SuccessResponse(message="Document deleted successfully.", data=True)

@router.get("/{doc_id}/versions", response_model=SuccessResponse[List[DocumentVersionOut]])
def get_version_history(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves historical versions of a draft."""
    versions = document_service.get_document_version_history(db, doc_id, current_user.id)
    versions_out = [DocumentVersionOut.model_validate(v) for v in versions]
    return SuccessResponse(message="History retrieved successfully.", data=versions_out)
