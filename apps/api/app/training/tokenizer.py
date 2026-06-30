import os
import pickle
import json
import collections
import pandas as pd
from tensorflow.keras.preprocessing.text import Tokenizer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CLEAN_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "clean_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "app", "models")

# Vocabulary size (matches config or can be passed)
VOCAB_SIZE = 10000

def train_tokenizer(vocab_size=VOCAB_SIZE):
    clean_path = os.path.abspath(CLEAN_DATA_PATH)
    models_dir_path = os.path.abspath(MODELS_DIR)
    
    print(f"Loading cleaned dataset from: {clean_path}")
    if not os.path.exists(clean_path):
        print(f"Error: Clean dataset not found at {clean_path}. Run preprocess.py first.")
        return False
        
    df = pd.read_csv(clean_path)
    quotes = df["cleaned_quote"].dropna().astype(str).tolist()
    
    # Analyze total raw words and lengths
    all_words = []
    sentence_lengths = []
    for quote in quotes:
        words = quote.lower().split()
        all_words.extend(words)
        sentence_lengths.append(len(words))
        
    total_tokens = len(all_words)
    avg_sentence_len = total_tokens / len(quotes) if quotes else 0
    
    # 1. Initialize and fit Tokenizer
    # We use filters="" to preserve punctuation marks as separate tokens (which were spaced during preprocessing)
    tokenizer = Tokenizer(num_words=vocab_size, filters="", oov_token="<OOV>")
    tokenizer.fit_on_texts(quotes)
    
    # 2. Convert texts to sequences to evaluate OOV / unknown token rate
    sequences = tokenizer.texts_to_sequences(quotes)
    
    # OOV token index is always 1 (usually mapped by Keras Tokenizer)
    oov_id = tokenizer.word_index.get("<OOV>", 1)
    
    total_oov_count = 0
    total_token_count = 0
    for seq in sequences:
        total_token_count += len(seq)
        total_oov_count += seq.count(oov_id)
        
    oov_rate = total_oov_count / total_token_count if total_token_count > 0 else 0
    
    # Retrieve word counts and identify most common / rare words
    word_counts = tokenizer.word_counts
    sorted_word_counts = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    
    most_common = sorted_word_counts[:25]
    rare_words = [word for word, count in word_counts.items() if count == 1]
    
    # Save assets to app/models directory
    os.makedirs(models_dir_path, exist_ok=True)
    
    # Pickled Tokenizer object
    tokenizer_pkl_path = os.path.join(models_dir_path, "tokenizer.pkl")
    with open(tokenizer_pkl_path, "wb") as f:
        pickle.dump(tokenizer, f)
        
    # Word Index mapping (JSON)
    word_index_json_path = os.path.join(models_dir_path, "word_index.json")
    with open(word_index_json_path, "w", encoding="utf-8") as f:
        json.dump(tokenizer.word_index, f, indent=2)
        
    # Vocabulary Analysis report
    report = {
        "dataset_statistics": {
            "total_quotes": len(quotes),
            "total_raw_tokens": total_tokens,
            "average_sentence_length": round(avg_sentence_len, 2),
            "max_sentence_length": max(sentence_lengths) if sentence_lengths else 0
        },
        "vocabulary_analysis": {
            "total_unique_words_in_corpus": len(word_counts),
            "tokenizer_vocab_limit": vocab_size,
            "actual_vocab_size_saved": len(tokenizer.word_index),
            "unknown_oov_token_count": total_oov_count,
            "unknown_oov_rate": round(oov_rate, 4),
            "rare_words_count_one": len(rare_words)
        },
        "most_common_words": [{"word": w, "count": c} for w, c in most_common]
    }
    
    report_json_path = os.path.join(models_dir_path, "vocabulary_report.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    # Also mirror tokenizer, word_index, and report in workspace root for final deliverables!
    with open(os.path.join(BASE_DIR, "..", "..", "tokenizer.pkl"), "wb") as f:
        pickle.dump(tokenizer, f)
    with open(os.path.join(BASE_DIR, "..", "..", "word_index.json"), "w", encoding="utf-8") as f:
        json.dump(tokenizer.word_index, f, indent=2)
    with open(os.path.join(BASE_DIR, "..", "..", "vocabulary_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"Tokenizer saved: {tokenizer_pkl_path}")
    print(f"Vocabulary Report saved: {report_json_path}")
    print(f"OOV (Unknown) Rate: {oov_rate * 100:.2f}%")
    return True

if __name__ == "__main__":
    train_tokenizer()
