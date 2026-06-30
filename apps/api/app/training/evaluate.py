import os
import json
import pickle
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "app", "models")

def evaluate_trained_model(
    model_path: str,
    sequence_length=15,
    vocab_size=10000,
    validation_split=0.1,
    output_report_path=None
):
    print(f"Evaluating model: {model_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
        
    model = load_model(model_path)
    
    # 1. Load dataset sequences
    from .dataset import load_dataset_sequences
    X, y = load_dataset_sequences(max_sequence_length=sequence_length, vocab_size=vocab_size)
    
    # Recreate the validation split (last 10% of samples)
    split_idx = int(len(X) * (1 - validation_split))
    X_val = X[split_idx:]
    y_val = y[split_idx:]
    
    if len(X_val) == 0:
        print("Warning: Validation dataset slice is empty. Evaluating on training dataset instead.")
        X_val, y_val = X, y
        
    print(f"Validation dataset size: {len(X_val)} samples.")
    
    # 2. Compute Loss and Accuracy
    loss, accuracy = model.evaluate(X_val, y_val, batch_size=128, verbose=0)
    perplexity = np.exp(loss)
    
    # 3. Compute Average Prediction Confidence on validation dataset
    preds = model.predict(X_val, batch_size=128, verbose=0)
    true_indices = np.argmax(y_val, axis=-1)
    
    correct_token_probabilities = preds[np.arange(len(preds)), true_indices]
    avg_confidence = float(np.mean(correct_token_probabilities))
    
    # 4. Assess Completion & Repetitions over a subset of validation prompts (first 50 prompts)
    completion_successes = 0
    total_repetitions = 0
    eval_count = min(50, len(X_val))
    
    # Reload tokenizer for decoding
    tokenizer_path = os.path.join(os.path.abspath(MODELS_DIR), "tokenizer.pkl")
    with open(tokenizer_path, "rb") as f:
        tokenizer = pickle.load(f)
    index_to_word = {v: k for k, v in tokenizer.word_index.items()}
    
    for idx in range(eval_count):
        seed_seq = list(X_val[idx])
        # Strip padding zeros to get the actual seed sequence
        seed_seq = [token_id for token_id in seed_seq if token_id > 0]
        
        generated = []
        sentence_ended = False
        
        # Autoregressive loop up to 12 words
        for _ in range(12):
            if len(seed_seq) == 0:
                break
            padded_input = tf.keras.preprocessing.sequence.pad_sequences(
                [seed_seq], maxlen=sequence_length, padding="pre"
            )
            prob_dist = model.predict(padded_input, verbose=0)[0]
            next_token = np.argmax(prob_dist)
            
            word = index_to_word.get(next_token, "")
            if not word or word == "<OOV>":
                break
                
            generated.append(word)
            seed_seq.append(next_token)
            
            # Sentence early stopping
            if word in [".", "?", "!"]:
                sentence_ended = True
                break
                
        if sentence_ended:
            completion_successes += 1
            
        # Check repetition rate: duplicate word count ratio
        if len(generated) > 2:
            unique_words = set(generated)
            repetitions = len(generated) - len(unique_words)
            total_repetitions += (repetitions / len(generated))
            
    sentence_completion_success_rate = (completion_successes / eval_count) if eval_count > 0 else 0.0
    repetition_rate = (total_repetitions / eval_count) if eval_count > 0 else 0.0
    
    report = {
        "validation_loss": float(loss),
        "validation_accuracy": float(accuracy),
        "perplexity": float(perplexity),
        "average_prediction_confidence": float(avg_confidence),
        "sentence_completion_success_rate": float(sentence_completion_success_rate),
        "repetition_rate": float(repetition_rate)
    }
    
    if output_report_path:
        os.makedirs(os.path.dirname(output_report_path), exist_ok=True)
        with open(output_report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"Evaluation report saved to: {output_report_path}")
        
    return report

if __name__ == "__main__":
    # Test execution
    model_h5 = os.path.join(os.path.abspath(MODELS_DIR), "best_model.h5")
    if os.path.exists(model_h5):
        evaluate_trained_model(model_h5, output_report_path="./eval_test.json")
