import os
import sys
import json
import time

# Ensure apps/api is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.predictor import check_status, generate_top_k, generate_beam_search

# Prompt dataset: 7 domains, 20 prompts each (140 total)
PROMPT_DATASET = {
    "Motivational Writing": [
        "The future belongs",
        "Every challenge begins",
        "I believe that",
        "Never give up on",
        "The only limit to",
        "Success is not final",
        "Believe you can and",
        "Your time is limited",
        "The secret of getting",
        "Do not wait for",
        "It always seems impossible",
        "The only way to",
        "You miss one hundred",
        "Our greatest weakness lies",
        "Fall seven times and",
        "An obstacle is often",
        "Keep your face always",
        "Happiness is not something",
        "Opportunities don't happen you",
        "Action is the foundational"
    ],
    "Stories": [
        "Once upon a time",
        "The train slipped into",
        "In the silence of",
        "The storm raged outside",
        "He opened the dusty",
        "She looked out the",
        "Under the pale light",
        "The footsteps echoed down",
        "A cold wind blew",
        "They arrived at the",
        "Deep within the dark",
        "The old grandfather clock",
        "No one expected the",
        "With a heavy heart",
        "The maps showed a",
        "A sudden noise woke",
        "The shadows seemed to",
        "Looking into the mirror",
        "As the sun set",
        "He held the gold"
    ],
    "Technology": [
        "Artificial intelligence will",
        "The future of software",
        "Computers are built to",
        "A new algorithm could",
        "The code failed to",
        "A database query should",
        "In the cloud we",
        "Virtual reality opens up",
        "The user interface was",
        "Cybersecurity is crucial for",
        "Quantum computing will change",
        "The developer merged the",
        "Open source software has",
        "Data science helps companies",
        "A mobile application must",
        "Automation reduces the need",
        "The network connection was",
        "Cryptographic keys are used",
        "Machine learning models require",
        "The compiler generated a"
    ],
    "Business": [
        "The secret to success",
        "To increase quarterly sales",
        "The board of directors",
        "A strong marketing strategy",
        "Customer satisfaction is the",
        "The company announced a",
        "Managing remote teams requires",
        "Startup founders must focus",
        "Financial forecasting helps predict",
        "The project manager scheduled",
        "Effective communication is key",
        "To negotiate a better",
        "Investing in employee training",
        "Market research reveals that",
        "The new CEO promised",
        "Optimizing supply chain logistics",
        "A sustainable business model",
        "The merger between the",
        "Risk management plans are",
        "Brand loyalty is built"
    ],
    "Education": [
        "The greatest lessons are",
        "To improve classroom learning",
        "Online education provides flexible",
        "Teachers play a critical",
        "Reading books expands the",
        "Critical thinking skills are",
        "A balanced school curriculum",
        "Higher education opens doors",
        "Learning a second language",
        "Student engagement increases when",
        "The library is a",
        "STEM education prepares students",
        "Continuous learning is vital",
        "Standardized testing has been",
        "Academic research contributes to",
        "Homework assignments should be",
        "Active recall techniques improve",
        "Mentorship programs provide guidance",
        "Understanding history helps us",
        "Scientific inquiry begins with"
    ],
    "Daily Conversation": [
        "The weather today is",
        "How are you doing",
        "I was thinking about",
        "Let's meet up for",
        "What do you want",
        "It's been a long",
        "Can you help me",
        "I really enjoy spending",
        "Where are we going",
        "That sounds like a",
        "Thank you so much",
        "I hope you have",
        "Tell me more about",
        "I was just looking",
        "We should plan a",
        "Let me know if",
        "Have you seen the",
        "I'm not sure about",
        "What time does the",
        "It was nice to"
    ],
    "Quotes": [
        "To be or not",
        "The only thing we",
        "All that glitters is",
        "Ask not what your",
        "I think therefore I",
        "A journey of a",
        "That which does not",
        "To thine own self",
        "United we stand divided",
        "Where there is love",
        "Knowledge is power but",
        "If you want to",
        "The truth will set",
        "Early to bed and",
        "Better late than never",
        "An eye for an",
        "Action speaks louder than",
        "Good things come to",
        "Time heals all wounds",
        "Look before you leap"
    ]
}

def evaluate_repetition(words: list) -> float:
    """Calculates the repetition rate (ratio of duplicate words)."""
    if not words:
        return 0.0
    unique = set(words)
    return (len(words) - len(unique)) / len(words)

def evaluate_sentence_completion(text: str) -> float:
    """Returns 1.0 if text ends with terminal punctuation, else 0.0."""
    if not text:
        return 0.0
    return 1.0 if text.strip()[-1] in [".", "?", "!"] else 0.0

