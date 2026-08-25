import { z } from 'zod';

export const ThemeIdEnum = z.enum([
  'cyber_dark',
  'minimal_light',
  'editorial_serif',
  'modern_glass',
  'nordic_slate',
]);
export type ThemeId = z.infer<typeof ThemeIdEnum>;

export const ColorPaletteSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  background: z.string(),
  surface: z.string(),
  surfaceHover: z.string().default(''),
  textPrimary: z.string(),
  textMuted: z.string(),
  accent: z.string(),
  border: z.string(),
  badgeBg: z.string().default(''),
  badgeText: z.string().default(''),
});
export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

export const TypographySpecSchema = z.object({
  headingFont: z.string(), // e.g. "Outfit", "Space Grotesk", "Playfair Display", "Plus Jakarta Sans"
  bodyFont: z.string(),    // e.g. "Inter", "Plus Jakarta Sans", "Roboto"
  scaleRatio: z.number().default(1.25),
});
export type TypographySpec = z.infer<typeof TypographySpecSchema>;

export const StylingSpecSchema = z.object({
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
  glassmorphism: z.boolean().default(true),
  animationLevel: z.enum(['none', 'subtle', 'expressive']).default('subtle'),
  layoutDensity: z.enum(['compact', 'balanced', 'spacious']).default('balanced'),
  showMetricsCards: z.boolean().default(true),
});
export type StylingSpec = z.infer<typeof StylingSpecSchema>;

export const DesignSpecSchema = z.object({
  themeId: ThemeIdEnum,
  colorPalette: ColorPaletteSchema,
  typography: TypographySpecSchema,
  styling: StylingSpecSchema,
});
export type DesignSpec = z.infer<typeof DesignSpecSchema>;

// Pre-packaged curated modern design presets
export const PRESET_THEMES: Record<ThemeId, DesignSpec> = {
  cyber_dark: {
    themeId: 'cyber_dark',
    colorPalette: {
      primary: '#6366f1', // Indigo
      secondary: '#a855f7', // Purple
      background: '#090d16', // Deep Obsidian
      surface: '#111827', // Slate 900
      surfaceHover: '#1f2937',
      textPrimary: '#f9fafb',
      textMuted: '#9ca3af',
      accent: '#38bdf8', // Sky
      border: '#1f2937',
      badgeBg: 'rgba(99, 102, 241, 0.15)',
      badgeText: '#818cf8',
    },
    typography: {
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      scaleRatio: 1.25,
    },
    styling: {
      borderRadius: 'md',
      glassmorphism: true,
      animationLevel: 'subtle',
      layoutDensity: 'balanced',
      showMetricsCards: true,
    },
  },
  minimal_light: {
    themeId: 'minimal_light',
    colorPalette: {
      primary: '#18181b', // Zinc 900
      secondary: '#52525b',
      background: '#fafafa',
      surface: '#ffffff',
      surfaceHover: '#f4f4f5',
      textPrimary: '#09090b',
      textMuted: '#71717a',
      accent: '#2563eb',
      border: '#e4e4e7',
      badgeBg: '#f4f4f5',
      badgeText: '#18181b',
    },
    typography: {
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
      scaleRatio: 1.2,
    },
    styling: {
      borderRadius: 'sm',
      glassmorphism: false,
      animationLevel: 'subtle',
      layoutDensity: 'spacious',
      showMetricsCards: false,
    },
  },
  editorial_serif: {
    themeId: 'editorial_serif',
    colorPalette: {
      primary: '#9a3412', // Warm amber/terracotta
      secondary: '#431407',
      background: '#fdfbf7', // Warm parchment
      surface: '#ffffff',
      surfaceHover: '#f5f0e6',
      textPrimary: '#1c1917',
      textMuted: '#78716c',
      accent: '#b45309',
      border: '#e7e5e4',
      badgeBg: '#fef3c7',
      badgeText: '#92400e',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Newsreader',
      scaleRatio: 1.3,
    },
    styling: {
      borderRadius: 'none',
      glassmorphism: false,
      animationLevel: 'subtle',
      layoutDensity: 'spacious',
      showMetricsCards: false,
    },
  },
  modern_glass: {
    themeId: 'modern_glass',
    colorPalette: {
      primary: '#06b6d4', // Cyan
      secondary: '#3b82f6', // Blue
      background: '#030712',
      surface: 'rgba(17, 24, 39, 0.75)',
      surfaceHover: 'rgba(31, 41, 55, 0.85)',
      textPrimary: '#f8fafc',
      textMuted: '#94a3b8',
      accent: '#10b981', // Emerald
      border: 'rgba(255, 255, 255, 0.1)',
      badgeBg: 'rgba(6, 182, 212, 0.15)',
      badgeText: '#22d3ee',
    },
    typography: {
      headingFont: 'Space Grotesk',
      bodyFont: 'Inter',
      scaleRatio: 1.25,
    },
    styling: {
      borderRadius: 'lg',
      glassmorphism: true,
      animationLevel: 'expressive',
      layoutDensity: 'balanced',
      showMetricsCards: true,
    },
  },
  nordic_slate: {
    themeId: 'nordic_slate',
    colorPalette: {
      primary: '#38bdf8', // Ice Blue
      secondary: '#818cf8',
      background: '#0f172a', // Slate 900
      surface: '#1e293b', // Slate 800
      surfaceHover: '#334155',
      textPrimary: '#f1f5f9',
      textMuted: '#94a3b8',
      accent: '#2dd4bf', // Teal
      border: '#334155',
      badgeBg: 'rgba(56, 189, 248, 0.12)',
      badgeText: '#7dd3fc',
    },
    typography: {
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
      scaleRatio: 1.22,
    },
    styling: {
      borderRadius: 'md',
      glassmorphism: true,
      animationLevel: 'subtle',
      layoutDensity: 'compact',
      showMetricsCards: true,
    },
  },
};
