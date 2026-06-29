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
