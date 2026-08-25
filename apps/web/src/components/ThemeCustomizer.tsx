import React from 'react';
import {
  DesignSpec,
  PortfolioStrategy,
  ThemeId,
  PRESET_THEMES,
  SectionType,
} from '@portfolio-generator/shared';
import { 
  Palette, 
  Type, 
  Layout, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Sparkles, 
  ArrowUpDown, 
  Eye, 
  EyeOff,
  Sliders,
  Check
} from 'lucide-react';

interface ThemeCustomizerProps {
  design: DesignSpec;
  strategy: PortfolioStrategy;
  onDesignChange: (design: DesignSpec) => void;
  onStrategyChange: (strategy: PortfolioStrategy) => void;
  scaleMode: 'desktop' | 'tablet' | 'mobile';
  onScaleModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  design,
  strategy,
  onDesignChange,
  onStrategyChange,
  scaleMode,
  onScaleModeChange,
}) => {
  const themeList: { id: ThemeId; name: string; desc: string }[] = [
    { id: 'cyber_dark', name: 'Cyber Dark', desc: 'Indigo & Cyan neon accents on obsidian' },
    { id: 'modern_glass', name: 'Modern Glass', desc: 'Vibrant blue & emerald with glass blur' },
    { id: 'minimal_light', name: 'Minimal Light', desc: 'Crisp zinc & monochromatic simplicity' },
    { id: 'editorial_serif', name: 'Editorial Serif', desc: 'Warm terracotta & timeless serif' },
    { id: 'nordic_slate', name: 'Nordic Slate', desc: 'Cool iceberg & slate blue minimalism' },
  ];

  const fontPairings = [
    { heading: 'Outfit', body: 'Inter', label: 'Outfit + Inter (Modern Tech)' },
    { heading: 'Space Grotesk', body: 'Inter', label: 'Space Grotesk (Developer)' },
    { heading: 'Plus Jakarta Sans', body: 'Inter', label: 'Plus Jakarta Sans (Clean Pro)' },
    { heading: 'Playfair Display', body: 'Newsreader', label: 'Playfair (Editorial / Academic)' },
  ];

  const handleSelectTheme = (id: ThemeId) => {
    if (PRESET_THEMES[id]) {
      onDesignChange({ ...PRESET_THEMES[id] });
    }
  };

  const handleColorChange = (key: keyof typeof design.colorPalette, value: string) => {
    onDesignChange({
      ...design,
      colorPalette: {
        ...design.colorPalette,
        [key]: value,
      },
    });
  };

  const handleFontChange = (headingFont: string, bodyFont: string) => {
    onDesignChange({
      ...design,
      typography: {
        ...design.typography,
        headingFont,
        bodyFont,
      },
    });
  };

  const handleRadiusChange = (radius: 'none' | 'sm' | 'md' | 'lg') => {
    onDesignChange({
      ...design,
      styling: {
        ...design.styling,
        borderRadius: radius,
      },
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...strategy.sectionOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    onStrategyChange({
      ...strategy,
      sectionOrder: newSections,
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-6 text-slate-100 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Device Viewport Selector */}
      <div className="space-y-2 pb-4 border-b border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-indigo-400" />
          <span>Preview Viewport</span>
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onScaleModeChange('desktop')}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              scaleMode === 'desktop' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => onScaleModeChange('tablet')}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              scaleMode === 'tablet' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => onScaleModeChange('mobile')}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              scaleMode === 'mobile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Theme Presets */}
      <div className="space-y-3 pb-4 border-b border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <span>Curated Theme Presets</span>
        </label>
        <div className="space-y-2">
          {themeList.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTheme(t.id)}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                design.themeId === t.id
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-2">
                  <span>{t.name}</span>
                  {design.themeId === t.id && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">{t.desc}</p>
              </div>

              {/* Color preview swatches */}
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: PRESET_THEMES[t.id].colorPalette.primary }}></span>
                <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: PRESET_THEMES[t.id].colorPalette.background }}></span>
                <span className="w-3.5 h-3.5 rounded-full border border-black/40" style={{ backgroundColor: PRESET_THEMES[t.id].colorPalette.accent }}></span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette Customizer */}
      <div className="space-y-3 pb-4 border-b border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Color Customizer</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Primary Brand</span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
              <input
                type="color"
                value={design.colorPalette.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-[11px] font-mono text-slate-300 uppercase">{design.colorPalette.primary}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Accent Color</span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
              <input
                type="color"
                value={design.colorPalette.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-[11px] font-mono text-slate-300 uppercase">{design.colorPalette.accent}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Background</span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
              <input
                type="color"
                value={design.colorPalette.background.startsWith('#') ? design.colorPalette.background : '#090d16'}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-[11px] font-mono text-slate-300 uppercase">{design.colorPalette.background}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">Card Surface</span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg">
              <input
                type="color"
                value={design.colorPalette.surface.startsWith('#') ? design.colorPalette.surface : '#111827'}
                onChange={(e) => handleColorChange('surface', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-[11px] font-mono text-slate-300 uppercase">{design.colorPalette.surface}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Selector */}
      <div className="space-y-3 pb-4 border-b border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          <span>Typography Pairings</span>
        </label>
        <div className="space-y-1.5">
          {fontPairings.map((f) => (
            <button
              key={f.heading}
              onClick={() => handleFontChange(f.heading, f.body)}
              className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium transition-all ${
                design.typography.headingFont === f.heading
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-3 pb-4 border-b border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layout className="w-3.5 h-3.5 text-indigo-400" />
          <span>Card Corner Style</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['none', 'sm', 'md', 'lg'] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRadiusChange(r)}
              className={`py-1.5 text-xs font-semibold rounded-lg border uppercase transition-all ${
                design.styling.borderRadius === r
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Section Reordering */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Section Priority</span>
          </span>
          <span className="text-[10px] text-indigo-400 font-normal">Dynamic Ordering</span>
        </label>

        <div className="space-y-1.5">
          {strategy.sectionOrder.map((sec, idx) => (
            <div
              key={sec}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium"
            >
              <span className="capitalize">{sec}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, 'up')}
                  className={`p-1 rounded hover:bg-slate-800 ${idx === 0 ? 'text-slate-600' : 'text-slate-400 hover:text-white'}`}
                  title="Move Up"
                >
                  ▲
                </button>
                <button
                  disabled={idx === strategy.sectionOrder.length - 1}
                  onClick={() => moveSection(idx, 'down')}
                  className={`p-1 rounded hover:bg-slate-800 ${idx === strategy.sectionOrder.length - 1 ? 'text-slate-600' : 'text-slate-400 hover:text-white'}`}
                  title="Move Down"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
