import time
import json
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.predictor import check_status, predict_next_word, predict_next_word_with_details, max_len, word_index

app = FastAPI(
    title="Verra API",
    description="Premium Neural Text Generation Engine Backend",
    version="1.0.0"
)

# Configure CORS for Next.js app on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="The seed text to continue writing from.")
    temperature: float = Field(1.0, ge=0.01, le=2.0, description="Creativity scale: higher values mean more random words.")
    max_words: int = Field(15, ge=1, le=100, description="Maximum number of words to generate.")

@app.get("/api/status")
def get_status():
    """Returns the initialization status, vocabulary size, and sequence configuration of the model."""
    status = check_status()
    return {
        "online": True,
        "engine": status,
        "config": {
            "max_sequence_length": max_len,
            "vocab_size": len(word_index),
            "framework": "TensorFlow/Keras",
            "model_type": "LSTM (Long Short-Term Memory)"
        }
    }

@app.post("/api/generate")
def generate_text(request: GenerationRequest):
    """Generates the requested number of words synchronously with prediction details."""
    status = check_status()
    if not status["ready"]:
        raise HTTPException(status_code=400, detail=status["message"])
    
    start_time = time.time()
    try:
        current_text = request.prompt
        generated_words = []
        details = []
        
        for _ in range(request.max_words):
            res = predict_next_word_with_details(current_text, request.temperature)
            next_word = res["word"]
            if not next_word:
                break
            generated_words.append(next_word)
            details.append(res)
            current_text += " " + next_word
            
        inference_time = (time.time() - start_time) * 1000
        
        return {
            "prompt": request.prompt,
            "generated_text": " ".join(generated_words),
            "words": generated_words,
            "details": details,
            "inference_time_ms": round(inference_time, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate/stream")
def generate_text_stream(
    prompt: str = Query(..., description="The seed text."),
    temperature: float = Query(1.0, ge=0.01, le=2.0),
    max_words: int = Query(15, ge=1, le=100)
):
    """Streams generated text word-by-word with details using SSE."""
    status = check_status()
    if not status["ready"]:
        def error_generator():
            yield f"data: {json.dumps({'error': status['message']})}\n\n"
        return StreamingResponse(error_generator(), media_type="text/event-stream")

    def event_generator():
        current_text = prompt
        
        # Step 1: Analyzing context / Tokenizing
        yield f"data: {json.dumps({'step': 'analyzing', 'message': 'Analyzing context...'})}\n\n"
        time.sleep(0.08)
        
        yield f"data: {json.dumps({'step': 'encoding', 'message': 'Encoding seed text...'})}\n\n"
        time.sleep(0.06)
        
        # Step 2: Predicting words
        yield f"data: {json.dumps({'step': 'running_net', 'message': 'Running Neural Network...'})}\n\n"
        
        start_time = time.time()
        words_sent = 0
        
        for i in range(max_words):
            if i == 0:
                yield f"data: {json.dumps({'step': 'predicting', 'message': 'Predicting Next Word...'})}\n\n"
                
            try:
                res = predict_next_word_with_details(current_text, temperature)
                next_word = res["word"]
                if not next_word:
                    break
                    
                current_text += " " + next_word
                words_sent += 1
                
                # Stream the word out immediately along with details
                payload = {
                    'step': 'generating',
                    'word': next_word,
                    'index': words_sent,
                    'confidence': res['confidence'],
                    'top_candidates': res['top_candidates'],
                    'input_tokens': res['input_tokens']
                }
                yield f"data: {json.dumps(payload)}\n\n"
                
                # Small typing interval to pacing UI animations naturally
                time.sleep(0.05)
                
            except Exception as e:
                yield f"data: {json.dumps({'error': f'Prediction loop interrupted: {str(e)}'})}\n\n"
                break
                
        inference_time = (time.time() - start_time) * 1000
        
        # Yield completion metadata
        yield f"data: {json.dumps({'step': 'complete', 'message': 'Generation complete', 'inference_time_ms': round(inference_time, 2)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
