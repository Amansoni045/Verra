import { BookOpen, Cpu, ShieldCheck, HelpCircle, Layers, Terminal } from "lucide-react";

export default function DocumentationPage() {
  const steps = [
    {
      title: "1. Dataset Ingestion",
      desc: "Loads the raw quotes dataset containing 3,038 inspirational and philosophical records.",
      tech: "Ingested via pandas read_csv from Downloads/qoute_dataset.csv."
    },
    {
      title: "2. Data Cleaning & Normalization",
      desc: "Converts text characters to lowercase and filters out non-standard punctuation.",
      tech: "Ensures uniform capitalization so that the words 'The' and 'the' map to the same token."
    },
    {
      title: "3. Tokenizer Indexing",
      desc: "Analyzes the cleaned vocabulary of 8,978 unique words and maps each to a unique index (1 to 8978).",
      tech: "Constructed using Keras text Tokenizer and saved in models/tokenizer.pkl."
    },
    {
      title: "4. N-Gram Sequence Slicing",
      desc: "Splits sentences into growing chunks of words to create training pairs of inputs and next-word targets.",
      tech: "For a sequence of length N, it creates N-1 training samples (e.g. 'the future' -> 'belongs')."
    },
    {
      title: "5. Sequence Padding",
      desc: "Pads all input slices with leading zeros so that every sequence has a uniform length of 745 tokens.",
      tech: "Performed via pad_sequences with padding='pre' to support constant input tensor shapes."
    },
    {
      title: "6. Semantic Embedding Layer",
      desc: "Converts high-dimensional indices into dense 50-dimensional vectors capturing semantic relations.",
      tech: "Dense embedding matrices map words with similar semantic contexts close to one another."
    },
    {
      title: "7. LSTM Recurrent Cell",
      desc: "The 256-unit recurrent LSTM layer processes the vectors, preserving memory gates to capture long-term context.",
      tech: "Maintains cell states (C_t) and hidden states (H_t) to prevent gradient vanishings."
    },
    {
      title: "8. Dense Softmax Projection",
      desc: "Projects the recurrent output to a probability distribution over all 8,978 words in our vocabulary.",
      tech: "Uses softmax activation to assign a probability score between 0.0 and 1.0 to each word."
    }
  ];

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      
      {/* Title Header */}
      <div className="space-y-3 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
          DOCUMENTATION
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Architecture & Pipeline Reference
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed font-sans">
          Understand the mathematical pipeline, sequence transformations, and neural network topologies backing Verra.
        </p>
      </div>

      {/* Model Pipeline Diagram */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Layers className="w-4 h-4 text-primary" />
          Neural Pipeline Diagram
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
          {steps.map((step, i) => (
            <div key={i} className="p-5 rounded-xl border border-card-border bg-card/60 glass-panel space-y-2 text-left">
              <span className="font-bold text-white text-xs block">{step.title}</span>
              <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
              <div className="pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-500 font-mono">
                {step.tech}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core AI concepts */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white font-sans flex items-center gap-2 border-b border-zinc-900 pb-3">
          <HelpCircle className="w-4 h-4 text-primary" />
          Technical Concepts Simplified
        </h2>

        <div className="space-y-4 font-sans text-xs">
          <div className="p-5 rounded-xl border border-card-border bg-card/40 glass-panel space-y-2">
            <h3 className="font-bold text-white text-xs">What is the role of Temperature in text generation?</h3>
            <p className="text-zinc-400 leading-relaxed">
              When the model predicts the next word, it assigns a probability score to every word in its vocabulary. Temperature controls the scaling of these scores before selection. 
            </p>
            <ul className="list-disc list-inside text-zinc-500 space-y-1 pl-1 leading-normal">
              <li><strong>High Temperature (e.g. 1.5):</strong> flattens the distribution, giving unlikely words a higher chance of selection. This results in creative, unpredictable, and sometimes incoherent text.</li>
              <li><strong>Low Temperature (e.g. 0.2):</strong> sharpens the distribution, forcing the model to select only the highest-probability words. This results in repetitive, safe, and highly predictable sentences.</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border border-card-border bg-card/40 glass-panel space-y-2">
            <h3 className="font-bold text-white text-xs">Why use Recurrent Neural Networks (RNN/LSTM)?</h3>
            <p className="text-zinc-400 leading-relaxed">
              Standard Feedforward neural networks treat each input word independently, which means they cannot understand context (e.g., in the sentence &ldquo;The clouds are in the sky&rdquo;, the word &ldquo;sky&rdquo; is highly dependent on &ldquo;clouds&rdquo;). Recurrent Neural Networks solve this by maintaining feedback loops, passing information from previous steps into the current calculation, capturing the sequential flow of natural language.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
