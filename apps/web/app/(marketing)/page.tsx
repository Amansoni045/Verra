import Link from "next/link";
import { Sparkles, MoveRight, Layers, Cpu, AlignLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ModelComparison } from "@/components/landing/ModelComparison";

export default function MarketingPage() {
  const features = [
    {
      icon: <AlignLeft className="w-5 h-5 text-primary" />,
      title: "Contextual Continuation",
      description: "Start typing a few words and watch Verra seamlessly extend your thought flow using trained next-word recurrence."
    },
    {
      icon: <Cpu className="w-5 h-5 text-primary" />,
      title: "LSTM Cell Recurrence",
      description: "Unlike basic RNN structures, Verra utilizes LSTM memory cells to selectively store historical patterns and punctuation context."
    },
    {
      icon: <Layers className="w-5 h-5 text-primary" />,
      title: "Hierarchical Semantics",
      description: "Trained over semantic embedding spaces, Verra maps contextual vocabularies to generate coherent sentences rather than random letters."
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-12 text-center relative overflow-hidden">
        
        {/* Glow decorative spot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[120px] pointer-events-none" />

        <div className="space-y-6 max-w-3xl mx-auto z-10 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-card-border bg-card/60 text-[10px] font-bold tracking-wider text-zinc-400 uppercase font-sans select-none glass-panel">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            VERSION 1.0 NOW ONLINE
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.08] font-sans">
            Every Great Sentence <br className="hidden sm:block" />
            Starts Somewhere.
          </h1>
          
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto font-sans leading-relaxed">
            Start with a few words and let Verra naturally continue your thoughts using a neural language model trained to predict the next word in context.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/studio" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto gap-2 text-xs font-semibold px-6 py-2.5 h-11 bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/10">
                Start Writing Studio
                <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto gap-2 text-xs font-semibold px-6 py-2.5 h-11 border border-zinc-800">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo */}
      <section className="w-full px-4 pb-20 relative z-10">
        <LiveDemo />
      </section>

      {/* Product Features Section */}
      <section className="w-full border-t border-card-border/40 bg-zinc-950/20 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-2 mb-14">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
              PRODUCT FEATURES
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
              Polished Neural Writing Workspace
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto font-sans leading-relaxed">
              Verra simplifies next-word predictions by wrapping complex recurrent neural networks inside a minimal, distraction-free environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-card-border bg-card shadow-sm hover:border-zinc-800/80 transition-all duration-200 glass-panel"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm shrink-0">
                  {feat.icon}
                </div>
                <h3 className="mt-4 text-sm font-bold text-white tracking-tight font-sans">
                  {feat.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-sans">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Educational NLP Flow Diagram */}
      <section id="how-it-works" className="w-full py-20 px-4 border-t border-card-border/40 relative">
        {/* Glow decorative spot */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/2 blur-[100px] pointer-events-none" />
        <HowItWorks />
      </section>

      {/* Model comparisons */}
      <section className="w-full py-20 px-4 border-t border-card-border/40 bg-zinc-950/10">
        <ModelComparison />
      </section>

      {/* FAQ Accordion */}
      <section className="w-full py-20 px-4 border-t border-card-border/40">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2 mb-10">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase font-sans">
              COMMON INQUIRIES
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4 font-sans">
            {[
              {
                q: "What is next-word text generation?",
                a: "Next-word text generation is a natural language processing task where a trained model analyzes a sequence of preceding words and calculates probability scores to predict the most likely succeeding word. Verra generates text word-by-word iteratively using this process."
              },
              {
                q: "Why does Verra use an LSTM instead of a simple RNN?",
                a: "Simple Recurrent Neural Networks (RNNs) struggle with 'vanishing gradients', meaning they quickly forget words from earlier in a sentence. LSTMs (Long Short-Term Memory networks) solve this by using custom memory cell gates that selectively store and retrieve information across longer text sequences."
              },
              {
                q: "Can I use Verra without a local TensorFlow environment?",
                a: "Yes! Verra is designed with V1.0 product specifications. If model weights are not loaded locally, the writing workspace will display a setup screen overlay with instructions on how to set it up, keeping the platform clean and functional."
              }
            ].map((faq, i) => (
              <div key={i} className="p-5 rounded-lg border border-card-border bg-card/40 glass-panel">
                <h3 className="text-xs font-bold text-white tracking-tight">{faq.q}</h3>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-card-border/40 py-12 px-4 bg-zinc-950/40 text-center font-sans">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs font-semibold tracking-wide text-zinc-400">VERRA PLATFORM</span>
          <span className="text-[10px] text-zinc-500 font-mono">© 2026 VERRA. LICENSED UNDER MIT.</span>
        </div>
      </footer>
    </div>
  );
}
