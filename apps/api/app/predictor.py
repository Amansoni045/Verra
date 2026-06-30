import os
import pickle
import json
import re
import numpy as np
from app.config import (
    TOP_K,
    TEMPERATURE,
    CONFIDENCE_THRESHOLD,
    MAX_COMPLETION_WORDS,
    REPETITION_WINDOW,
    BEAM_WIDTH,
    LENGTH_PENALTY_ALPHA,
    MIN_QUALITY_SCORE,
    SENTENCE_END_BONUS,
    REPETITION_PENALTY_WEIGHT,
    LENGTH_PENALTY_WEIGHT
)

# Resolve model assets paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

MAX_LEN_PATH = os.path.join(MODELS_DIR, "max_len.pkl")
TOKENIZER_PATH = os.path.join(MODELS_DIR, "tokenizer.pkl")
WORD_INDEX_PATH = os.path.join(MODELS_DIR, "word_index.json")
MODEL_PATH = os.path.join(MODELS_DIR, "best_model.h5")
if not os.path.exists(MODEL_PATH):
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

# 1. Attempt to load the word index from JSON
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
        return False, f"Model file best_model.h5/lstm_model.h5 not found at {MODEL_PATH}."

    try:
        model = load_model(MODEL_PATH)
        MODEL_LOADED = True
        
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
            "message": f"Model weights file 'lstm_model.h5' was not found."
        }
    elif not MODEL_LOADED:
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

def preprocess_text_input(text: str) -> str:
    """Preprocesses input text (normalization, apostrophes, duplicate spacing)."""
    if not text:
        return ""
    # Standardize apostrophes and quotes
    text = text.replace("’", "'").replace("`", "'").replace("“", '"').replace("”", '"')
    # Normalize whitespaces to single spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text

def get_token_sequence(text: str) -> list:
    """Safely converts input text into a list of token IDs, ignoring unknown (OOV) words."""
    clean_text = preprocess_text_input(text).lower()
    if not clean_text:
        return []

    tokens = []
    # Use tokenizer if available
    if tokenizer:
        try:
            seqs = tokenizer.texts_to_sequences([clean_text])
            if seqs and len(seqs[0]) > 0:
                tokens = seqs[0]
        except Exception:
            pass

    # Manual word-index fallback if tokenizer fails
    if not tokens:
        # Split on spaces while stripping punctuation
        words = re.findall(r"\b\w+\b", clean_text)
        for w in words:
            if w in word_index:
                tokens.append(int(word_index[w]))
            # Out-of-vocabulary (OOV) tokens are safely ignored to avoid crash

    # Optimize Context Window: crop sequence to the model's max training length
    if len(tokens) > max_len:
        tokens = tokens[-max_len:]

    return tokens

def compute_quality_score(words: list, confidences: list, stopping_reason: str) -> float:
    """Calculates a generation quality score using confidence, completion, and repetition metrics."""
    if not words:
        return 0.0
    
    # 1. Average Token Confidence
    avg_conf = sum(confidences) / len(confidences)
    
    # 2. Sentence Completion Bonus
    bonus = 0.0
    if stopping_reason == "sentence_end":
        bonus = SENTENCE_END_BONUS
        
    # 3. Repetition Penalty
    unique_words = set(words)
    rep_ratio = (len(words) - len(unique_words)) / len(words)
    rep_penalty = rep_ratio * REPETITION_PENALTY_WEIGHT
    
    # 4. Length Penalty (penalize extremely short, incomplete answers)
    length_penalty = 0.0
    if len(words) < 3 and stopping_reason != "sentence_end":
        length_penalty = LENGTH_PENALTY_WEIGHT * (3 - len(words))
        
    score = avg_conf + bonus - rep_penalty - length_penalty
    return max(0.0, min(1.0, score))

