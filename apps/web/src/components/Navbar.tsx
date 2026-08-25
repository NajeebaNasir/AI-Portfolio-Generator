import React from 'react';
import { Sparkles, ShieldCheck, Cpu, Database } from 'lucide-react';
import { AppStep } from '../types';

interface NavbarProps {
  currentStep: AppStep;
  onStepChange: (step: AppStep) => void;
  canNavigateToPreview: boolean;
  fidelityScore?: number;
  engineUsed?: 'groq_ai' | 'deterministic_fallback';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onStepChange,
  canNavigateToPreview,
  fidelityScore,
  engineUsed,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#090d16] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white font-heading">
                Portfolio<span className="text-indigo-400">Gen</span> AI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Agent v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Resume to GitHub Pages Portfolio Agent
            </p>
          </div>
        </div>

        {/* Step Stepper */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => onStepChange('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentStep === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">1</span>
            <span>Upload</span>
          </button>

          <button
            disabled={!canNavigateToPreview}
            onClick={() => onStepChange('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentStep === 'preview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : canNavigateToPreview
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">2</span>
            <span>Live Studio</span>
          </button>

          <button
            disabled={!canNavigateToPreview}
            onClick={() => onStepChange('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentStep === 'export'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : canNavigateToPreview
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">3</span>
            <span>Export & CI</span>
          </button>
        </div>

        {/* Right Status / Engine Indicator */}
        <div className="flex items-center gap-3">
          {fidelityScore !== undefined && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>{fidelityScore}% Provenance</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs">
            {engineUsed === 'groq_ai' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="hidden sm:inline">Groq AI Mode</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Deterministic Mode</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
