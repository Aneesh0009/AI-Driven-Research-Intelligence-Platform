import React, { useState } from 'react';
import { AlertTriangle, X, ShieldCheck } from 'lucide-react';

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm relative transition-all">
      <div className="flex items-start gap-3.5 pr-8">
        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
            AI-Assisted Literature Intelligence Notice
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
              Academic Advisory
            </span>
          </h4>
          <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
            This platform generates AI-driven comparative literature analysis grounded exclusively in retrieved OpenAlex academic papers. 
            Findings represent <strong>potential research gaps</strong> and <strong>differentiation estimates</strong>—they do not guarantee absolute novelty or provide legal patent clearance.
          </p>
        </div>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-3.5 right-3.5 p-1 text-amber-400/60 hover:text-amber-200 rounded-md hover:bg-amber-900/40 transition-colors"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
