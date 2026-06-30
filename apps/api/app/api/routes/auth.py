from fastapi import APIRouter, Depends, HTTPException, Security, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.db.models import User
from app.services import auth_service
from app.schemas.base import SuccessResponse, ErrorResponse
from app.schemas.auth import UserRegister, UserLogin, Token, UserOut

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    auth: HTTPAuthorizationCredentials = Security(security_scheme),
    token: Optional[str] = Query(None, description="Auth token passed via query parameter for streaming clients."),
    db: Session = Depends(get_db)
) -> User:
    """Dependency injection to resolve and authorize the active user via JWT header or query parameter."""
    token_str = None
    if auth:
      token_str = auth.credentials
    elif token:
      token_str = token

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token is missing."
        )
    user = auth_service.validate_session(db, token_str)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please sign in again."
        )
    return user

@router.post("/register", response_model=SuccessResponse[UserOut])
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user account."""
    success, message, user = auth_service.register_new_user(db, user_in)
    if not success or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    user_out = UserOut.model_validate(user)
    return SuccessResponse(message=message, data=user_out)

@router.post("/login", response_model=SuccessResponse[Token])
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates credentials and returns a secure session token."""
    token = auth_service.authenticate_user(
        db, 
        user_in.email, 
        user_in.password, 
        user_in.remember_me
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password."
        )
    return SuccessResponse(message="Authentication successful.", data=token)

@router.get("/me", response_model=SuccessResponse[UserOut])
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieves details of the currently authenticated user."""
    user_out = UserOut.model_validate(current_user)
    return SuccessResponse(message="Profile retrieved.", data=user_out)
