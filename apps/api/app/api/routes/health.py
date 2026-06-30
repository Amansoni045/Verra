import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
import threading

from app.db.session import get_db, engine
from app.ml.predictor import check_engine_status
from app.schemas.base import SuccessResponse

router = APIRouter(prefix="/api/health", tags=["System Health & Metrics"])

# Centralized thread-safe metrics collector
metrics_lock = threading.Lock()
SYSTEM_METRICS: Dict[str, Any] = {
    "total_predictions": 0,
    "total_prediction_failures": 0,
    "total_prediction_latency_ms": 0.0,
    "total_prediction_confidence": 0.0,
    "total_db_transactions": 0,
    "total_db_latency_ms": 0.0,
    "total_autosave_failures": 0
}

START_TIME = time.time()

def track_prediction(latency_ms: float, confidence: float):
    """Logs prediction performance metrics."""
    with metrics_lock:
        SYSTEM_METRICS["total_predictions"] += 1
        SYSTEM_METRICS["total_prediction_latency_ms"] += latency_ms
        SYSTEM_METRICS["total_prediction_confidence"] += confidence

def track_prediction_failure():
    """Logs prediction failures."""
    with metrics_lock:
        SYSTEM_METRICS["total_prediction_failures"] += 1

def track_db_transaction(latency_ms: float):
    """Logs database transaction latency."""
    with metrics_lock:
        SYSTEM_METRICS["total_db_transactions"] += 1
        SYSTEM_METRICS["total_db_latency_ms"] += latency_ms

def track_autosave_failure():
    """Logs autosave failure events."""
    with metrics_lock:
        SYSTEM_METRICS["total_autosave_failures"] += 1

@router.get("/liveness", response_model=SuccessResponse[Dict[str, str]])
def get_liveness():
    """Verifies that the API server process is alive."""
    return SuccessResponse(message="Liveness check passed.", data={"status": "alive"})

@router.get("/readiness", response_model=SuccessResponse[Dict[str, Any]])
def get_readiness(db: Session = Depends(get_db)):
    """Verifies that database connection and LSTM model weights are fully loaded."""
    # 1. Verify DB readiness
    db_ready = False
    try:
        t_start = time.time()
        db.execute(text("SELECT 1"))
        db_latency = (time.time() - t_start) * 1000
        track_db_transaction(db_latency)
        db_ready = True
    except Exception:
        db_latency = -1
        
    # 2. Verify model engine readiness
    model_status = check_engine_status()
    engine_ready = model_status["ready"]

    if not db_ready or not engine_ready:
        return SuccessResponse(
            success=False,
            message="Readiness check failed. Some subsystems are offline.",
            data={
                "db_connected": db_ready,
                "db_latency_ms": round(db_latency, 2),
                "model_engine_online": engine_ready,
                "model_status": model_status
            }
        )

    return SuccessResponse(
        message="All subsystems are online and ready.",
        data={
            "db_connected": True,
            "db_latency_ms": round(db_latency, 2),
            "model_engine_online": True,
            "model_status": model_status
        }
    )

@router.get("/metrics", response_model=SuccessResponse[Dict[str, Any]])
def get_metrics():
    """Returns aggregated API usage, prediction latencies, and transaction metrics."""
    uptime_seconds = time.time() - START_TIME
    
    with metrics_lock:
        total_preds = SYSTEM_METRICS["total_predictions"]
        total_db = SYSTEM_METRICS["total_db_transactions"]
        
        avg_pred_latency = (
            SYSTEM_METRICS["total_prediction_latency_ms"] / total_preds
            if total_preds > 0 else 0.0
        )
        avg_confidence = (
            (SYSTEM_METRICS["total_prediction_confidence"] / total_preds) * 100
            if total_preds > 0 else 0.0
        )
        avg_db_latency = (
            SYSTEM_METRICS["total_db_latency_ms"] / total_db
            if total_db > 0 else 0.0
        )

        metrics_data = {
            "uptime_seconds": round(uptime_seconds, 2),
            "total_predictions": total_preds,
            "prediction_failures": SYSTEM_METRICS["total_prediction_failures"],
            "avg_prediction_latency_ms": round(avg_pred_latency, 2),
            "avg_prediction_confidence_percentage": round(avg_confidence, 2),
            "total_database_transactions": total_db,
            "avg_database_latency_ms": round(avg_db_latency, 2),
            "autosave_failures": SYSTEM_METRICS["total_autosave_failures"]
        }
        
    return SuccessResponse(message="System metrics retrieved.", data=metrics_data)
