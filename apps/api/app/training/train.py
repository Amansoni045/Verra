import os
import json
import random
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, SimpleRNN, LSTM, Dense, Dropout

# Enforce strict reproducibility
def set_reproducibility_seeds(seed=42):
    os.environ['PYTHONHASHSEED'] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    tf.keras.utils.set_random_seed(seed)
    tf.config.experimental.enable_op_determinism()

# Architectures
def build_simple_rnn(vocab_size, embedding_dim, rnn_units, input_length):
    model = Sequential([
        Embedding(input_dim=vocab_size, output_dim=embedding_dim, input_length=input_length),
        SimpleRNN(units=rnn_units),
        Dense(units=vocab_size, activation="softmax")
    ])
    return model

def build_lstm(vocab_size, embedding_dim, lstm_units, dropout_rate, input_length):
    model = Sequential([
        Embedding(input_dim=vocab_size, output_dim=embedding_dim, input_length=input_length),
        LSTM(units=lstm_units),
        Dropout(dropout_rate),
        Dense(units=vocab_size, activation="softmax")
    ])
    return model

def build_stacked_lstm(vocab_size, embedding_dim, lstm_units, dropout_rate, input_length):
    model = Sequential([
        Embedding(input_dim=vocab_size, output_dim=embedding_dim, input_length=input_length),
        LSTM(units=lstm_units, return_sequences=True),
        Dropout(dropout_rate),
        LSTM(units=lstm_units),
        Dropout(dropout_rate),
        Dense(units=vocab_size, activation="softmax")
    ])
    return model

def compile_and_train_model(
    model_type="lstm",
    vocab_size=10000,
    embedding_dim=64,
    rnn_units=128,
    dropout_rate=0.2,
    sequence_length=15,
    optimizer_name="adam",
    learning_rate=0.001,
    epochs=10,
    batch_size=128,
    validation_split=0.1,
    experiment_dir="./experiment_run"
):
    set_reproducibility_seeds(42)
    os.makedirs(experiment_dir, exist_ok=True)
    
    # 1. Compile model input length
    input_length = sequence_length
    
    if model_type == "simple_rnn":
        model = build_simple_rnn(vocab_size, embedding_dim, rnn_units, input_length)
    elif model_type == "stacked_lstm":
        model = build_stacked_lstm(vocab_size, embedding_dim, rnn_units, dropout_rate, input_length)
    else:  # default "lstm"
        model = build_lstm(vocab_size, embedding_dim, rnn_units, dropout_rate, input_length)
        
    # 2. Select optimizer
    if optimizer_name.lower() == "rmsprop":
        opt = tf.keras.optimizers.RMSprop(learning_rate=learning_rate)
    else:
        opt = tf.keras.optimizers.Adam(learning_rate=learning_rate)
        
    model.compile(
        optimizer=opt,
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    
    print(f"\n--- Training {model_type.upper()} model ---")
    print(f"Hyperparameters: embed_dim={embedding_dim}, units={rnn_units}, dropout={dropout_rate}, seq_len={sequence_length}, optimizer={optimizer_name}")
    model.summary()
    
    # 3. Load dataset sequences
    from .dataset import load_dataset_sequences
    X, y = load_dataset_sequences(max_sequence_length=sequence_length, vocab_size=vocab_size)
    
    # 4. Load callbacks
    from .callbacks import get_training_callbacks
    callbacks = get_training_callbacks(experiment_dir, best_model_filename="best_model.h5")
    
    # 5. Fit model
    history = model.fit(
        X, y,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=validation_split,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save final model weights
    final_model_path = os.path.join(experiment_dir, "final_model.h5")
    model.save(final_model_path)
    print(f"Final model saved to: {final_model_path}")
    
    # Save training history JSON
    history_json_path = os.path.join(experiment_dir, "training_history.json")
    # Convert lists of floats to ensure JSON compatibility
    clean_history = {k: [float(val) for val in v] for k, v in history.history.items()}
    with open(history_json_path, "w", encoding="utf-8") as f:
        json.dump(clean_history, f, indent=2)
        
    # Save config details
    config_json_path = os.path.join(experiment_dir, "config.json")
    config = {
        "model_type": model_type,
        "vocab_size": vocab_size,
        "embedding_dim": embedding_dim,
        "rnn_units": rnn_units,
        "dropout_rate": dropout_rate,
        "sequence_length": sequence_length,
        "optimizer": optimizer_name,
        "learning_rate": learning_rate,
        "epochs": epochs,
        "batch_size": batch_size
    }
    with open(config_json_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
        
    print(f"Training history saved to: {history_json_path}")
    return model, clean_history
