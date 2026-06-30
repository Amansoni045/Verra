import os
import time
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.session import run_db_migrations
from app.api.routes import auth, documents, prediction, settings as settings_route, health

# 1. Initialize structured logging
setup_logging()

app = FastAPI(
    title="Verra API",
    description="Premium Gated LSTM Autocomplete Backend",
    version="1.0.0"
)

# 2. Configure strict CORS policies
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", os.getenv("ALLOWED_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Database programmatic migration check on startup
@app.on_event("startup")
def on_startup():
    run_db_migrations()

# 4. Standardized Global Exception Handling

@app.exception_handler(RequestValidationError)
def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Intercepts Pydantic validation failures and returns a standard error envelope."""
    import logging
    logging.warning(f"API request validation failed: {exc.errors()}")
    
    # Compile a friendly error explanation
    error_details = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "invalid format")
        error_details.append(f"{loc}: {msg}")
        
    friendly_msg = "Invalid parameters provided: " + ", ".join(error_details)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": friendly_msg,
            "error": str(exc),
            "code": "VALIDATION_ERROR"
        }
    )

@app.exception_handler(SQLAlchemyError)
def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Intercepts SQLAlchemy database errors to protect internal schema details."""
    import logging
    logging.error(f"Database transaction failure: {str(exc)}", exc_info=True)
    from app.api.routes.health import track_autosave_failure
    track_autosave_failure()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "We couldn't save or sync your writing data right now. Please try again.",
            "error": "Database Error",
            "code": "DATABASE_ERROR"
        }
    )

@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    """Ensures manual HTTPExceptions are mapped into standard JSON envelopes."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error": exc.detail,
            "code": f"HTTP_ERROR_{exc.status_code}"
        }
    )

@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    """Centralized fallback exception handler shielding implementation stack details."""
    import logging
    logging.error(f"Unhandled system error: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "We couldn't complete your request right now. Please try again.",
            "error": "Internal Server Error",
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

# 5. Register modular API routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(prediction.router)
app.include_router(settings_route.router)
app.include_router(health.router)

# Import os for environment checking in CORS middleware
import os
