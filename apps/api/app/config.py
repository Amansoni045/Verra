# Verra Centralized Backend Generation Settings

# Decoding Strategy: "beam" or "top_k"
# We will run both strategies in the benchmark suite and choose the default.
DECODING_STRATEGY = "top_k"

# Top-k Sampling parameters
TOP_K = 8
TEMPERATURE = 0.8
PROBABILITY_FLOOR = 0.01  # Ignore tokens with raw probability below this value

# Early Stopping & Completion parameters
CONFIDENCE_THRESHOLD = 0.025
MAX_COMPLETION_WORDS = 12
MIN_INPUT_WORDS = 3
REPETITION_WINDOW = 4

# Beam Search parameters
BEAM_WIDTH = 3
LENGTH_PENALTY_ALPHA = 0.6  # Standard length normalization penalty

# Quality Filtering parameters
MIN_QUALITY_SCORE = 0.08
SENTENCE_END_BONUS = 0.15
REPETITION_PENALTY_WEIGHT = 0.20
LENGTH_PENALTY_WEIGHT = 0.05
