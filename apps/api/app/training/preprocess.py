import os
import re
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "qoute_dataset.csv")
CLEAN_DATA_PATH = os.path.join(BASE_DIR, "..", "..", "clean_dataset.csv")

def clean_quote_text(text: str) -> str:
    if not isinstance(text, str) or not text.strip():
        return ""
    
    # 1. Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", "", text)
    
    # 2. Remove emojis (Unicode ranges for emoticons, symbols, pictographs)
    text = re.sub(r"[\U00010000-\U0010ffff]", "", text)
    
    # 3. Normalize curly quotes and apostrophes
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("‘", "'").replace("’", "'").replace("`", "'")
    
    # 4. Remove duplicate double quotes (e.g. ""quote"" -> "quote")
    text = re.sub(r'"+', '"', text)
    
    # 5. Preserve punctuation by adding spaces around major marks (. , ! ?)
    # This ensures they are treated as independent tokens during space split
    text = re.sub(r"([.,!?])", r" \1 ", text)
    
    # 6. Collapse repeated whitespace
    text = re.sub(r"\s+", " ", text).strip()
    
    return text

def preprocess_dataset():
    raw_path = os.path.abspath(RAW_DATA_PATH)
    clean_path = os.path.abspath(CLEAN_DATA_PATH)
    
    print(f"Loading raw dataset from: {raw_path}")
    if not os.path.exists(raw_path):
        print(f"Error: Raw dataset file not found at {raw_path}")
        return False
        
    df = pd.read_csv(raw_path)
    
    # Check malformed rows (where quote column is missing or null)
    if "quote" not in df.columns:
        print("Error: Column 'quote' not found in dataset.")
        return False
        
    initial_rows = len(df)
    
    # Drop rows with null quotes or authors
    df = df.dropna(subset=["quote"])
    
    # Apply text cleaning
    df["cleaned_quote"] = df["quote"].apply(clean_quote_text)
    
    # Drop rows that became empty after cleaning
    df = df[df["cleaned_quote"].str.strip() != ""]
    
    # Remove duplicate quotes based on the cleaned text
    df = df.drop_duplicates(subset=["cleaned_quote"])
    
    final_rows = len(df)
    print(f"Processed dataset: {initial_rows} raw rows -> {final_rows} cleaned & unique rows.")
    
    # Save cleaned dataset
    # We save both raw quote (for reference) and cleaned_quote
    df.to_csv(clean_path, index=False, columns=["cleaned_quote", "Author"])
    print(f"Cleaned dataset saved successfully to: {clean_path}")
    return True

if __name__ == "__main__":
    preprocess_dataset()
