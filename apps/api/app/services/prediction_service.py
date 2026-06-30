import numpy as np
import re
from typing import Dict, List, Any
from app.core.config import settings
from app.ml.tokenizer import text_to_tokens, index_to_word
from app.ml.predictor import predict_single_step, check_engine_status

def compute_quality_score(words: List[str], confidences: List[float], stopping_reason: str) -> float:
    """Calculates a generation quality score using confidence, completion, and repetition metrics."""
    if not words:
        return 0.0
    
    # 1. Average Token Confidence
    avg_conf = sum(confidences) / len(confidences)
    
    # 2. Sentence Completion Bonus
    bonus = 0.0
    if stopping_reason == "sentence_end":
        bonus = settings.SENTENCE_END_BONUS
        
    # 3. Repetition Penalty
    unique_words = set(words)
    rep_ratio = (len(words) - len(unique_words)) / len(words)
    rep_penalty = rep_ratio * settings.REPETITION_PENALTY_WEIGHT
    
    # 4. Length Penalty (penalize extremely short, incomplete answers)
    length_penalty = 0.0
    if len(words) < 3 and stopping_reason != "sentence_end":
        length_penalty = settings.LENGTH_PENALTY_WEIGHT * (3 - len(words))
        
    score = avg_conf + bonus - rep_penalty - length_penalty
    return max(0.0, min(1.0, score))

def format_natural_english(prompt: str, generated_words: List[str]) -> str:
    """Formats raw generated tokens into natural English (spacing, capitalization, punctuation)."""
    if not generated_words:
        return ""
    
    # Clean spacing
    text = " ".join(generated_words)
    
    # Capitalize the first word if prompt ends in punctuation or is empty
    prompt_trimmed = prompt.strip()
    if not prompt_trimmed or prompt_trimmed[-1] in [".", "?", "!"]:
        text = text[0].upper() + text[1:] if len(text) > 0 else text
        
    # Fix spacing before punctuation (e.g., "word ." -> "word.")
    text = re.sub(r"\s+([.,!?;:])", r"\1", text)
    
    # Append trailing period if terminal punctuation is missing
    if text and text[-1] not in [".", "?", "!"]:
        text += "."
        
    return text

def generate_top_k(prompt: str, temperature: float = 0.8) -> Dict[str, Any]:
    """Generates next words using Top-k temperature sampling with early stopping and quality filtering."""
    tokens = text_to_tokens(prompt)
    generated_words = []
    confidences = []
    details = []
    stopping_reason = "max_words"
    
    recent_word_ids = []
    
    for _ in range(settings.MAX_COMPLETION_WORDS):
        # Prevent immediate double repeats (e.g. "the the", "and and")
        exclude_word_ids = recent_word_ids[-settings.REPETITION_WINDOW:] if len(recent_word_ids) >= 1 else []
        
        # Predict next word
        res = predict_single_step(tokens, temperature, exclude_word_ids)
        
        word = res["word"]
        word_id = res["word_id"]
        confidence = res["confidence"]
        
        if not word:
            stopping_reason = "eos"
            break
            
        # Confidence threshold check
        if confidence < settings.CONFIDENCE_THRESHOLD:
            stopping_reason = "low_confidence"
            break
            
        generated_words.append(word)
        confidences.append(confidence)
        details.append(res)
        
        # Sentence end punctuation check
        if word in [".", "?", "!"] or any(word.endswith(p) for p in [".", "?", "!"]):
            stopping_reason = "sentence_end"
            break
            
        tokens.append(word_id)
        recent_word_ids.append(word_id)
        
    # Quality scoring
    quality_score = compute_quality_score(generated_words, confidences, stopping_reason)
    
    # Capitalization & Spacing
    formatted_text = format_natural_english(prompt, generated_words)
    
    # Clean details of raw_probs to prevent serialization errors
    clean_details = []
    for d in details:
        clean_d = {k: v for k, v in d.items() if k != "raw_probs"}
        clean_details.append(clean_d)
        
    return {
        "generated_text": formatted_text,
        "words": generated_words,
        "details": clean_details,
        "confidence": sum(confidences) / len(confidences) if confidences else 0.0,
        "quality_score": quality_score,
        "stopping_reason": stopping_reason
    }

