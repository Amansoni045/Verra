import os
import pickle
import json
import numpy as np

# Resolve model assets paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MAX_LEN_PATH = os.path.join(MODELS_DIR, "max_len.pkl")
TOKENIZER_PATH = os.path.join(MODELS_DIR, "tokenizer.pkl")
WORD_INDEX_PATH = os.path.join(MODELS_DIR, "word_index.json")
MODEL_PATH = os.path.join(MODELS_DIR, "lstm_model.h5")

# Status variables
TENSORFLOW_AVAILABLE = False
MODEL_LOADED = False
TOKENIZER_LOADED = False

model = None
tokenizer = None
max_len = 745  # Default fallback based on inspect
word_index = {}
index_to_word = {}

# 1. Attempt to load the word index from JSON (lightweight and zero-dependency)
if os.path.exists(WORD_INDEX_PATH):
    try:
        with open(WORD_INDEX_PATH, "r", encoding="utf-8") as f:
            word_index = json.load(f)
            index_to_word = {int(idx): word for word, idx in word_index.items()}
            TOKENIZER_LOADED = True
    except Exception as e:
        print(f"Error loading word_index.json: {e}")

# 2. Attempt to load max_len
if os.path.exists(MAX_LEN_PATH):
    try:
        with open(MAX_LEN_PATH, "rb") as f:
            max_len = pickle.load(f)
    except Exception as e:
        print(f"Error loading max_len.pkl: {e}")

# 3. Attempt to import TensorFlow and load the model
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing.sequence import pad_sequences
    TENSORFLOW_AVAILABLE = True
except ImportError:
    print("TensorFlow is not installed. Neural engine is unavailable.")
    pad_sequences = None

def load_neural_model():
    global model, tokenizer, MODEL_LOADED, TOKENIZER_LOADED
    if not TENSORFLOW_AVAILABLE:
        return False, "TensorFlow/Keras is not installed."
    
    if not os.path.exists(MODEL_PATH):
        return False, f"Model file lstm_model.h5 not found at {MODEL_PATH}."

    try:
        # Load the Keras model
        model = load_model(MODEL_PATH)
        MODEL_LOADED = True
        
        # Load the full tokenizer object to ensure Keras compatibility
        if os.path.exists(TOKENIZER_PATH):
            with open(TOKENIZER_PATH, "rb") as f:
                tokenizer = pickle.load(f)
            TOKENIZER_LOADED = True
            
        return True, "Neural model and tokenizer loaded successfully."
    except Exception as e:
        MODEL_LOADED = False
        return False, f"Failed to load neural model: {str(e)}"

# Attempt load on initialization
load_success, load_message = load_neural_model()
print(load_message)

def check_status():
    """Returns the current readiness state of the AI model engine."""
    # Check if model exists physically
    model_exists = os.path.exists(MODEL_PATH)
    
    if not TENSORFLOW_AVAILABLE:
        return {
            "ready": False,
            "status": "missing_dependencies",
            "message": "TensorFlow/Keras is not installed on the system. Run pip install -r requirements.txt to install dependencies."
        }
    elif not model_exists:
        return {
            "ready": False,
            "status": "missing_weights",
            "message": f"Model weights file 'lstm_model.h5' was not found. Please place the file in the following directory: '{MODELS_DIR}/'."
        }
    elif not MODEL_LOADED:
        # Try reloading once in case it wasn't loaded
        success, msg = load_neural_model()
        if not success:
            return {
                "ready": False,
                "status": "load_error",
                "message": f"Failed to load neural network weights: {msg}"
            }
        
    return {
        "ready": True,
        "status": "ready",
        "message": "Neural engine is online and fully loaded."
    }

def predict_next_word(text: str, temperature: float = 1.0) -> str:
    """Predicts the next word using the trained LSTM model."""
    status = check_status()
    if not status["ready"]:
        raise RuntimeError(status["message"])
        
    # Text preprocessing (same as training pipeline)
    text_clean = text.lower()
    
    # Tokenize input using Keras tokenizer
    seq = tokenizer.texts_to_sequences([text_clean])[0]
    
    # Pad sequences to max_len
    seq_padded = pad_sequences([seq], maxlen=max_len, padding='pre')
    
    # Run prediction
    preds = model.predict(seq_padded, verbose=0)[0]
    
    # Apply Temperature Scaling
    preds = np.asarray(preds).astype('float64')
    # Prevent division by zero or log of zero issues
    preds = np.log(preds + 1e-10) / max(temperature, 0.01)
    exp_preds = np.exp(preds)
    preds_scaled = exp_preds / np.sum(exp_preds)
    
    # Sample from multinomial distribution
    probas = np.random.multinomial(1, preds_scaled, 1)[0]
    pred_index = np.argmax(probas)
    
    # Map back to word
    return index_to_word.get(pred_index, "")


def predict_next_word_with_details(text: str, temperature: float = 1.0) -> dict:
    """Predicts the next word and returns detailed token distributions and gate-level contexts."""
    status = check_status()
    if not status["ready"]:
        raise RuntimeError(status["message"])
        
    text_clean = text.lower()
    
    # Tokenize input using Keras tokenizer
    # If the text is empty or tokenizer yields nothing, fallback safely
    seq = []
    if text_clean.strip():
        # Clean text can be tokenized by splitting or matching words
        # Let's use the tokenizer's built-in conversion
        if tokenizer:
            seq_list = tokenizer.texts_to_sequences([text_clean])
            if seq_list and len(seq_list[0]) > 0:
                seq = seq_list[0]
        
        # Fallback to manual word lookup if tokenizer failed or isn't loaded
        if not seq:
            for word in text_clean.split():
                if word in word_index:
                    seq.append(word_index[word])
    
    # Ensure seq has at least one valid token to avoid TensorFlow issues
    if not seq:
        seq = [1] # fallback to common token
        
    # Pad sequences to max_len
    seq_padded = pad_sequences([seq], maxlen=max_len, padding='pre')
    
    # Run prediction
    preds = model.predict(seq_padded, verbose=0)[0]
    
    # Save raw probabilities (model's true confidence)
    raw_probs = np.asarray(preds).astype('float64')
    
    # Apply Temperature Scaling
    preds_scaled_log = np.log(raw_probs + 1e-10) / max(temperature, 0.01)
    exp_preds = np.exp(preds_scaled_log)
    preds_scaled = exp_preds / np.sum(exp_preds)
    
    # Sample from multinomial distribution
    probas = np.random.multinomial(1, preds_scaled, 1)[0]
    pred_index = np.argmax(probas)
    
    # Get top 5 alternative words (by raw probability, descending)
    top_indices = np.argsort(raw_probs)[-6:][::-1]
    top_candidates = []
    for idx in top_indices:
        word = index_to_word.get(int(idx), "")
        if word and len(top_candidates) < 4:
            top_candidates.append({
                "word": word,
                "probability": float(raw_probs[idx])
            })
            
    chosen_word = index_to_word.get(pred_index, "")
    chosen_prob = float(raw_probs[pred_index])
    
    # Get last 5 tokens for visualization context
    last_tokens = seq[-5:] if len(seq) >= 5 else seq
    token_details = [
        {"token_id": int(tok), "word": index_to_word.get(int(tok), "<unknown>")}
        for tok in last_tokens
    ]
    
    return {
        "word": chosen_word,
        "confidence": chosen_prob,
        "top_candidates": top_candidates,
        "input_tokens": token_details,
        "sequence_len": len(seq)
    }

