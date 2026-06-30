import logging
import logging.config
import sys
from app.core.config import settings

def setup_logging():
    """Configures structured application logging with sensitive fields filters."""
    log_level = settings.LOG_LEVEL.upper()
    
    # Define custom sensitive fields filter
    class SensitiveFieldsFilter(logging.Filter):
        def filter(self, record):
            # Intercept log messages to redact passwords or JWT tokens
            message = record.getMessage()
            if "password" in message.lower() or "token" in message.lower():
                # Simple redaction logic
                record.msg = "[REDACTED LOG DATA containing password/token]"
                record.args = ()
            return True

    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "json": {
                "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}'
            }
        },
        "filters": {
            "sensitive_filter": {
                "()": SensitiveFieldsFilter
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "standard",
                "stream": sys.stdout,
                "filters": ["sensitive_filter"]
            }
        },
        "loggers": {
            "": {  # Root logger
                "handlers": ["console"],
                "level": log_level,
                "propagate": True
            },
            "uvicorn": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False
            },
            "sqlalchemy.engine": {
                "handlers": ["console"],
                "level": "WARNING",
                "propagate": False
            }
        }
    }

    logging.config.dictConfig(logging_config)
    logging.info(f"Structured logging initialized with log level: {log_level}")