def run_benchmark():
    status = check_status()
    if not status["ready"]:
        print(f"Error: Model not ready. {status['message']}")
        sys.exit(1)

    print("=" * 60)
    print("      VERRA MODEL GENERATION BENCHMARK RUNNER")
    print("=" * 60)
    print("Evaluating 140 prompts across 7 domains...")
    print("Comparing Top-k Sampling vs. Beam Search Decoding...")
    print("-" * 60)

    results = {
        "top_k": {"by_category": {}, "global": {}},
        "beam": {"by_category": {}, "global": {}}
    }

    # Global counters
    top_k_global_conf = []
    top_k_global_len = []
    top_k_global_rep = []
    top_k_global_complete = []
    
    beam_global_conf = []
    beam_global_len = []
    beam_global_rep = []
    beam_global_complete = []

    # Category summaries
    top_k_category_summaries = {}
    beam_category_summaries = {}

    for category, prompts in PROMPT_DATASET.items():
        print(f"Processing category: {category}...")
        
        top_k_conf = []
        top_k_len = []
        top_k_rep = []
        top_k_comp = []
        
        beam_conf = []
        beam_len = []
        beam_rep = []
        beam_comp = []
        
        for prompt in prompts:
            # 1. Run Top-k
            res_tk = generate_top_k(prompt, temperature=0.8)
            tk_words = res_tk["words"]
            tk_text = res_tk["generated_text"]
            
            # Record metrics
            tk_c = res_tk["confidence"]
            tk_l = len(tk_words)
            tk_r = evaluate_repetition(tk_words)
            tk_sc = evaluate_sentence_completion(tk_text)
            
            top_k_conf.append(tk_c)
            top_k_len.append(tk_l)
            top_k_rep.append(tk_r)
            top_k_comp.append(tk_sc)
            
            # 2. Run Beam
            res_bm = generate_beam_search(prompt)
            bm_words = res_bm["words"]
            bm_text = res_bm["generated_text"]
            
            bm_c = res_bm["confidence"]
            bm_l = len(bm_words)
            bm_r = evaluate_repetition(bm_words)
            bm_sc = evaluate_sentence_completion(bm_text)
            
            beam_conf.append(bm_c)
            beam_len.append(bm_l)
            beam_rep.append(bm_r)
            beam_comp.append(bm_sc)

        # Update category summaries
        top_k_category_summaries[category] = {
            "avg_confidence": sum(top_k_conf) / len(top_k_conf),
            "avg_length": sum(top_k_len) / len(top_k_len),
            "repetition_rate": sum(top_k_rep) / len(top_k_rep),
            "sentence_completion_rate": sum(top_k_comp) / len(top_k_comp)
        }
        
        beam_category_summaries[category] = {
            "avg_confidence": sum(beam_conf) / len(beam_conf),
            "avg_length": sum(beam_len) / len(beam_len),
            "repetition_rate": sum(beam_rep) / len(beam_rep),
            "sentence_completion_rate": sum(beam_comp) / len(beam_comp)
        }

        # Extend globals
        top_k_global_conf.extend(top_k_conf)
        top_k_global_len.extend(top_k_len)
        top_k_global_rep.extend(top_k_rep)
        top_k_global_complete.extend(top_k_comp)
        
        beam_global_conf.extend(beam_conf)
        beam_global_len.extend(beam_len)
        beam_global_rep.extend(beam_rep)
        beam_global_complete.extend(beam_comp)

    # Compute global aggregates
    global_tk = {
        "avg_confidence": sum(top_k_global_conf) / len(top_k_global_conf),
        "avg_length": sum(top_k_global_len) / len(top_k_global_len),
        "repetition_rate": sum(top_k_global_rep) / len(top_k_global_rep),
        "sentence_completion_rate": sum(top_k_global_complete) / len(top_k_global_complete)
    }
    
    global_bm = {
        "avg_confidence": sum(beam_global_conf) / len(beam_global_conf),
        "avg_length": sum(beam_global_len) / len(beam_global_len),
        "repetition_rate": sum(beam_global_rep) / len(beam_global_rep),
        "sentence_completion_rate": sum(beam_global_complete) / len(beam_global_complete)
    }

    # Find strongest/weakest categories based on confidence & completion
    def rank_categories(summaries):
        sorted_cats = sorted(
            summaries.items(),
            key=lambda x: (x[1]["avg_confidence"] + x[1]["sentence_completion_rate"]) / 2,
            reverse=True
        )
        return sorted_cats[0][0], sorted_cats[-1][0]

    tk_strong, tk_weak = rank_categories(top_k_category_summaries)
    bm_strong, bm_weak = rank_categories(beam_category_summaries)

    # Print formatted CLI summary
    print("\n" + "=" * 80)
    print("                           BENCHMARK EXECUTION SUMMARY")
    print("=" * 80)
    print(f"{'Metric':<30} | {'Top-k Sampling':<22} | {'Beam Search':<22}")
    print("-" * 80)
    print(f"{'Global Avg Confidence':<30} | {global_tk['avg_confidence'] * 100:.1f}% {' ':<16} | {global_bm['avg_confidence'] * 100:.1f}%")
    print(f"{'Global Avg Word Count':<30} | {global_tk['avg_length']:.2f} words {' ':<11} | {global_bm['avg_length']:.2f} words")
    print(f"{'Sentence Completion Rate':<30} | {global_tk['sentence_completion_rate'] * 100:.1f}% {' ':<16} | {global_bm['sentence_completion_rate'] * 100:.1f}%")
    print(f"{'Repetition Rate':<30} | {global_tk['repetition_rate'] * 100:.1f}% {' ':<16} | {global_bm['repetition_rate'] * 100:.1f}%")
    print("-" * 80)
    print(f"{'Strongest Category':<30} | {tk_strong:<22} | {bm_strong:<22}")
    print(f"{'Weakest Category':<30} | {tk_weak:<22} | {bm_weak:<22}")
    print("=" * 80)

    # Write output JSON to file
    results = {
        "top_k": {
            "global": global_tk,
            "category_summaries": top_k_category_summaries,
            "strongest_category": tk_strong,
            "weakest_category": tk_weak
        },
        "beam": {
            "global": global_bm,
            "category_summaries": beam_category_summaries,
            "strongest_category": bm_strong,
            "weakest_category": bm_weak
        },
        "recommendation": "beam" if global_bm["avg_confidence"] > global_tk["avg_confidence"] else "top_k"
    }

    results_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "benchmark_results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nDetailed JSON results exported to: {results_path}")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    run_benchmark()