def format_natural_english(prompt: str, generated_words: list) -> str:
    """Formats raw generated tokens into natural English (spacing, capitalization, punctuation)."""
    if not generated_words:
        return ""
    
    # Capitalize the first word if the prompt ends in sentence punctuation or is empty
    text = " ".join(generated_words)
    
    # Simple heuristic to capitalize first letter
    prompt_trimmed = prompt.strip()
    if not prompt_trimmed or prompt_trimmed[-1] in [".", "?", "!"]:
        text = text[0].upper() + text[1:] if len(text) > 0 else text
        
    # Fix spaces before punctuation (e.g. "word ." -> "word.")
    text = re.sub(r"\s+([.,!?;:])", r"\1", text)
    
    # Append terminal punctuation if not present
    if text and text[-1] not in [".", "?", "!"]:
        text += "."
        
    return text

def predict_single_step(tokens: list, temperature: float = 0.8, exclude_word_ids: list = None) -> dict:
    """Predicts a single next token distribution and returns the sampled choice and alternatives."""
    status = check_status()
    if not status["ready"]:
        raise RuntimeError(status["message"])

    if not tokens:
        tokens = [1] # safe fallback token
        
    # Pad sequence to match training config
    seq_padded = pad_sequences([tokens], maxlen=max_len, padding='pre')
    
    # Run forward pass
    preds = model.predict(seq_padded, verbose=0)[0]
    raw_probs = np.asarray(preds).astype('float64')
    
    # Exclude repeated word tokens if requested
    if exclude_word_ids:
        for ex_id in exclude_word_ids:
            if ex_id < len(raw_probs):
                raw_probs[ex_id] = 0.0
                
    # Normalize probabilities after modification
    prob_sum = np.sum(raw_probs)
    if prob_sum > 0:
        raw_probs = raw_probs / prob_sum
    else:
        # Fallback if everything is zeroed out
        raw_probs = np.ones_like(raw_probs) / len(raw_probs)

    # Implement Top-k filtering: keep only the top TOP_K tokens
    top_indices = np.argsort(raw_probs)[-TOP_K:]
    
    # Zero out extremely low probabilities in top-k
    filtered_probs = np.zeros_like(raw_probs)
    for idx in top_indices:
        if raw_probs[idx] >= 0.01: # PROBABILITY_FLOOR
            filtered_probs[idx] = raw_probs[idx]
            
    # Re-normalize top-k
    filt_sum = np.sum(filtered_probs)
    if filt_sum > 0:
        filtered_probs = filtered_probs / filt_sum
    else:
        # fallback to raw if top-k is completely empty
        filtered_probs = raw_probs
        
    # Apply Temperature Scaling
    log_probs = np.log(filtered_probs + 1e-10) / max(temperature, 0.01)
    exp_probs = np.exp(log_probs)
    final_scaled_probs = exp_probs / np.sum(exp_probs)
    
    # Sample index using probabilities
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

def generate_top_k(prompt: str, temperature: float = 0.8) -> dict:
    """Generates next words using Top-k temperature sampling with early stopping and quality filtering."""
    tokens = get_token_sequence(prompt)
    generated_words = []
    confidences = []
    details = []
    stopping_reason = "max_words"
    
    recent_word_ids = []
    
    for _ in range(MAX_COMPLETION_WORDS):
        # Prevent immediate double repeats (e.g. "the the", "and and")
        exclude_word_ids = recent_word_ids[-REPETITION_WINDOW:] if len(recent_word_ids) >= 1 else []
        
        # Predict next word
        res = predict_single_step(tokens, temperature, exclude_word_ids)
        
        word = res["word"]
        word_id = res["word_id"]
        confidence = res["confidence"]
        
        if not word:
            stopping_reason = "eos"
            break
            
        # Confidence threshold check
        if confidence < CONFIDENCE_THRESHOLD:
            stopping_reason = "low_confidence"
            break
            
        generated_words.append(word)
        confidences.append(confidence)
        details.append(res)
        
        # Sentence end punctuation check (custom end points)
        if word in [".", "?", "!"] or any(word.endswith(p) for p in [".", "?", "!"]):
            stopping_reason = "sentence_end"
            break
            
        tokens.append(word_id)
        recent_word_ids.append(word_id)
        
    # Quality scoring
    quality_score = compute_quality_score(generated_words, confidences, stopping_reason)
    
    # Capitalization & Spacing
    formatted_text = format_natural_english(prompt, generated_words)
    
    return {
        "generated_text": formatted_text,
        "words": generated_words,
        "details": details,
        "confidence": sum(confidences) / len(confidences) if confidences else 0.0,
        "quality_score": quality_score,
        "stopping_reason": stopping_reason
    }

