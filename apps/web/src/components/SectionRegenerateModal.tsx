import React, { useState } from 'react';
import { SectionType, CanonicalProfile } from '@portfolio-generator/shared';
import { Sparkles, X, Send, Bot, CheckCircle2 } from 'lucide-react';

interface SectionRegenerateModalProps {
  isOpen: boolean;
  section: SectionType | null;
  profile: CanonicalProfile;
  onClose: () => void;
  onApplyUpdate: (section: SectionType, updatedData: any) => void;
}

export const SectionRegenerateModal: React.FC<SectionRegenerateModalProps> = ({
  isOpen,
  section,
  profile,
  onClose,
  onApplyUpdate,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !section) return null;

  const quickPrompts: Record<string, string[]> = {
    hero: [
      'Make the headline punchier and executive-level',
      'Emphasize distributed systems and scale in the bio',
      'Make it suitable for a Staff/Lead engineering role',
    ],
    experience: [
      'Highlight concrete quantifiable business impact',
      'Shorten bullet points to max 2 lines each',
      'Emphasize leadership and architecture contributions',
    ],
    projects: [
      'Make project taglines more catchy',
      'Emphasize modern tech stack in descriptions',
      'Highlight system scalability and performance',
    ],
  };

  const handleRegenerate = async (customPrompt?: string) => {
    const promptToSend = customPrompt || instruction;
    if (!promptToSend.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/regenerate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section,
          profile,
          instruction: promptToSend,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to regenerate section');
      }

      onApplyUpdate(section, data.data);
      onClose();
    } catch (err: any) {
      console.error('[SectionRegenerateModal] Error:', err);
      setError(err.message || 'Error occurred during AI regeneration.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-700/80 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white capitalize">AI Edit: {section} Section</h3>
              <p className="text-xs text-slate-400">Strictly grounded in your resume facts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt suggestions */}
        {quickPrompts[section] && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Quick Directives:</label>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts[section].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInstruction(p);
                    handleRegenerate(p);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-slate-300 transition-all text-left"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom prompt input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Custom Instruction for AI Agent:</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={`e.g. Make the ${section} section more concise and focus on cloud architecture...`}
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          ></textarea>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => handleRegenerate()}
            disabled={isProcessing || !instruction.trim()}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              isProcessing || !instruction.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Regenerating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply AI Update</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
