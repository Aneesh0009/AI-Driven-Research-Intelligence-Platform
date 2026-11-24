import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Database, Layers } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">ResearchIntel</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Academic Literature Intelligence Platform</p>
            </div>
          </Link>

          {/* Right Badges */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>OpenAlex API + pgvector</span>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>RAG</span>
            </div>
            <Link
              to="/"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-sm shadow-cyan-500/20"
            >
              New Analysis
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
