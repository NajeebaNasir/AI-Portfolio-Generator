import { CanonicalProfile, DesignSpec, PortfolioStrategy } from '@portfolio-generator/shared';
import { EnrichedContent } from '../intelligence/profileEnricher';

export interface GeneratedProjectFile {
  relativePath: string;
  content: string;
}

export class TemplateEngine {
  public static generateProjectFiles(
    profile: CanonicalProfile,
    design: DesignSpec,
    strategy: PortfolioStrategy,
    enriched?: EnrichedContent
  ): GeneratedProjectFile[] {
    const files: GeneratedProjectFile[] = [];
    const colors = design.colorPalette;

    // ------------------------------------------------------------------
    // 1. package.json — removed unused framer-motion, clsx, tailwind-merge
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'package.json',
      content: JSON.stringify({
        name: `${profile.personal.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-portfolio`,
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
        dependencies: {
          'lucide-react': '^0.460.0',
          'react': '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@types/react': '^18.3.12',
          '@types/react-dom': '^18.3.1',
          '@vitejs/plugin-react': '^4.3.3',
          'autoprefixer': '^10.4.20',
          'postcss': '^8.4.49',
          'tailwindcss': '^3.4.15',
          'typescript': '^5.6.3',
          'vite': '^5.4.11',
        },
      }, null, 2),
    });

    // ------------------------------------------------------------------
    // 2. tsconfig.json
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'tsconfig.json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: false,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
      }, null, 2),
    });

    // ------------------------------------------------------------------
    // 3. vite.config.ts
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
});
`,
    });

    // ------------------------------------------------------------------
    // 4. tailwind.config.js
    // ------------------------------------------------------------------
    const radiusMap: Record<string, string> = {
      none: '0px', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px',
    };
    const borderRadiusVal = radiusMap[design.styling.borderRadius] || '0.5rem';

    files.push({
      relativePath: 'tailwind.config.js',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:     "${colors.primary}",
        secondary:   "${colors.secondary}",
        background:  "${colors.background}",
        surface:     "${colors.surface}",
        surfaceHover:"${colors.surfaceHover || colors.surface}",
        textPrimary: "${colors.textPrimary}",
        textMuted:   "${colors.textMuted}",
        accent:      "${colors.accent}",
        borderCustom:"${colors.border}",
        badgeBg:     "${colors.badgeBg}",
        badgeText:   "${colors.badgeText}",
      },
      fontFamily: {
        heading: ["'${design.typography.headingFont}'", "sans-serif"],
        body:    ["'${design.typography.bodyFont}'",    "sans-serif"],
      },
      borderRadius: { theme: "${borderRadiusVal}" },
    },
  },
  plugins: [],
};
`,
    });

    // ------------------------------------------------------------------
    // 5. postcss.config.js
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'postcss.config.js',
      content: `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`,
    });

    // ------------------------------------------------------------------
    // 6. index.html
    // ------------------------------------------------------------------
    const gfHead = encodeURIComponent(design.typography.headingFont);
    const gfBody = encodeURIComponent(design.typography.bodyFont);
    files.push({
      relativePath: 'index.html',
      content: `<!doctype html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💼</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${(profile.personal.bio || profile.personal.headline).replace(/"/g, '&quot;').substring(0, 160)}" />
    <meta name="author" content="${profile.personal.name.replace(/"/g, '&quot;')}" />
    <title>${profile.personal.name} | ${profile.personal.headline}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${gfHead}:wght@400;600;700;800&family=${gfBody}:wght@300;400;500;600&display=swap" rel="stylesheet">
  </head>
  <body style="background-color:${colors.background};color:${colors.textPrimary};font-family:'${design.typography.bodyFont}',sans-serif;">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    });

    // ------------------------------------------------------------------
    // 7. src/index.css
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'src/index.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { scroll-behavior: smooth; }
  body { background-color: ${colors.background}; color: ${colors.textPrimary}; }
  * { box-sizing: border-box; }
}

@layer components {
  .glass-card {
    background: ${design.styling.glassmorphism
      ? (colors.surface.includes('rgba') ? colors.surface : `${colors.surface}dd`)
      : colors.surface};
    backdrop-filter: ${design.styling.glassmorphism ? 'blur(12px)' : 'none'};
    border: 1px solid ${colors.border};
  }
  .section-heading {
    @apply text-2xl sm:text-3xl font-bold font-heading text-textPrimary mb-2;
  }
  .badge {
    @apply px-3 py-1 rounded-full text-xs font-semibold;
    background: ${colors.badgeBg};
    color: ${colors.badgeText};
    border: 1px solid ${colors.primary}30;
  }
  .nav-link {
    @apply text-sm font-medium text-textMuted hover:text-textPrimary transition-colors capitalize;
  }
  .btn-primary {
    @apply px-6 py-3 rounded-theme bg-primary text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg;
    box-shadow: 0 4px 24px ${colors.primary}40;
  }
  .btn-ghost {
    @apply px-5 py-2.5 rounded-theme font-medium transition-all flex items-center gap-2;
    background: transparent;
    border: 1px solid ${colors.border};
    color: ${colors.textPrimary};
  }
  .btn-ghost:hover { border-color: ${colors.primary}; }
  .timeline-line {
    @apply absolute left-0 top-0 bottom-0 w-px;
    background: linear-gradient(to bottom, ${colors.primary}, transparent);
  }
  .glow { box-shadow: 0 0 60px -10px ${colors.primary}44; }
}
`,
    });

    // ------------------------------------------------------------------
    // 8. src/portfolioData.ts — includes enriched content
    // ------------------------------------------------------------------
    const portfolioPayload = {
      profile,
      design,
      strategy,
      enriched: enriched ?? {
        about: profile.personal.bio || profile.personal.headline,
        tagline: profile.personal.headline,
        projectNarratives: Object.fromEntries(profile.projects.map((p) => [p.id, p.description || ''])),
      },
    };

    files.push({
      relativePath: 'src/portfolioData.ts',
      content: `export const portfolioData = ${JSON.stringify(portfolioPayload, null, 2)};\n`,
    });

    // ------------------------------------------------------------------
    // 9. src/main.tsx
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'src/main.tsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
`,
    });

    // ------------------------------------------------------------------
    // 10. src/App.tsx — premium layout
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'src/App.tsx',
      content: TemplateEngine.buildAppTsx(colors, design),
    });

    // ------------------------------------------------------------------
    // 11. .github/workflows/deploy.yml
    // ------------------------------------------------------------------
    files.push({
      relativePath: '.github/workflows/deploy.yml',
      content: [
        'name: Deploy Portfolio to GitHub Pages',
        '',
        'on:',
        '  push:',
        '    branches: [ main ]',
        '  workflow_dispatch:',
        '',
        'permissions:',
        '  contents: read',
        '  pages: write',
        '  id-token: write',
        '',
        'concurrency:',
        '  group: "pages"',
        '  cancel-in-progress: false',
        '',
        'jobs:',
        '  deploy:',
        '    environment:',
        '      name: github-pages',
        '      url: ${{ steps.deployment.outputs.page_url }}',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: actions/setup-node@v4',
        '        with: { node-version: 20, cache: "npm" }',
        '      - run: npm ci',
        '      - run: npm run build',
        '      - uses: actions/configure-pages@v4',
        '      - uses: actions/upload-pages-artifact@v3',
        '        with: { path: "./dist" }',
        '      - id: deployment',
        '        uses: actions/deploy-pages@v4',
      ].join('\n'),
    });

    // ------------------------------------------------------------------
    // 12. README.md
    // ------------------------------------------------------------------
    files.push({
      relativePath: 'README.md',
      content: `# ${profile.personal.name} — Portfolio

