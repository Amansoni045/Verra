import json
import time
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import prediction_limiter
from app.services import prediction_service
from app.ml.predictor import check_engine_status, preprocess_text
from app.schemas.base import SuccessResponse

router = APIRouter(prefix="/api/generate", tags=["Text Generation"])

class GenerationRequest(BaseModel):
    """Pydantic validation schema for predictions payload."""
    prompt: str = Field(..., min_length=1, description="The seed text to continue writing from.")
    temperature: float = Field(default=settings.TEMPERATURE, ge=0.01, le=2.0)
    strategy: str = Field(default=settings.DECODING_STRATEGY, description="Decoding strategy: beam or top_k")

@router.post("", response_model=SuccessResponse[dict])
def generate_text(payload: GenerationRequest, request: Request):
    """Generates next words synchronously using the configured decoding strategy."""
    # 1. Enforce rate limiting based on client IP
    client_ip = request.client.host if request.client else "unknown"
    prediction_limiter.check_rate_limit(client_ip)

    # 2. Check engine status
    status_check = check_engine_status()
    if not status_check["ready"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=status_check["message"]
        )

    # 3. Preprocess and validate minimum context
    cleaned_prompt = preprocess_text(payload.prompt)
    words_in_prompt = cleaned_prompt.split()
    
    if len(words_in_prompt) < settings.MIN_INPUT_WORDS:
        # Pydantic-like friendly validation error
        return SuccessResponse(
            success=False,
            message="I need a little more context to write a continuation. Try adding a sentence.",
            data={
                "prompt": payload.prompt,
                "generated_text": "Please write at least 3 words to get a continuation.",
                "words": [],
                "details": [],
                "stopping_reason": "prompt_too_short"
            }
        )

    # 4. Generate prediction
    try:
        res = prediction_service.get_prediction(
            prompt=cleaned_prompt,
            strategy=payload.strategy,
            temperature=payload.temperature
        )
        
        # 5. Apply quality scoring filter fallback
        if res.get("quality_score", 0.0) < settings.MIN_QUALITY_SCORE:
            # Replaced jargon with friendly message
            res["generated_text"] = "I couldn't confidently continue this sentence yet. Try adding another sentence or giving a little more context."
            res["words"] = []
            res["details"] = []
            
        return SuccessResponse(
            message="Continuation generated successfully.",
            data={
                "prompt": payload.prompt,
                "generated_text": res["generated_text"],
                "words": res["words"],
                "details": res["details"],
                "confidence": res["confidence"],
                "quality_score": res["quality_score"],
                "stopping_reason": res["stopping_reason"]
            }
        )
    except Exception as e:
        # Centralized exception logging fallback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Autocomplete model failed: {str(e)}"
        )

@router.get("/stream")
def generate_text_stream(
    request: Request,
    prompt: str = Query(..., description="The seed text."),
    temperature: float = Query(settings.TEMPERATURE, ge=0.01, le=2.0),
    strategy: str = Query(settings.DECODING_STRATEGY)
):
    """Streams generated text word-by-word with details using Server-Sent Events (SSE)."""
    # 1. Enforce rate limiting
    client_ip = request.client.host if request.client else "unknown"
    prediction_limiter.check_rate_limit(client_ip)

    status_check = check_engine_status()
    if not status_check["ready"]:
        def error_generator():
            yield f"data: {json.dumps({'error': status_check['message']})}\n\n"
        return StreamingResponse(error_generator(), media_type="text/event-stream")

    def event_generator():
        cleaned_prompt = preprocess_text(prompt)
        words_in_prompt = cleaned_prompt.split()
        
        if len(words_in_prompt) < settings.MIN_INPUT_WORDS:
            yield f"data: {json.dumps({'step': 'complete', 'error': 'I need a little more context to write a continuation. Try adding a sentence.'})}\n\n"
            return

        yield f"data: {json.dumps({'step': 'analyzing', 'message': 'Analyzing recurrent context...'})}\n\n"
        time.sleep(0.05)
        
        try:
            res = prediction_service.get_prediction(
                prompt=cleaned_prompt,
                strategy=strategy,
                temperature=temperature
            )
            
            # Check Quality Filter
            if res.get("quality_score", 0.0) < settings.MIN_QUALITY_SCORE:
                # Friendly fallback notification
                fallback_msg = "I couldn't confidently continue this sentence yet. Try adding another sentence or giving a little more context."
                yield f"data: {json.dumps({'step': 'generating', 'word': fallback_msg, 'top_candidates': [], 'input_tokens': []})}\n\n"
                time.sleep(0.1)
                yield f"data: {json.dumps({'step': 'complete', 'message': 'low_quality'})}\n\n"
                return
                
            words = res["words"]
            details = res["details"]
            
            # Stream words sequentially to create typewriter pacing
            for idx, (word, detail) in enumerate(zip(words, details)):
                is_last = (idx == len(words) - 1)
                word_to_send = word
                if is_last and not word.endswith((".", "?", "!")):
                    word_to_send += "."
                
                payload = {
                    'step': 'generating',
                    'word': word_to_send,
                    'index': idx + 1,
                    'confidence': detail['confidence'],
                    'top_candidates': detail['top_candidates'],
                    'input_tokens': detail['input_tokens']
                }
                yield f"data: {json.dumps(payload)}\n\n"
                time.sleep(0.08) # smooth natural pacing
                
            yield f"data: {json.dumps({'step': 'complete', 'message': 'Suggestion Complete'})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Generation error: {str(e)}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