def generate_beam_search(prompt: str) -> dict:
    """Generates next words using Beam Search decoding with length-normalization and quality filtering."""
    initial_tokens = get_token_sequence(prompt)
    
    # Each beam contains: {tokens, words, log_prob, confidences, details, finished}
    beams = [{
        "tokens": list(initial_tokens),
        "words": [],
        "log_prob": 0.0,
        "confidences": [],
        "details": [],
        "finished": False
    }]
    
    stopping_reason = "max_words"
    
    for step in range(MAX_COMPLETION_WORDS):
        candidates = []
        
        for beam in beams:
            if beam["finished"]:
                candidates.append(beam)
                continue
                
            # Exclude repetition window
            recent_tokens = beam["tokens"][-REPETITION_WINDOW:]
            
            # Run inference step
            res = predict_single_step(beam["tokens"], TEMPERATURE, recent_tokens)
            raw_probs = res["raw_probs"]
            
            # Keep top BEAM_WIDTH tokens
            top_indices = np.argsort(raw_probs)[-BEAM_WIDTH:]
            
            for idx in top_indices:
                prob = raw_probs[idx]
                word = index_to_word.get(int(idx), "")
                
                if not word:
                    # Treat as OOV / finished
                    candidates.append({**beam, "finished": True})
                    continue
                    
                # New beam candidate
                new_tokens = beam["tokens"] + [int(idx)]
                new_words = beam["words"] + [word]
                new_log_prob = beam["log_prob"] + np.log(prob + 1e-10)
                new_confidences = beam["confidences"] + [prob]
                
                # Check sentence boundary
                is_sentence_end = word in [".", "?", "!"] or any(word.endswith(p) for p in [".", "?", "!"])
                is_low_conf = prob < CONFIDENCE_THRESHOLD
                
                new_finished = beam["finished"] or is_sentence_end or is_low_conf
                
                candidates.append({
                    "tokens": new_tokens,
                    "words": new_words,
                    "log_prob": new_log_prob,
                    "confidences": new_confidences,
                    "details": beam["details"] + [res],
                    "finished": new_finished
                })
                
        # Length normalization score formula
        def get_score(b):
            length = len(b["words"])
            if length == 0:
                return -9999.0
            # Length normalization alpha formula
            lp = ((5 + length) ** LENGTH_PENALTY_ALPHA) / ((5 + 1) ** LENGTH_PENALTY_ALPHA)
            return b["log_prob"] / lp

        # Keep the top BEAM_WIDTH beams
        candidates.sort(key=get_score, reverse=True)
        beams = candidates[:BEAM_WIDTH]
        
        # If all beams are finished, stop searching early
        if all(b["finished"] for b in beams):
            break
            
    # Get the best beam
    best_beam = beams[0]
    
    # Establish stopping reason
    last_word = best_beam["words"][-1] if best_beam["words"] else ""
    last_conf = best_beam["confidences"][-1] if best_beam["confidences"] else 0.0
    
    if last_word in [".", "?", "!"] or any(last_word.endswith(p) for p in [".", "?", "!"]):
        stopping_reason = "sentence_end"
    elif last_conf < CONFIDENCE_THRESHOLD:
        stopping_reason = "low_confidence"
    elif len(best_beam["words"]) < MAX_COMPLETION_WORDS:
        stopping_reason = "eos"
    else:
        stopping_reason = "max_words"
        
    quality_score = compute_quality_score(best_beam["words"], best_beam["confidences"], stopping_reason)
    formatted_text = format_natural_english(prompt, best_beam["words"])
    
    return {
        "generated_text": formatted_text,
        "words": best_beam["words"],
        "details": best_beam["details"],
        "confidence": sum(best_beam["confidences"]) / len(best_beam["confidences"]) if best_beam["confidences"] else 0.0,
        "quality_score": quality_score,
        "stopping_reason": stopping_reason
    }
