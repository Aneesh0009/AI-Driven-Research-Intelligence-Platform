import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, BookOpen, Atom, Cpu, ArrowRight, Lightbulb } from 'lucide-react';
import { analyzeResearch } from '../services/api';
import LoadingState from '../components/LoadingState';

const SAMPLE_PROMPTS = [
  {
    title: "Multi-Modal Retrieval-Augmented Generation for Complex Scientific Diagrams",
    domain: "Computer Science & AI",
    abstract: "Proposing a visual-language RAG framework that encodes multi-modal scientific paper figures alongside textual embeddings to resolve cross-modal reasoning queries."
  },
  {
    title: "Graph Neural Networks for Zero-Shot Molecular Property Prediction",
    domain: "Biochemistry & Bioinformatics",
    abstract: "Using 3D spatial message passing GNNs trained on quantum chemistry invariants to predict drug binding affinity without fine-tuning."
  },
  {
    title: "Transformer Architectures for High-Frequency Algorithmic Trading Outliers",
    domain: "Quantitative Finance",
    abstract: "Designing low-latency temporal attention transformers that detect regime shifts and microstructural anomalies in financial order books."
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [domain, setDomain] = useState('Computer Science');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await analyzeResearch({
        title: title.trim(),
        abstract: abstract.trim() || undefined,
        domain: domain.trim() || undefined,
      });

      navigate(`/results/${data.analysis_id}`, { state: { analysisData: data } });
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.response?.data?.detail || 'Failed to complete research analysis. Please try again.');
      setLoading(false);
    }
  };

  const handleApplySample = (sample) => {
    setTitle(sample.title);
    setDomain(sample.domain);
    setAbstract(sample.abstract);
  };

  if (loading) {
    return <LoadingState title={title} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" /> OpenAlex Literature Ingestion + pgvector RAG
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          AI-Driven Academic <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Research Intelligence Platform
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Evaluate hypothesis novelties, benchmark method differentiations, and discover evidence-backed research gaps grounded strictly in peer-reviewed academic literature.
        </p>
      </div>

      {/* Main Card / Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden mb-12">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Research Title / Core Idea <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Multi-Modal Retrieval-Augmented Generation for Complex Scientific Diagrams"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Domain & Abstract Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Domain */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Academic Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm font-medium"
              >
                <option value="Computer Science">Computer Science & AI</option>
                <option value="Biochemistry">Biochemistry & Medicine</option>
                <option value="Physics">Physics & Material Science</option>
                <option value="Quantitative Finance">Quantitative Finance</option>
                <option value="Neuroscience">Neuroscience</option>
                <option value="General Science">Other / General Science</option>
              </select>
            </div>

            {/* Abstract */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Abstract / Description <span className="text-xs font-normal text-slate-400">(Optional but recommended)</span>
              </label>
              <textarea
                rows={4}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Detail technical methodology, evaluation dataset baseline, or core architectural design..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-sm leading-relaxed"
              />
            </div>

          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate Literature Intelligence Analysis</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>

      </div>

      {/* Preset Sample Prompts */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-slate-300 font-semibold text-sm">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Try preset research query examples:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleApplySample(sample)}
              className="text-left bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-xl transition-all group cursor-pointer"
            >
              <span className="inline-block text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                {sample.domain}
              </span>
              <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-2 mb-2">
                {sample.title}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {sample.abstract}
              </p>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
