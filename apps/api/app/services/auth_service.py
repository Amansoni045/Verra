import datetime
import uuid
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.db import crud
from app.db.models import User
from app.core import security
from app.schemas.auth import UserRegister, Token, UserOut

def register_new_user(db: Session, user_in: UserRegister) -> Tuple[bool, str, Optional[User]]:
    """Registers a new email/password account, validating uniqueness."""
    existing_user = crud.get_user_by_email(db, user_in.email)
    if existing_user:
        return False, "This email address is already registered.", None
        
    try:
        user = crud.create_user(db, user_in)
        return True, "Registration successful.", user
    except Exception as e:
        return False, f"Account registration failed: {str(e)}", None

def authenticate_user(db: Session, email: str, password: str, remember_me: bool = False) -> Optional[Token]:
    """Authenticates credentials, logs a session, and returns JWT tokens."""
    user = crud.get_user_by_email(db, email)
    if not user or not user.password_hash or not user.salt:
        return None
        
    if not security.verify_password(password, user.password_hash, user.salt):
        return None
        
    # Session expiration delta configuration
    if remember_me:
        access_delta = datetime.timedelta(days=7)
        refresh_delta = datetime.timedelta(days=30)
    else:
        access_delta = datetime.timedelta(minutes=60)
        refresh_delta = datetime.timedelta(days=1)
        
    jti = str(uuid.uuid4())
    access_token = security.create_access_token(user.id, expires_delta=access_delta)
    refresh_token = security.create_refresh_token(jti, expires_delta=refresh_delta)
    
    expires_at = datetime.datetime.utcnow() + refresh_delta
    crud.create_session(db, token_jti=jti, user_id=user.id, expires_at=expires_at)
    
    user_out = UserOut.model_validate(user)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_out
    )

def validate_session(db: Session, token: str) -> Optional[User]:
    """Validates an active session JWT token, returning the authenticated user."""
    payload = security.decode_token(token)
    if not payload or payload.get("type") != "access":
        return None
        
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
        
    try:
        user_id = int(user_id_str)
    except ValueError:
        return None
        
    return crud.get_user_by_id(db, user_id)