def generate_beam_search(prompt: str) -> Dict[str, Any]:
    """Generates next words using Beam Search decoding with length-normalization and quality filtering."""
    initial_tokens = text_to_tokens(prompt)
    
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
    
    for _ in range(settings.MAX_COMPLETION_WORDS):
        candidates = []
        
        for beam in beams:
            if beam["finished"]:
                candidates.append(beam)
                continue
                
            # Exclude repetition window
            recent_tokens = beam["tokens"][-settings.REPETITION_WINDOW:]
            
            # Run inference step
            res = predict_single_step(beam["tokens"], settings.TEMPERATURE, recent_tokens)
            raw_probs = res["raw_probs"]
            
            # Keep top BEAM_WIDTH tokens
            top_indices = np.argsort(raw_probs)[-settings.BEAM_WIDTH:]
            
            for idx in top_indices:
                prob = raw_probs[idx]
                word = index_to_word.get(int(idx), "")
                
                if not word:
                    candidates.append({**beam, "finished": True})
                    continue
                    
                # New beam candidate
                new_tokens = beam["tokens"] + [int(idx)]
                new_words = beam["words"] + [word]
                new_log_prob = beam["log_prob"] + np.log(prob + 1e-10)
                new_confidences = beam["confidences"] + [float(prob)]
                
                # Check sentence boundary
                is_sentence_end = word in [".", "?", "!"] or any(word.endswith(p) for p in [".", "?", "!"])
                is_low_conf = prob < settings.CONFIDENCE_THRESHOLD
                
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
            lp = ((5 + length) ** settings.LENGTH_PENALTY_ALPHA) / ((5 + 1) ** settings.LENGTH_PENALTY_ALPHA)
            return b["log_prob"] / lp

        # Keep the top BEAM_WIDTH beams
        candidates.sort(key=get_score, reverse=True)
        beams = candidates[:settings.BEAM_WIDTH]
        
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
    elif last_conf < settings.CONFIDENCE_THRESHOLD:
        stopping_reason = "low_confidence"
    elif len(best_beam["words"]) < settings.MAX_COMPLETION_WORDS:
        stopping_reason = "eos"
    else:
        stopping_reason = "max_words"
        
    quality_score = compute_quality_score(best_beam["words"], best_beam["confidences"], stopping_reason)
    formatted_text = format_natural_english(prompt, best_beam["words"])
    
    # Clean details of raw_probs to prevent serialization errors
    clean_details = []
    for d in best_beam["details"]:
        clean_d = {k: v for k, v in d.items() if k != "raw_probs"}
        clean_details.append(clean_d)
        
    return {
        "generated_text": formatted_text,
        "words": best_beam["words"],
        "details": clean_details,
        "confidence": sum(best_beam["confidences"]) / len(best_beam["confidences"]) if best_beam["confidences"] else 0.0,
        "quality_score": quality_score,
        "stopping_reason": stopping_reason
    }

def get_prediction(prompt: str, strategy: str = None, temperature: float = None) -> Dict[str, Any]:
    """Retrieves autocomplete text prediction using the specified strategy, logging performance metrics."""
    import time
    from app.api.routes.health import track_prediction, track_prediction_failure

    # Fallback to configured settings defaults
    decoding_strategy = strategy or settings.DECODING_STRATEGY
    temp = temperature or settings.TEMPERATURE

    t_start = time.time()
    try:
        if decoding_strategy == "beam":
            res = generate_beam_search(prompt)
        else:
            res = generate_top_k(prompt, temp)
            
        latency_ms = (time.time() - t_start) * 1000
        track_prediction(latency_ms, res.get("confidence", 0.0))
        return res
    except Exception as e:
        track_prediction_failure()
        raise e
