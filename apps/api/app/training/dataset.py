import os
import pickle
import numpy as np
import pandas as pd
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.utils import to_categorical

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CLEAN_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "clean_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "app", "models")

def load_dataset_sequences(max_sequence_length=20, vocab_size=10000):
    clean_path = os.path.abspath(CLEAN_DATA_PATH)
    tokenizer_path = os.path.join(os.path.abspath(MODELS_DIR), "tokenizer.pkl")
    
    if not os.path.exists(tokenizer_path):
        raise FileNotFoundError(f"Tokenizer not found at {tokenizer_path}. Run tokenizer.py first.")
        
    with open(tokenizer_path, "rb") as f:
        tokenizer = pickle.load(f)
        
    print(f"Loading cleaned data from: {clean_path}")
    df = pd.read_csv(clean_path)
    quotes = df["cleaned_quote"].dropna().astype(str).tolist()
    
    # 1. Convert texts to sequences of token IDs
    sequences = tokenizer.texts_to_sequences(quotes)
    
    X = []
    y = []
    
    # 2. Slice sequences to sliding window segments
    for seq in sequences:
        for i in range(1, len(seq)):
            input_seq = seq[:i]
            output_seq = seq[i]
            
            # Limit the context window size to max_sequence_length
            if len(input_seq) > max_sequence_length:
                input_seq = input_seq[-max_sequence_length:]
                
            X.append(input_seq)
            y.append(output_seq)
            
    X_padded = pad_sequences(X, maxlen=max_sequence_length, padding="pre")
    y_array = np.array(y)
    
    # 3. One-hot encode next word labels
    # num_classes must match tokenizer vocab limit
    y_one_hot = to_categorical(y_array, num_classes=vocab_size)
    
    print(f"Dataset compiled: X shape = {X_padded.shape}, y shape = {y_one_hot.shape}")
    return X_padded, y_one_hot
