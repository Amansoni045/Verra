import os
import threading
import numpy as np
from typing import Dict, List, Any, Tuple
from app.core.config import settings
from app.ml.tokenizer import word_index, index_to_word, max_len, text_to_tokens, preprocess_text

# Resolve model assets path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "best_model.h5")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(MODELS_DIR, "lstm_model.h5")

# Mutex lock to ensure thread-safe TensorFlow inference
model_lock = threading.Lock()

# Global TensorFlow status
TENSORFLOW_AVAILABLE = False
MODEL_LOADED = False
model = None

# Attempt to import TensorFlow
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
except ImportError:
    print("TensorFlow package not available. Model inference will be disabled.")

def load_prediction_model() -> Tuple[bool, str]:
    """Loads the compiled LSTM Keras model weights into memory exactly once."""
    global model, MODEL_LOADED
    if not TENSORFLOW_AVAILABLE:
        return False, "TensorFlow/Keras is not installed in the container environment."
    
    if not os.path.exists(MODEL_PATH):
        return False, f"Trained LSTM weights file not found at {MODEL_PATH}."

    try:
        # Load model under thread safety lock
        with model_lock:
            # Silence TensorFlow warnings
            os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
            model = load_model(MODEL_PATH)
            MODEL_LOADED = True
        return True, "LSTM neural model weights loaded successfully."
    except Exception as e:
        MODEL_LOADED = False
        return False, f"Failed to load neural model weights: {str(e)}"

# Trigger loading on module import
load_success, load_message = load_prediction_model()
print(load_message)

def check_engine_status() -> Dict[str, Any]:
    """Returns the initialization and readiness state of the neural model engine."""
    model_exists = os.path.exists(MODEL_PATH)
    
    if not TENSORFLOW_AVAILABLE:
        return {
            "ready": False,
            "status": "missing_dependencies",
            "message": "TensorFlow/Keras is not installed on the system."
        }
    elif not model_exists:
        return {
            "ready": False,
            "status": "missing_weights",
            "message": "Trained LSTM weights file 'best_model.h5' was not found."
        }
    elif not MODEL_LOADED:
        success, msg = load_prediction_model()
        if not success:
            return {
                "ready": False,
                "status": "load_error",
                "message": f"Failed to load neural network weights: {msg}"
            }
        
    return {
        "ready": True,
        "status": "ready",
        "message": "Neural model engine is online and fully loaded."
    }

def pad_sequence_pre(sequence: List[int], maxlen: int) -> np.ndarray:
    """Pre-pads integer sequence with zeros to match max length context window (equivalent to Keras pad_sequences)."""
    if len(sequence) >= maxlen:
        padded = sequence[-maxlen:]
    else:
        padded = [0] * (maxlen - len(sequence)) + sequence
    return np.array([padded])

def predict_single_step(tokens: List[int], temperature: float = 0.8, exclude_word_ids: List[int] = None) -> Dict[str, Any]:
    """Predicts a single next token distribution and returns the chosen word and alternative candidates."""
    status = check_engine_status()
    if not status["ready"]:
        raise RuntimeError(status["message"])

    if not tokens:
        tokens = [1]  # safe fallback token ID (usually OOV/UNK or first token)

    # Pad sequence to match training configuration window
    seq_padded = pad_sequence_pre(tokens, maxlen=max_len)
    
    # Run thread-safe model inference
    with model_lock:
        preds = model.predict(seq_padded, verbose=0)[0]
    
    raw_probs = np.asarray(preds).astype('float64')
    
    # Exclude repeated word tokens if requested
    if exclude_word_ids:
        for ex_id in exclude_word_ids:
            if ex_id < len(raw_probs):
                raw_probs[ex_id] = 0.0
                
    # Normalize probabilities after exclusion
    prob_sum = np.sum(raw_probs)
    if prob_sum > 0:
        raw_probs = raw_probs / prob_sum
    else:
        raw_probs = np.ones_like(raw_probs) / len(raw_probs)

    # Implement Top-k filtering: keep only the top TOP_K tokens
    top_indices = np.argsort(raw_probs)[-settings.TOP_K:]
    
    # Zero out probabilities below floor threshold
    filtered_probs = np.zeros_like(raw_probs)
    for idx in top_indices:
        if raw_probs[idx] >= settings.PROBABILITY_FLOOR:
            filtered_probs[idx] = raw_probs[idx]
            
    # Re-normalize filtered probabilities
    filt_sum = np.sum(filtered_probs)
    if filt_sum > 0:
        filtered_probs = filtered_probs / filt_sum
    else:
        filtered_probs = raw_probs
        
    # Apply Temperature Scaling
    log_probs = np.log(filtered_probs + 1e-10) / max(temperature, 0.01)
    exp_probs = np.exp(log_probs)
    final_scaled_probs = exp_probs / np.sum(exp_probs)
    
    # Sample index using scaled probabilities
    pred_index = int(np.random.choice(len(final_scaled_probs), p=final_scaled_probs))
    chosen_word = index_to_word.get(pred_index, "")
    chosen_prob = float(raw_probs[pred_index])

    # Get alternative top candidates for UI hover details
    ranked_indices = np.argsort(raw_probs)[::-1]
    top_candidates = []
    for r_idx in ranked_indices:
        word = index_to_word.get(int(r_idx), "")
        if word and len(top_candidates) < 4:
            top_candidates.append({
                "word": word,
                "probability": float(raw_probs[r_idx])
            })
            
    # Token details for visualization (Behind the Writing)
    last_tokens = tokens[-5:]
    input_token_details = [
        {"token_id": int(tok), "word": index_to_word.get(int(tok), "<unknown>")}
        for tok in last_tokens
    ]

    return {
        "word_id": pred_index,
        "word": chosen_word,
        "confidence": chosen_prob,
        "top_candidates": top_candidates,
        "input_tokens": input_token_details,
        "raw_probs": raw_probs
    }
