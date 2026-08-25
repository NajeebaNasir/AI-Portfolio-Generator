import React, { useState } from 'react';
import {
  CanonicalProfile,
  DesignSpec,
  PortfolioStrategy,
  SectionType,
  PRESET_THEMES,
} from '@portfolio-generator/shared';
import { Navbar } from './components/Navbar';
import { UploadSection } from './components/UploadSection';
import { LiveCanvas } from './components/LiveCanvas';
import { ThemeCustomizer } from './components/ThemeCustomizer';
import { SectionRegenerateModal } from './components/SectionRegenerateModal';
import { ExportModal } from './components/ExportModal';
import { AppStep, ParseResumeResponse, EnrichedContent } from './types';
import { ArrowRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core portfolio state
  const [rawResumeText, setRawResumeText] = useState('');
  const [profile, setProfile] = useState<CanonicalProfile | null>(null);
  const [enriched, setEnriched] = useState<EnrichedContent | null>(null);
  const [strategy, setStrategy] = useState<PortfolioStrategy | null>(null);
  const [design, setDesign] = useState<DesignSpec>(PRESET_THEMES.cyber_dark);
  const [fidelityScore, setFidelityScore] = useState<number | undefined>(undefined);
  const [engineUsed, setEngineUsed] = useState<'groq_ai' | 'deterministic_fallback'>('deterministic_fallback');

  // Studio customization state
  const [scaleMode, setScaleMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeRegenerateSection, setActiveRegenerateSection] = useState<SectionType | null>(null);

  const handleAnalyzeResume = async (file: File | null, text: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Extracting text & categorizing sections...');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('resume', file);
      } else {
        formData.append('text', text);
      }

      setStatusMessage('Extracting full profile & projects...');

      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: file ? formData : JSON.stringify({ text }),
        headers: file ? {} : { 'Content-Type': 'application/json' },
      });

      const data: ParseResumeResponse = await response.json();

      if (!data.success || !data.profile) {
        throw new Error(data.error || 'Failed to parse resume.');
      }

      setRawResumeText(data.rawResumeText);
      setProfile(data.profile);
      setEnriched(data.enriched ?? null);
      setStrategy(data.strategy);
      if (data.designSpec) {
        setDesign(data.designSpec);
      }
      if (data.provenanceCheck) {
        setFidelityScore(data.provenanceCheck.fidelityScore);
      }
      if (data.engineUsed) {
        setEngineUsed(data.engineUsed);
      }

      setCurrentStep('preview');
    } catch (err: any) {
      console.error('[App] Error:', err);
      setErrorMessage(err.message || 'An error occurred while processing your resume.');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleApplySectionUpdate = (section: SectionType, updatedData: any) => {
    if (!profile) return;
    if (section === 'hero') {
      setProfile({
        ...profile,
        personal: {
          ...profile.personal,
          ...updatedData,
        },
      });
    } else {
      setProfile({
        ...profile,
        [section]: updatedData,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        canNavigateToPreview={!!profile}
        fidelityScore={fidelityScore}
        engineUsed={engineUsed}
      />

      {/* Error Alert Toast */}
      {errorMessage && (
        <div className="max-w-4xl mx-auto mt-4 px-4 w-full">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Step Router */}
      <main className="flex-1 w-full">
        {/* STEP 1: UPLOAD & INGESTION */}
        {currentStep === 'upload' && (
          <UploadSection
            onAnalyze={handleAnalyzeResume}
            isLoading={isLoading}
            statusMessage={statusMessage}
          />
        )}

        {/* STEP 2: INTERACTIVE LIVE PREVIEW STUDIO */}
        {currentStep === 'preview' && profile && strategy && (
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-heading text-white flex items-center gap-2">
                  <span>Interactive Live Studio</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {strategy.archetype.replace('_', ' ')}
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Real-time visual editor. Tweak color palette, typography, section ordering, or prompt targeted AI copy revisions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep('export')}
                  className="px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:scale-[1.02] transition-all"
                >
                  <span>Approve & Generate Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Screen Grid: Left Preview Canvas + Right Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Canvas Preview Area (8 cols on desktop) */}
              <div className="lg:col-span-8 pb-8 min-w-0">
                <LiveCanvas
                  profile={profile}
                  design={design}
                  strategy={strategy}
                  onEditSection={(sec) => setActiveRegenerateSection(sec)}
                  scaleMode={scaleMode}
                />
              </div>

              {/* Right Theme & Strategy Customizer Panel (4 cols on desktop) */}
              <div className="lg:col-span-4 sticky top-20">
                <ThemeCustomizer
                  design={design}
                  strategy={strategy}
                  onDesignChange={setDesign}
                  onStrategyChange={setStrategy}
                  scaleMode={scaleMode}
                  onScaleModeChange={setScaleMode}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: EXPORT & CI HUB */}
        {currentStep === 'export' && profile && strategy && (
          <ExportModal
            profile={profile}
            design={design}
            strategy={strategy}
            enriched={enriched}
            rawResumeText={rawResumeText}
            onBackToStudio={() => setCurrentStep('preview')}
          />
        )}
      </main>

      {/* Targeted Section AI Regeneration Modal */}
      {profile && (
        <SectionRegenerateModal
          isOpen={activeRegenerateSection !== null}
          section={activeRegenerateSection}
          profile={profile}
          onClose={() => setActiveRegenerateSection(null)}
          onApplyUpdate={handleApplySectionUpdate}
        />
      )}
    </div>
  );
}
