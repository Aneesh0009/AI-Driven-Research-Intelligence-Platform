import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, ExternalLink, BookOpen, Layers, Table, Lightbulb, 
  CheckCircle, FileText, Share2, Quote, Award, Sparkles, Download, 
  Copy, Check, Code 
} from 'lucide-react';
import { getAnalysisById } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';
import SimilarityBadge from '../components/SimilarityBadge';
import IndicatorCard from '../components/IndicatorCard';
import LoadingState from '../components/LoadingState';

export default function ResultsPage() {
  const { id } = useParams();
  const location = useLocation();
  const [analysis, setAnalysis] = useState(location.state?.analysisData || null);
  const [loading, setLoading] = useState(!analysis);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedSection, setCopiedSection] = useState(null);
  const [expandedPapers, setExpandedPapers] = useState({});
  const [hoveredMatrixRow, setHoveredMatrixRow] = useState(null);
  const [pinnedMatrixRows, setPinnedMatrixRows] = useState({});

  const togglePaperExpand = (idx) => {
    setExpandedPapers(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    if (!analysis && id) {
      setLoading(true);
      getAnalysisById(id)
        .then((data) => {
          setAnalysis(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch analysis:', err);
          setError('Could not retrieve requested analysis. It may have expired or does not exist.');
          setLoading(false);
        });
    }
  }, [id, analysis]);

  if (loading) return <LoadingState title="Loading Analysis Results..." />;

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center">
        <h3 className="text-xl font-bold text-rose-400 mb-2">Analysis Not Found</h3>
        <p className="text-slate-400 text-sm mb-6">{error || 'An error occurred while loading results.'}</p>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 font-semibold rounded-lg">
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    );
  }

  const { title, abstract, domain, created_at, papers = [], result = {} } = analysis;

  const copyToClipboard = (text, sectionKey) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const getMarkdownReport = () => {
    const papersMd = papers.map((p, idx) => (
      `### [paper_${idx + 1}] ${p.title}\n` +
      `- **Similarity**: ${Math.round(p.similarity * 100)}%\n` +
      `- **Authors**: ${p.authors?.map(a => typeof a === 'object' ? a.name : a).join(', ') || 'N/A'}\n` +
      `- **Venue / Year**: ${p.venue || 'N/A'} (${p.publication_date || 'N/A'})\n` +
      `- **Citations**: ${p.citation_count}\n` +
      `- **DOI / URL**: ${p.doi || p.url || 'N/A'}\n` +
      `- **Abstract**: ${p.abstract}\n`
    )).join('\n');

    const matrixHeader = `| Ref ID | Problem Scope | Technical Method | Dataset / Setup | Reported Results | Limitations |\n|---|---|---|---|---|---|\n`;
    const matrixRows = result.research_comparison?.map(r => 
      `| ${r.paper_id} | ${r.problem} | ${r.method} | ${r.dataset} | ${r.results} | ${r.limitations} |`
    ).join('\n') || '';

    const gapsMd = result.research_gaps?.map((g, idx) => (
      `**Gap ${idx + 1} (${g.confidence} confidence)**: ${g.gap}\n- Evidence: ${g.evidence?.join(', ')}`
    )).join('\n\n') || '';

    const futureMd = result.future_directions?.map((d, idx) => `${idx + 1}. ${d}`).join('\n') || '';

    return `# Academic Literature Intelligence Analysis: ${title}
**Domain**: ${domain || 'General Science'} | **Date**: ${new Date(created_at).toLocaleDateString()}

## Executive Summary
${result.summary}

## AI Innovation Assessment
- **Literature Similarity**: ${result.innovation_indicator?.research_similarity}
- **Method Novelty**: ${result.innovation_indicator?.method_differentiation}
- **Dataset Scope**: ${result.innovation_indicator?.dataset_differentiation}
- **Gap Evidence**: ${result.innovation_indicator?.research_gap_evidence}
- **Synthesis Assessment**: ${result.innovation_indicator?.assessment}

---

## Method & Limitation Comparison Matrix
${matrixHeader}${matrixRows}

---

## Identified Research Gaps
${gapsMd}

---

## Recommended Future Directions
${futureMd}

---

## Similar Literature Evidence
${papersMd}
`;
  };

  const downloadFile = (content, fileName, contentType) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownloadMarkdown = () => {
    const mdText = getMarkdownReport();
    downloadFile(mdText, `Research_Intelligence_${id.substring(0, 8)}.md`, "text/markdown");
  };

  const handleDownloadJSON = () => {
    const jsonText = JSON.stringify(analysis, null, 2);
    downloadFile(jsonText, `Research_Intelligence_${id.substring(0, 8)}.json`, "application/json");
  };

  const getMatrixText = () => {
    return result.research_comparison?.map(r => 
      `[${r.paper_id}]\nProblem: ${r.problem}\nMethod: ${r.method}\nDataset: ${r.dataset}\nResults: ${r.results}\nLimitations: ${r.limitations}\n`
    ).join('\n') || '';
  };

  const getGapsText = () => {
    return `IDENTIFIED RESEARCH GAPS:\n` + 
      (result.research_gaps?.map((g, i) => `Gap #${i + 1} (${g.confidence}): ${g.gap}\nEvidence: ${g.evidence?.join(', ')}`).join('\n\n') || '') +
      `\n\nRECOMMENDED FUTURE DIRECTIONS:\n` +
      (result.future_directions?.map((d, i) => `${i + 1}. ${d}`).join('\n') || '');
  };

  const getLiteratureText = () => {
    return papers.map((p, idx) => (
      `[paper_${idx + 1}] (${Math.round(p.similarity * 100)}% Match)\nTitle: ${p.title}\nAuthors: ${p.authors?.map(a => typeof a === 'object' ? a.name : a).join(', ')}\nVenue: ${p.venue} (${p.publication_date})\nCitations: ${p.citation_count}\nURL: ${p.doi || p.url}\nAbstract: ${p.abstract}\n`
    )).join('\n---\n');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Back Button & Top Download Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Research Input
        </Link>

        {/* Download & Export CTAs */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download Report (.md)
          </button>
          
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-indigo-400" /> Export JSON
          </button>
        </div>
      </div>

      {/* Top Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Header Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
            {domain || 'General Science'}
          </span>
          <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium rounded-full flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-indigo-400" /> {papers.length} OpenAlex Papers Indexed
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3">
          {title}
        </h1>

        {abstract && (
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 mb-4">
            {abstract}
          </p>
        )}

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Executive Summary:</span>
          <span className="text-slate-200">{result.summary}</span>
        </div>
      </div>

      {/* Innovation Indicator Card */}
      <div className="mb-8">
        <IndicatorCard 
          indicator={result.innovation_indicator} 
          onCopy={() => copyToClipboard(JSON.stringify(result.innovation_indicator, null, 2), 'indicator')}
          copied={copiedSection === 'indicator'}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 mb-8 overflow-x-auto pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Similar Literature ({papers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Method Comparison Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('gaps')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'gaps'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Research Gaps & Directions</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SIMILAR PAPERS LIST */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Retrieved Academic Works (Vector Similarity Ranked)
            </h3>
            
            <button
              onClick={() => copyToClipboard(getLiteratureText(), 'literature')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              {copiedSection === 'literature' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400 font-semibold">Copied Literature!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" /> <span>Copy Literature List</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {papers.map((paper, idx) => {
              const isExpanded = !!expandedPapers[idx];
              return (
                <div
                  key={paper.id || idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg transition-all duration-300"
                  style={{ borderColor: isExpanded ? 'rgba(6,182,212,0.45)' : undefined }}
                  onMouseEnter={() => setExpandedPapers(prev => ({ ...prev, [idx]: true }))}
                  onMouseLeave={() => setExpandedPapers(prev => ({ ...prev, [idx]: false }))}
                >
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center border border-slate-700">
                        #{paper.rank || idx + 1}
                      </span>
                      <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                        paper_{idx + 1}
                      </span>
                      <SimilarityBadge similarity={paper.similarity} />
                    </div>

                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 transition-colors"
                      >
                        <span>View Paper / DOI</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-white mb-2 leading-snug">
                    {paper.title}
                  </h4>

                  {/* Abstract — comfortably displays content, smoothly maximizes on hover or click */}
                  <div className="mb-4">
                    <div
                      className="relative rounded-xl border transition-all cursor-pointer group/abstract"
                      style={{
                        maxHeight: isExpanded ? '560px' : '145px',
                        overflowY: isExpanded ? 'auto' : 'hidden',
                        background: isExpanded ? 'rgba(2,6,23,0.95)' : 'rgba(2,6,23,0.45)',
                        borderColor: isExpanded ? 'rgba(6,182,212,0.5)' : 'rgba(51,65,85,0.7)',
                        boxShadow: isExpanded ? 'inset 0 2px 14px rgba(0,0,0,0.5)' : 'none',
                        transition: 'max-height 0.35s ease, border-color 0.2s ease, background 0.2s ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPapers(prev => ({ ...prev, [idx]: !prev[idx] }));
                      }}
                      title="Hover or click to toggle full abstract"
                    >
                      <p className="text-xs text-slate-200 leading-relaxed p-4 selection:bg-cyan-500/30">
                        {paper.abstract}
                      </p>
                      {/* Gradient fade when collapsed to signal continuation */}
                      {!isExpanded && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                          style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.92))' }}
                        />
                      )}
                    </div>
                    {/* Expand/Collapse Hint */}
                    <p
                      className="text-[11px] mt-1.5 px-1 flex items-center justify-between transition-colors duration-200"
                      style={{ color: isExpanded ? 'rgb(34,211,238)' : 'rgb(148,163,184)' }}
                    >
                      <span>
                        {isExpanded
                          ? '↕ Scroll inside box to read complete abstract'
                          : 'Hover over card or click text to maximize full abstract'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isExpanded ? 'Click or move cursor away to collapse' : 'Click to lock open'}
                      </span>
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-500">Authors:</span>{' '}
                      <span className="text-slate-300 font-medium">
                        {paper.authors?.map(a => typeof a === 'object' ? a.name : a).join(', ') || 'Academic Researchers'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Venue:</span>{' '}
                      <span className="text-slate-300">{paper.venue || 'Academic Journal'} ({paper.publication_date || 'N/A'})</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Citations:</span>{' '}
                      <span className="text-slate-300 font-bold font-mono">{paper.citation_count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: METHOD COMPARISON MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                Method & Limitation Comparison Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Direct evidence breakdown comparing problem formulations, baseline algorithms, datasets, and limitations across retrieved works.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(getMatrixText(), 'matrix')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              {copiedSection === 'matrix' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400 font-semibold">Copied Matrix!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" /> <span>Copy Matrix Text</span>
                </>
              )}
            </button>
          </div>

          {/* User Hint Banner */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/70 px-4 py-2.5 rounded-xl border border-slate-800/90 mb-4">
            <span className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Hover over any paper row to maximize all columns and scroll full details. Click row to lock open.</span>
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              {Object.values(pinnedMatrixRows).some(Boolean) ? 'Rows pinned open' : 'Interactive table'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-semibold uppercase tracking-wider">
                  <th className="p-3.5 w-28 whitespace-nowrap">Ref ID</th>
                  <th className="p-3.5 min-w-[200px]">Problem Scope</th>
                  <th className="p-3.5 min-w-[200px]">Technical Method</th>
                  <th className="p-3.5 min-w-[170px]">Dataset / Setup</th>
                  <th className="p-3.5 min-w-[170px]">Reported Results</th>
                  <th className="p-3.5 min-w-[210px]">Limitations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {result.research_comparison?.map((row, idx) => {
                  const isExpanded = hoveredMatrixRow === idx || !!pinnedMatrixRows[idx];
                  const isPinned = !!pinnedMatrixRows[idx];
                  return (
                    <tr
                      key={idx}
                      onMouseEnter={() => setHoveredMatrixRow(idx)}
                      onMouseLeave={() => setHoveredMatrixRow(null)}
                      onClick={() => setPinnedMatrixRows(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className={`transition-all duration-200 cursor-pointer ${
                        isExpanded
                          ? 'bg-slate-950/95 ring-1 ring-cyan-500/40 shadow-xl'
                          : 'hover:bg-slate-950/40'
                      }`}
                      title="Hover or click to maximize and scroll complete text"
                    >
                      {/* Ref ID Badge */}
                      <td className="p-3.5 align-top font-mono whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border transition-colors ${
                            isExpanded
                              ? 'text-cyan-300 bg-cyan-950/80 border-cyan-500/40 shadow-sm'
                              : 'text-cyan-400 bg-cyan-950/30 border-cyan-500/20'
                          }`}>
                            {row.paper_id}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isPinned ? '📌 Locked' : (isExpanded ? '↕ Maximized' : 'Hover to view')}
                          </span>
                        </div>
                      </td>

                      {/* Problem Scope */}
                      <td className="p-3.5 align-top">
                        <div
                          className="transition-all duration-300 rounded-lg p-2.5 relative custom-scrollbar"
                          style={{
                            maxHeight: isExpanded ? '320px' : '76px',
                            overflowY: isExpanded ? 'auto' : 'hidden',
                            background: isExpanded ? 'rgba(2, 6, 23, 0.85)' : 'rgba(2, 6, 23, 0.25)',
                            border: isExpanded ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent'
                          }}
                        >
                          <p className="leading-relaxed text-slate-200 text-xs selection:bg-cyan-500/30">
                            {row.problem}
                          </p>
                          {!isExpanded && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                              style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.95))' }}
                            />
                          )}
                        </div>
                      </td>

                      {/* Technical Method */}
                      <td className="p-3.5 align-top">
                        <div
                          className="transition-all duration-300 rounded-lg p-2.5 relative custom-scrollbar"
                          style={{
                            maxHeight: isExpanded ? '320px' : '76px',
                            overflowY: isExpanded ? 'auto' : 'hidden',
                            background: isExpanded ? 'rgba(2, 6, 23, 0.85)' : 'rgba(2, 6, 23, 0.25)',
                            border: isExpanded ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent'
                          }}
                        >
                          <p className="leading-relaxed font-medium text-slate-100 text-xs selection:bg-cyan-500/30">
                            {row.method}
                          </p>
                          {!isExpanded && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                              style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.95))' }}
                            />
                          )}
                        </div>
                      </td>

                      {/* Dataset / Setup */}
                      <td className="p-3.5 align-top">
                        <div
                          className="transition-all duration-300 rounded-lg p-2.5 relative custom-scrollbar"
                          style={{
                            maxHeight: isExpanded ? '320px' : '76px',
                            overflowY: isExpanded ? 'auto' : 'hidden',
                            background: isExpanded ? 'rgba(2, 6, 23, 0.85)' : 'rgba(2, 6, 23, 0.25)',
                            border: isExpanded ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent'
                          }}
                        >
                          <p className="leading-relaxed text-slate-300 text-xs selection:bg-cyan-500/30">
                            {row.dataset}
                          </p>
                          {!isExpanded && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                              style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.95))' }}
                            />
                          )}
                        </div>
                      </td>

                      {/* Reported Results */}
                      <td className="p-3.5 align-top">
                        <div
                          className="transition-all duration-300 rounded-lg p-2.5 relative custom-scrollbar"
                          style={{
                            maxHeight: isExpanded ? '320px' : '76px',
                            overflowY: isExpanded ? 'auto' : 'hidden',
                            background: isExpanded ? 'rgba(2, 6, 23, 0.85)' : 'rgba(2, 6, 23, 0.25)',
                            border: isExpanded ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent'
                          }}
                        >
                          <p className="leading-relaxed text-slate-200 text-xs selection:bg-cyan-500/30">
                            {row.results}
                          </p>
                          {!isExpanded && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                              style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.95))' }}
                            />
                          )}
                        </div>
                      </td>

                      {/* Limitations */}
                      <td className="p-3.5 align-top">
                        <div
                          className="transition-all duration-300 rounded-lg p-2.5 relative custom-scrollbar"
                          style={{
                            maxHeight: isExpanded ? '320px' : '76px',
                            overflowY: isExpanded ? 'auto' : 'hidden',
                            background: isExpanded ? 'rgba(76, 5, 25, 0.3)' : 'rgba(76, 5, 25, 0.12)',
                            border: isExpanded ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(244, 63, 94, 0.15)'
                          }}
                        >
                          <p className="leading-relaxed text-rose-300 text-xs selection:bg-rose-500/30">
                            {row.limitations}
                          </p>
                          {!isExpanded && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                              style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.95))' }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RESEARCH GAPS & FUTURE DIRECTIONS */}
      {activeTab === 'gaps' && (
        <div className="space-y-8">
          
          <div className="flex justify-end">
            <button
              onClick={() => copyToClipboard(getGapsText(), 'gaps')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              {copiedSection === 'gaps' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400 font-semibold">Copied Gaps & Directions!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-400" /> <span>Copy Gaps & Directions</span>
                </>
              )}
            </button>
          </div>

          {/* Gaps */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Evidence-Grounded Research Gaps
            </h3>

            <div className="space-y-4">
              {result.research_gaps?.map((gap, idx) => (
                <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Identified Gap #{idx + 1}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      gap.confidence === 'high'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {gap.confidence} Confidence
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-200 mb-3 leading-relaxed">
                    {gap.gap}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Evidence Citations:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {gap.evidence?.map((ev, eIdx) => (
                        <span key={eIdx} className="px-2 py-0.5 bg-cyan-950/50 text-cyan-400 font-mono text-[11px] font-bold rounded border border-cyan-500/20">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Future Directions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Recommended Future Research Directions
            </h3>

            <ul className="space-y-3">
              {result.future_directions?.map((dir, idx) => (
                <li key={idx} className="flex items-start gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 text-sm text-slate-200 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{dir}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

      {/* Academic Citations List */}
      <div className="mt-12 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
          <Quote className="w-3.5 h-3.5 text-cyan-400" />
          Academic References & OpenAlex Citation Metadata
        </h4>
        <div className="space-y-2 text-xs font-mono text-slate-400">
          {papers.map((p, idx) => (
            <div key={idx} className="p-2 bg-slate-950/50 rounded border border-slate-800/60 truncate">
              <span className="text-cyan-400 font-bold">[paper_{idx + 1}]</span>{' '}
              {p.authors?.map(a => typeof a === 'object' ? a.name : a).join(', ')} ({p.publication_date || '2023'}). "{p.title}". <i>{p.venue || 'OpenAlex Repository'}</i>. {p.doi || p.url}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
