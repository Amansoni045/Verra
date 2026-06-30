import os
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint,
    CSVLogger,
    TensorBoard
)

def get_training_callbacks(experiment_dir: str, best_model_filename="best_model.h5"):
    """Returns a list of Keras callbacks for EarlyStopping, LR reduction, checkpointing, and logging."""
    os.makedirs(experiment_dir, exist_ok=True)
    
    checkpoint_path = os.path.join(experiment_dir, best_model_filename)
    csv_log_path = os.path.join(experiment_dir, "training_log.csv")
    tensorboard_log_dir = os.path.join(experiment_dir, "logs")
    
    callbacks = [
        # Stop training when validation loss stops improving
        EarlyStopping(
            monitor="val_loss",
            patience=8,
            restore_best_weights=True,
            verbose=1
        ),
        
        # Reduce learning rate when validation loss plateaus
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-5,
            verbose=1
        ),
        
        # Checkpoint: save the best model weights
        ModelCheckpoint(
            filepath=checkpoint_path,
            monitor="val_loss",
            save_best_only=True,
            verbose=1
        ),
        
        # CSV logger: save loss and accuracy history per epoch
        CSVLogger(
            filename=csv_log_path,
            separator=",",
            append=False
        ),
        
        # Tensorboard log metrics for visualization
        TensorBoard(
            log_dir=tensorboard_log_dir,
            histogram_freq=0,
            write_graph=True
        )
    ]
    
    return callbacks
