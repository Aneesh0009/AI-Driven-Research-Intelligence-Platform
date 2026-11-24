import React from 'react';
import { Award, Target, Cpu, Database, FileSearch, Sparkles, Copy, Check } from 'lucide-react';

export default function IndicatorCard({ indicator, onCopy, copied }) {
  if (!indicator) return null;

  const getLevelBadge = (val, type = 'diff') => {
    const value = (val || 'medium').toLowerCase();
    
    if (type === 'diff') {
      if (value === 'high') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">High Differentiation</span>;
      if (value === 'medium') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">Moderate Differentiation</span>;
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">Low Differentiation</span>;
    } else {
      if (value === 'low') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Low Overlap</span>;
      if (value === 'medium') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Moderate Overlap</span>;
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">High Literature Overlap</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Title row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 rounded-xl border border-cyan-500/30 text-cyan-400 shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-snug">
            AI-Assisted Innovation Assessment
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Literature differentiation metrics &amp; methodology benchmarks</p>
        </div>
      </div>

      {/* Action buttons row — always below title, never overlapping */}
      <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-slate-800">
        {onCopy && (
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copy Assessment</span>
              </>
            )}
          </button>
        )}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg text-xs text-slate-300 border border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Synthesis Score</span>
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Research Similarity */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" /> Literature Similarity
            </span>
          </div>
          <div>
            {getLevelBadge(indicator.research_similarity, 'sim')}
          </div>
        </div>

        {/* Method Differentiation */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Method Novelty
            </span>
          </div>
          <div>
            {getLevelBadge(indicator.method_differentiation, 'diff')}
          </div>
        </div>

        {/* Dataset Differentiation */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" /> Dataset Scope
            </span>
          </div>
          <div>
            {getLevelBadge(indicator.dataset_differentiation, 'diff')}
          </div>
        </div>

        {/* Research Gap Evidence */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5 text-emerald-400" /> Gap Evidence
            </span>
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {indicator.research_gap_evidence ? `${indicator.research_gap_evidence.toUpperCase()} Evidence` : "Grounded"}
            </span>
          </div>
        </div>

      </div>

      {/* Assessment qualitative summary */}
      <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          Executive Intelligence Synthesis
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed">
          {indicator.assessment || "Analysis confirms strategic opportunities for methodological differentiation while grounded in baseline academic literature."}
        </p>
      </div>

    </div>
  );
}
