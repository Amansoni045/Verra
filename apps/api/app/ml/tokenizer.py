import os
import pickle
import json
import re
from typing import List, Dict

# Resolve assets path relative to app root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

WORD_INDEX_PATH = os.path.join(MODELS_DIR, "word_index.json")
TOKENIZER_PATH = os.path.join(MODELS_DIR, "tokenizer.pkl")
MAX_LEN_PATH = os.path.join(MODELS_DIR, "max_len.pkl")

# Shared state
tokenizer = None
word_index: Dict[str, int] = {}
index_to_word: Dict[int, str] = {}
max_len: int = 15  # default baseline window length

def load_tokenizer_assets():
    """Loads Keras tokenizer pickle, word indexes, and context configuration."""
    global tokenizer, word_index, index_to_word, max_len
    
    # 1. Load word index mapping
    if os.path.exists(WORD_INDEX_PATH):
        try:
            with open(WORD_INDEX_PATH, "r", encoding="utf-8") as f:
                word_index = json.load(f)
                index_to_word = {int(idx): word for word, idx in word_index.items()}
        except Exception as e:
            print(f"Tokenizer warning: failed to parse word_index.json: {e}")

    # 2. Load max sequence length
    if os.path.exists(MAX_LEN_PATH):
        try:
            with open(MAX_LEN_PATH, "rb") as f:
                max_len = pickle.load(f)
        except Exception as e:
            print(f"Tokenizer warning: failed to parse max_len.pkl: {e}")

    # 3. Load Keras tokenizer pickle
    if os.path.exists(TOKENIZER_PATH):
        try:
            with open(TOKENIZER_PATH, "rb") as f:
                tokenizer = pickle.load(f)
        except Exception as e:
            print(f"Tokenizer warning: failed to load tokenizer.pkl: {e}")

# Trigger load on module import
load_tokenizer_assets()

def preprocess_text(text: str) -> str:
    """Preprocesses input text by normalizing spaces, quotes, and punctuation."""
    if not text:
        return ""
    # Standardize curly quotes and apostrophes
    text = text.replace("’", "'").replace("`", "'").replace("“", '"').replace("”", '"')
    # Normalize whitespaces to single space
    text = re.sub(r"\s+", " ", text).strip()
    return text

def text_to_tokens(text: str) -> List[int]:
    """Converts a raw string prompt into a list of vocabulary token IDs."""
    clean_text = preprocess_text(text).lower()
    if not clean_text:
        return []

    tokens = []
    # Try using the compiled Keras Tokenizer
    if tokenizer:
        try:
            seqs = tokenizer.texts_to_sequences([clean_text])
            if seqs and len(seqs[0]) > 0:
                tokens = seqs[0]
        except Exception:
            pass

    # Fallback to manual word indexing if tokenizer is missing or fails
    if not tokens:
        words = re.findall(r"\b\w+\b", clean_text)
        for w in words:
            if w in word_index:
                tokens.append(int(word_index[w]))
                
    # Optimize window constraint: crop prompt tokens to fit maximum sequence context length
    if len(tokens) > max_len:
        tokens = tokens[-max_len:]

    return tokens

def tokens_to_text(tokens: List[int]) -> str:
    """Reconstructs a plaintext sentence from a list of token IDs."""
    words = [index_to_word.get(tok, "") for tok in tokens]
    return " ".join([w for w in words if w])
