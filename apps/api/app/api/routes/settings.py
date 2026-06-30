from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User
from app.api.routes.auth import get_current_user
from app.db import crud
from app.schemas.base import SuccessResponse
from app.schemas.settings import SettingsUpdate, SettingsOut

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=SuccessResponse[SettingsOut])
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves current user writing configuration settings."""
    settings_obj = crud.get_user_settings(db, current_user.id)
    settings_out = SettingsOut.model_validate(settings_obj)
    return SuccessResponse(message="Settings retrieved.", data=settings_out)

@router.put("", response_model=SuccessResponse[SettingsOut])
def update_settings(
    settings_in: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user writing configuration settings."""
    settings_obj = crud.update_user_settings(db, current_user.id, settings_in)
    settings_out = SettingsOut.model_validate(settings_obj)
    return SuccessResponse(message="Settings saved successfully.", data=settings_out)
