import React, { useState, useEffect } from 'react';
import { Loader2, Search, Cpu, Sparkles, BookOpen, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: "Extracting Research Concepts & Keywords", icon: Search, duration: 2500 },
  { id: 2, label: "Searching OpenAlex Academic Repositories", icon: BookOpen, duration: 4000 },
  { id: 3, label: "Calculating Vector Embeddings & pgvector Cosine Similarity", icon: Cpu, duration: 4500 },
  { id: 4, label: "Synthesizing RAG Literature Intelligence & Gap Analysis", icon: Sparkles, duration: 6000 }
];

export default function LoadingState({ title }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto my-16 p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Main Spinner */}
      <div className="relative inline-flex items-center justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 animate-spin opacity-20 blur-sm" />
        <div className="absolute w-16 h-16 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin absolute" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Analyzing Academic Literature</h3>
      <p className="text-xs text-slate-400 mb-8 max-w-md mx-auto truncate font-mono">
        "{title}"
      </p>

      {/* Step Tracker */}
      <div className="space-y-3 text-left max-w-md mx-auto">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                isCurrent
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-lg shadow-cyan-500/5'
                  : isDone
                  ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                ) : (
                  <StepIcon className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <span className={`text-xs font-medium ${isCurrent ? 'text-cyan-200 font-semibold' : ''}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Querying OpenAlex works & executing pgvector cosine distance calculation</span>
      </div>
    </div>
  );
}
