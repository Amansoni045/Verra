import time
import json
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.config import (
    DECODING_STRATEGY,
    TOP_K,
    TEMPERATURE,
    CONFIDENCE_THRESHOLD,
    MAX_COMPLETION_WORDS,
    MIN_INPUT_WORDS,
    MIN_QUALITY_SCORE
)
from app.predictor import (
    check_status,
    generate_top_k,
    generate_beam_search,
    max_len,
    word_index,
    preprocess_text_input
)

app = FastAPI(
    title="Verra API",
    description="Premium Neural Text Autocomplete Backend",
    version="1.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="The seed text to continue writing from.")
    temperature: float = Field(TEMPERATURE, ge=0.01, le=2.0, description="Creativity scale.")

@app.get("/api/status")
def get_status():
    """Returns the initialization status, vocabulary size, and sequence configuration."""
    status = check_status()
    return {
        "online": True,
        "engine": status,
        "config": {
            "decoding_strategy": DECODING_STRATEGY,
            "max_sequence_length": max_len,
            "vocab_size": len(word_index),
            "framework": "TensorFlow/Keras",
            "model_type": "LSTM (Long Short-Term Memory)"
        }
    }

@app.post("/api/generate")
def generate_text(request: GenerationRequest):
    """Generates next words synchronously using the default decoding strategy."""
    status = check_status()
    if not status["ready"]:
        raise HTTPException(status_code=400, detail=status["message"])
    
    # 1. Clean prompt and check word count limit
    cleaned_prompt = preprocess_text_input(request.prompt)
    words_in_prompt = cleaned_prompt.split()
    if len(words_in_prompt) < MIN_INPUT_WORDS:
        return {
            "prompt": request.prompt,
            "generated_text": "Please write at least 3 words to get a continuation.",
            "words": [],
            "details": [],
            "quality_score": 0.0,
            "stopping_reason": "prompt_too_short"
        }
        
    start_time = time.time()
    try:
        # 2. Run the configured decoding strategy
        if DECODING_STRATEGY == "beam":
            res = generate_beam_search(cleaned_prompt)
        else:
            res = generate_top_k(cleaned_prompt, request.temperature)
            
        # 3. Apply Quality Filter
        if res["quality_score"] < MIN_QUALITY_SCORE:
            res["generated_text"] = "No confident continuation available. Try providing a little more context."
            res["words"] = []
            res["details"] = []
            
        inference_time = (time.time() - start_time) * 1000
        
        return {
            "prompt": request.prompt,
            "generated_text": res["generated_text"],
            "words": res["words"],
            "details": res["details"],
            "confidence": res["confidence"],
            "quality_score": res["quality_score"],
            "stopping_reason": res["stopping_reason"],
            "inference_time_ms": round(inference_time, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate/stream")
def generate_text_stream(
    prompt: str = Query(..., description="The seed text."),
    temperature: float = Query(TEMPERATURE, ge=0.01, le=2.0)
):
    """Streams generated text word-by-word with details using SSE."""
    status = check_status()
    if not status["ready"]:
        def error_generator():
            yield f"data: {json.dumps({'error': status['message']})}\n\n"
        return StreamingResponse(error_generator(), media_type="text/event-stream")

    def event_generator():
        # 1. Clean prompt and check word count limit
        cleaned_prompt = preprocess_text_input(prompt)
        words_in_prompt = cleaned_prompt.split()
        
        if len(words_in_prompt) < MIN_INPUT_WORDS:
            yield f"data: {json.dumps({'step': 'generating', 'word': 'Please write at least 3 words to get a continuation.', 'top_candidates': [], 'input_tokens': []})}\n\n"
            time.sleep(0.1)
            yield f"data: {json.dumps({'step': 'complete', 'message': 'Too short'})}\n\n"
            return

        yield f"data: {json.dumps({'step': 'analyzing', 'message': 'Analyzing recurrent context...'})}\n\n"
        time.sleep(0.05)
        
        start_time = time.time()
        
        try:
            # 2. Run the configured decoding strategy in backend
            if DECODING_STRATEGY == "beam":
                res = generate_beam_search(cleaned_prompt)
            else:
                res = generate_top_k(cleaned_prompt, temperature)
                
            # 3. Check Quality Filter
            if res["quality_score"] < MIN_QUALITY_SCORE:
                # Stream fallback notification
                fallback_msg = "No confident continuation available. Try providing a little more context."
                yield f"data: {json.dumps({'step': 'generating', 'word': fallback_msg, 'top_candidates': [], 'input_tokens': []})}\n\n"
                time.sleep(0.1)
                yield f"data: {json.dumps({'step': 'complete', 'message': 'low_quality'})}\n\n"
                return
                
            # 4. Stream words sequentially to create typewriter pacing
            words = res["words"]
            details = res["details"]
            
            for idx, (word, detail) in enumerate(zip(words, details)):
                # Ensure spacing is formatted naturally
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
                
            inference_time = (time.time() - start_time) * 1000
            yield f"data: {json.dumps({'step': 'complete', 'message': 'Suggestion Complete', 'inference_time_ms': round(inference_time, 2)})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': f'Generation error: {str(e)}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
