import React from 'react';

export default function SimilarityBadge({ similarity = 0 }) {
  const percentage = Math.round(similarity * 100);

  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let label = "Low Overlap";

  if (percentage >= 75) {
    badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
    label = "High Overlap";
  } else if (percentage >= 45) {
    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    label = "Moderate Overlap";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor}`}>
      <span className="font-bold font-mono">{percentage}%</span>
      <span className="text-[10px] opacity-80 uppercase tracking-wider">({label})</span>
    </div>
  );
}