> Generated by the AI Portfolio Generator.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploy to GitHub Pages

Push to \`main\` — the included GitHub Actions workflow builds and deploys automatically.
`,
    });

    return files;
  }

  // --------------------------------------------------------------------
  // App.tsx — premium single-page portfolio
  // Sections: sticky nav → hero → about → [dynamic sections] → contact
  // Dynamic sections rendered in strategy.sectionOrder order.
  // --------------------------------------------------------------------
  private static buildAppTsx(colors: any, design: any): string {
    return `import React, { useState, useEffect } from 'react';
import { portfolioData } from './portfolioData';
import {
  Github, Linkedin, Mail, ExternalLink, Briefcase,
  GraduationCap, Code2, Award, BookOpen, MapPin,
  ChevronRight, Menu, X, Sparkles, ArrowUpRight,
  Link as LinkIcon, Trophy, Star,
} from 'lucide-react';

const { profile, strategy, enriched } = portfolioData;

// ─── Helpers ────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mb-10 pb-4 border-b border-borderCustom">
      <h2 className="section-heading flex items-center gap-3">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      {subtitle && <p className="text-sm text-textMuted mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Sections ───────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="hero" className="min-h-[90vh] flex items-center pt-24 pb-16 scroll-mt-20">
      <div className="w-full space-y-8">
        {/* Role badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border"
          style={{ borderColor: '${colors.primary}60', color: '${colors.primary}', background: '${colors.primary}15' }}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{enriched.tagline || strategy.targetRole || profile.personal.headline}</span>
        </div>

        {/* Name */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold font-heading tracking-tight leading-none text-textPrimary">
          Hi, I&apos;m{' '}
          <span style={{ color: '${colors.primary}' }}>{profile.personal.name}</span>
        </h1>

        {/* Bio */}
        <p className="text-lg md:text-xl text-textMuted leading-relaxed max-w-3xl">
          {enriched.about || profile.personal.bio || profile.personal.headline}
        </p>

        {/* Location */}
        {profile.personal.location && (
          <div className="flex items-center gap-2 text-sm text-textMuted">
            <MapPin className="w-4 h-4" style={{ color: '${colors.accent}' }} />
            <span>{profile.personal.location}</span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {profile.personal.email && (
            <a href={"mailto:" + profile.personal.email} className="btn-primary">
              <Mail className="w-4 h-4" />
              <span>Get in Touch</span>
            </a>
          )}
          <div className="flex items-center gap-3">
            {profile.personal.socialLinks?.github && (
              <a href={profile.personal.socialLinks.github} target="_blank" rel="noreferrer"
                className="btn-ghost" aria-label="GitHub">
                <Github className="w-5 h-5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            )}
            {profile.personal.socialLinks?.linkedin && (
              <a href={profile.personal.socialLinks.linkedin} target="_blank" rel="noreferrer"
                className="btn-ghost" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            )}
            {profile.personal.socialLinks?.website && (
              <a href={profile.personal.socialLinks.website} target="_blank" rel="noreferrer"
                className="btn-ghost" aria-label="Website">
                <LinkIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Website</span>
              </a>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="pt-8 flex items-center gap-3 text-xs text-textMuted/50 select-none">
          <div className="w-8 h-px" style={{ background: '${colors.border}' }} />
          <span>scroll to explore</span>
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  if (!profile.experience || profile.experience.length === 0) return null;
  return (
    <section id="experience" className="scroll-mt-24">
      <SectionHeader icon={<Briefcase className="w-7 h-7" />} title="Work Experience" subtitle="Professional track record" />
      <div className="relative pl-8 space-y-12">
        <div className="timeline-line" />
        {profile.experience.map((exp, idx) => (
          <div key={exp.id} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-8 mt-1.5 w-3 h-3 rounded-full border-2"
              style={{ borderColor: '${colors.primary}', background: '${colors.background}' }} />

            <div className="glass-card rounded-theme p-6 space-y-4 hover:border-primary/40 transition-colors">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold font-heading text-textPrimary">{exp.role}</h3>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '${colors.primary}' }}>{exp.company}</p>
                  {exp.location && (
                    <p className="text-xs text-textMuted mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{exp.location}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-xs font-mono px-3 py-1 rounded-full text-textMuted"
                  style={{ background: '${colors.badgeBg}', border: '1px solid ${colors.border}' }}>
                  {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                </div>
              </div>

              {/* Highlights */}
              {exp.highlights && exp.highlights.length > 0 && (
                <ul className="space-y-2">
                  {exp.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-textMuted leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '${colors.accent}' }} />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {/* Technologies */}
              {exp.technologies && exp.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-borderCustom">
                  {exp.technologies.map((t) => (
                    <span key={t} className="badge">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection() {
  if (!profile.projects || profile.projects.length === 0) return null;
  return (
    <section id="projects" className="scroll-mt-24">
      <SectionHeader icon={<Code2 className="w-7 h-7" />} title="Projects" subtitle="Things I have built" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profile.projects.map((proj) => {
          const narrative = enriched.projectNarratives?.[proj.id] || proj.description || '';
          return (
            <div key={proj.id}
              className="glass-card rounded-theme p-7 flex flex-col gap-5 hover:border-primary/50 transition-all group">
              {/* Title row */}
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold font-heading text-textPrimary group-hover:text-primary transition-colors leading-snug">
                  {proj.name}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  {proj.githubUrl && (
                    <a href={proj.githubUrl} target="_blank" rel="noreferrer"
                      className="p-2 rounded-theme transition-colors text-textMuted hover:text-textPrimary"
                      style={{ background: '${colors.badgeBg}' }} aria-label="GitHub">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {proj.liveUrl && (
                    <a href={proj.liveUrl} target="_blank" rel="noreferrer"
                      className="p-2 rounded-theme transition-colors text-textMuted hover:text-textPrimary"
                      style={{ background: '${colors.badgeBg}' }} aria-label="Live demo">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Tagline */}
              {proj.tagline && (
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '${colors.accent}' }}>
                  {proj.tagline}
                </p>
              )}

              {/* Narrative description */}
              <p className="text-sm text-textMuted leading-relaxed flex-1">{narrative}</p>

              {/* Highlights */}
              {proj.highlights && proj.highlights.length > 0 && (
                <ul className="space-y-1.5">
                  {proj.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-textMuted leading-relaxed">
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '${colors.primary}' }} />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              {/* Tech stack */}
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-borderCustom">
                  {proj.technologies.map((t) => (
                    <span key={t} className="badge">{t}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SkillsSection() {
  if (!profile.skills || profile.skills.length === 0) return null;
  return (
    <section id="skills" className="scroll-mt-24">
      <SectionHeader icon={<Star className="w-7 h-7" />} title="Skills & Toolkit" subtitle="Technologies and tools I work with" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {profile.skills.map((cat) => (
          <div key={cat.category} className="glass-card rounded-theme p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '${colors.accent}' }}>
              {cat.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {cat.skills.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-theme text-xs font-medium text-textMuted"
                  style={{ background: '${colors.badgeBg}', border: '1px solid ${colors.border}' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EducationSection() {
  if (!profile.education || profile.education.length === 0) return null;
  return (
    <section id="education" className="scroll-mt-24">
      <SectionHeader icon={<GraduationCap className="w-7 h-7" />} title="Education" />
      <div className="space-y-5">
        {profile.education.map((edu) => (
          <div key={edu.id} className="glass-card rounded-theme p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-heading text-textPrimary">{edu.degree}</h3>
              <p className="text-sm font-medium" style={{ color: '${colors.primary}' }}>{edu.institution}</p>
              {edu.fieldOfStudy && (
                <p className="text-xs text-textMuted">{edu.fieldOfStudy}</p>
              )}
              {edu.honors && edu.honors.length > 0 && (
                <p className="text-xs text-textMuted">{edu.honors.join(' · ')}</p>
              )}
            </div>
            <div className="shrink-0 text-right space-y-1">
              {(edu.startDate || edu.endDate) && (
                <p className="text-xs font-mono text-textMuted">
                  {edu.startDate}{edu.endDate ? ' – ' + edu.endDate : ''}
                </p>
              )}
              {edu.gpaOrGrade && (
                <p className="text-xs font-semibold" style={{ color: '${colors.accent}' }}>
                  {edu.gpaOrGrade}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CertificationsSection() {
  if (!profile.certifications || profile.certifications.length === 0) return null;
  return (
    <section id="certifications" className="scroll-mt-24">
      <SectionHeader icon={<Award className="w-7 h-7" />} title="Certifications & Learning" />
      <div className="space-y-4">
        {profile.certifications.map((cert, idx) => (
          <div key={idx}
            className="glass-card rounded-theme p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors">
            <div className="space-y-1 flex-1">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-theme flex items-center justify-center shrink-0"
                  style={{ background: '${colors.primary}20', color: '${colors.primary}' }}>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-textPrimary leading-snug">{cert.name}</h3>
                  {cert.issuer && (
                    <p className="text-sm mt-0.5" style={{ color: '${colors.primary}' }}>{cert.issuer}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {cert.date && (
                <span className="text-xs font-mono text-textMuted px-2.5 py-1 rounded-full"
                  style={{ background: '${colors.badgeBg}', border: '1px solid ${colors.border}' }}>
                  {cert.date}
                </span>
              )}
              {cert.url && (
                <a href={cert.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-theme transition-all"
                  style={{ background: '${colors.primary}', color: '#fff' }}>
                  <span>Verify</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AchievementsSection() {
  if (!profile.achievements || profile.achievements.length === 0) return null;
  return (
    <section id="achievements" className="scroll-mt-24">
      <SectionHeader icon={<Trophy className="w-7 h-7" />} title="Achievements" />
      <div className="glass-card rounded-theme p-6">
        <ul className="space-y-3">
          {profile.achievements.map((a, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-textMuted leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '${colors.accent}' }} />
              {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PublicationsSection() {
  if (!profile.publications || profile.publications.length === 0) return null;
  return (
    <section id="publications" className="scroll-mt-24">
      <SectionHeader icon={<BookOpen className="w-7 h-7" />} title="Publications" />
      <div className="space-y-4">
        {profile.publications.map((pub, i) => (
          <div key={i} className="glass-card rounded-theme p-5 space-y-1">
            <h3 className="font-semibold text-textPrimary leading-snug">{pub.title}</h3>
            <p className="text-sm" style={{ color: '${colors.accent}' }}>
              {pub.venue}{pub.year ? \` (\${pub.year})\` : ''}
            </p>
            {pub.authors && pub.authors.length > 0 && (
              <p className="text-xs text-textMuted">{pub.authors.join(', ')}</p>
            )}
            {pub.url && (
              <a href={pub.url} target="_blank" rel="noreferrer"
                className="text-xs font-medium flex items-center gap-1 mt-2" style={{ color: '${colors.primary}' }}>
                <ExternalLink className="w-3 h-3" /> Read paper
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24">
      <div className="glass-card rounded-theme p-10 md:p-16 text-center space-y-8 glow"
        style={{ borderColor: '${colors.primary}40' }}>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-textPrimary">
          Let&apos;s Connect
        </h2>
        <p className="text-textMuted max-w-xl mx-auto text-base leading-relaxed">
          Open to discussing new projects, technical roles, or innovative collaborations.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {profile.personal.email && (
            <a href={"mailto:" + profile.personal.email} className="btn-primary">
              <Mail className="w-4 h-4" />
              <span>{profile.personal.email}</span>
            </a>
          )}
          {profile.personal.socialLinks?.linkedin && (
            <a href={profile.personal.socialLinks.linkedin} target="_blank" rel="noreferrer" className="btn-ghost">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
          )}
          {profile.personal.socialLinks?.github && (
            <a href={profile.personal.socialLinks.github} target="_blank" rel="noreferrer" className="btn-ghost">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Section router — renders correct component for each section key ─────────

function renderSection(key: string) {
  switch (key) {
    case 'experience':     return <ExperienceSection key={key} />;
    case 'projects':       return <ProjectsSection key={key} />;
    case 'skills':         return <SkillsSection key={key} />;
    case 'education':      return <EducationSection key={key} />;
    case 'certifications': return <CertificationsSection key={key} />;
    case 'achievements':   return <AchievementsSection key={key} />;
    case 'publications':   return <PublicationsSection key={key} />;
    case 'contact':        return <ContactSection key={key} />;
    default:               return null;
  }
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navSections = strategy.sectionOrder.filter((s) => s !== 'hero');

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Sticky Nav ─────────────────────────────────────────── */}
      <header className={\`fixed top-0 inset-x-0 z-50 transition-all duration-300 \${
        scrolled ? 'glass-card shadow-lg' : 'bg-transparent'
      }\`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2.5 font-bold font-heading text-textPrimary text-lg">
            <span className="w-8 h-8 rounded-theme flex items-center justify-center font-extrabold text-sm"
              style={{ background: '${colors.primary}25', color: '${colors.primary}', border: '1px solid ${colors.primary}40' }}>
              {profile.personal.name.charAt(0)}
            </span>
            {profile.personal.name}
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navSections.filter(s => s !== 'contact').map((sec) => (
              <a key={sec} href={"#" + sec} className="nav-link">{sec}</a>
            ))}
            {profile.personal.email && (
              <a href={"mailto:" + profile.personal.email}
                className="flex items-center gap-1.5 px-4 py-2 rounded-theme text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '${colors.primary}' }}>
                <span>{strategy.callToAction?.label || 'Contact'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-textMuted hover:text-textPrimary"
            onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden glass-card border-t border-borderCustom px-6 py-4 flex flex-col gap-4">
            {navSections.map((sec) => (
              <a key={sec} href={"#" + sec} onClick={() => setMenuOpen(false)} className="nav-link text-base py-1">
                {sec}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 space-y-32 pb-24">
        <HeroSection />
        {navSections.map((sec) => renderSection(sec))}
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-borderCustom py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-textMuted">
          <p>© {new Date().getFullYear()} {profile.personal.name}. Built with AI Portfolio Generator.</p>
          <p className="text-textMuted/50">Deployable to GitHub Pages · Zero configuration</p>
        </div>
      </footer>
    </div>
  );
}
`;
  }
}
