import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  Layers
} from 'lucide-react';
import { SAMPLE_RESUMES, SampleResume } from '../data/sampleResumes';

interface UploadSectionProps {
  onAnalyze: (file: File | null, text: string) => Promise<void>;
  isLoading: boolean;
  statusMessage: string;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onAnalyze,
  isLoading,
  statusMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = (sample: SampleResume) => {
    setPastedText(sample.rawText);
    setSelectedFile(null);
    setActiveTab('paste');
  };

  const handleSubmit = () => {
    if (activeTab === 'upload' && selectedFile) {
      onAnalyze(selectedFile, '');
    } else if (activeTab === 'paste' && pastedText.trim()) {
      onAnalyze(null, pastedText);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Zero Hallucination • Grounded Provenance Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
          Transform Your Resume Into a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
            Deployable Portfolio
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Upload your PDF or DOCX resume. Our agent extracts a verified profile, generates an intelligent archetype strategy, renders an interactive live preview, and produces a GitHub Pages-ready codebase.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glowing backdrop accent */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Tab Selection */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File (PDF / DOCX)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Resume Text</span>
          </button>
        </div>

        {/* Upload Dropzone Tab */}
        {activeTab === 'upload' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              {selectedFile ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              {selectedFile ? (
                <div>
                  <p className="font-bold text-white text-base">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to extract</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-white text-base">
                    Click to browse or drag and drop your resume
                  </p>
                  <p className="text-xs text-slate-400">Supports PDF, DOCX, or Plain Text (Max 5MB)</p>
                </div>
              )}
            </div>

            {!selectedFile && (
              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Ephemeral Processing</span>
                <span>•</span>
                <span>No Data Retained</span>
                <span>•</span>
                <span>Zero Prompt Injection Vulnerability</span>
              </div>
            )}
          </div>
        )}

        {/* Text Paste Tab */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the full text of your resume here (e.g. Work Experience, Education, Projects, Skills)..."
              rows={10}
              className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono resize-y"
            ></textarea>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{pastedText.length} characters</span>
              <span>Formatted into Canonical Schema automatically</span>
            </div>
          </div>
        )}

        {/* Generate / Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Powered by Groq Llama 3.3 70B • Fast Sub-Second Parsing</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedText.trim())}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              isLoading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !pastedText.trim())
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{statusMessage || 'Analyzing Resume...'}</span>
              </>
            ) : (
              <>
                <span>Analyze & Generate Strategy</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1-Click Sample Resumes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Or Test With 1-Click Sample Resumes</span>
            </h2>
            <p className="text-xs text-slate-400">Instant test cases across 4 distinct professional career archetypes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_RESUMES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="glass-card-interactive rounded-xl p-4 cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {sample.archetype.replace('_', ' ')}
                  </span>
                  <FileCode className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  {sample.name}
                </h3>
                <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                  {sample.role}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                <span>Load Sample</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
