import datetime
import hashlib
import hmac
import secrets
from typing import Optional, Union, Any
import jwt
from app.core.config import settings

# Setup standard encryption parameters
ALGORITHM = settings.JWT_ALGORITHM
SECRET_KEY = settings.JWT_SECRET

def hash_password(password: str) -> tuple[str, str]:
    """Hashes a password with a securely generated salt using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pw_hash, salt

def verify_password(password: str, pw_hash: str, salt: str) -> bool:
    """Verifies a password against its PBKDF2 hash using a constant-time comparison."""
    new_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return hmac.compare_digest(new_hash, pw_hash)

def create_access_token(subject: Union[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generates a secure JWT access token."""
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generates a secure long-lived JWT refresh token (Remember Me option)."""
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token signature and expiration."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except (jwt.PyJWTError, ValueError):
        return None

# Self-contained thread-safe in-memory rate limiter for production security
import time
from collections import defaultdict
import threading
from fastapi import HTTPException, Request, status

class InMemoryRateLimiter:
    def __init__(self, limit: int, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = threading.Lock()

    def check_rate_limit(self, key: str):
        """Validates request count from key under locking window constraints."""
        with self.lock:
            now = time.time()
            # Prune obsolete request timestamps
            self.requests[key] = [t for t in self.requests[key] if now - t < self.window_seconds]
            
            if len(self.requests[key]) >= self.limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Limit is {self.limit} requests per {self.window_seconds} seconds."
                )
            self.requests[key].append(now)

# Global rate limit instances
prediction_limiter = InMemoryRateLimiter(20)
save_limiter = InMemoryRateLimiter(100)
auth_limiter = InMemoryRateLimiter(10)

