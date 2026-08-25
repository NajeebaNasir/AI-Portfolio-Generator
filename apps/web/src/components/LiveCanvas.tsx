import React, { useState } from 'react';
import { 
  CanonicalProfile, 
  DesignSpec, 
  PortfolioStrategy,
  SectionType 
} from '@portfolio-generator/shared';
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Award, 
  BookOpen, 
  MapPin, 
  Phone,
  Copy,
  Check,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ArrowUpRight,
  Edit3,
  CheckCircle2
} from 'lucide-react';

interface LiveCanvasProps {
  profile: CanonicalProfile;
  design: DesignSpec;
  strategy: PortfolioStrategy;
  onEditSection: (section: SectionType) => void;
  scaleMode?: 'desktop' | 'tablet' | 'mobile';
}

export const LiveCanvas: React.FC<LiveCanvasProps> = ({
  profile,
  design,
  strategy,
  onEditSection,
  scaleMode = 'desktop',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      console.warn('Failed to copy text:', err);
    }
  };

  const colors = design.colorPalette;
  const sections = strategy.sectionOrder || ['hero', 'projects', 'experience', 'skills', 'education', 'certifications', 'contact'];

  const radiusMap: Record<string, string> = {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '14px',
    full: '9999px',
  };
  const borderRadius = radiusMap[design.styling.borderRadius] || '8px';

  // Determine grid columns based on scaleMode
  const projectGridClass = scaleMode === 'mobile' ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-5';
  const skillGridClass = scaleMode === 'mobile' ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
  const twoColSectionClass = scaleMode === 'mobile' ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6';

  return (
    <div 
      className={`mx-auto transition-all duration-300 shadow-2xl overflow-hidden ${
        scaleMode === 'mobile' 
          ? 'max-w-[390px] border-[8px] border-slate-800 rounded-[36px]' 
          : scaleMode === 'tablet' 
          ? 'max-w-[768px] border-4 border-slate-800 rounded-2xl' 
          : 'w-full rounded-xl border border-slate-800'
      }`}
      style={{
        backgroundColor: colors.background,
        color: colors.textPrimary,
        fontFamily: `'${design.typography.bodyFont}', sans-serif`,
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-30 px-5 sm:px-6 py-4 border-b flex items-center justify-between transition-colors"
        style={{
          backgroundColor: design.styling.glassmorphism ? (colors.surface.includes('rgba') ? colors.surface : `${colors.surface}cc`) : colors.surface,
          borderColor: colors.border,
          backdropFilter: design.styling.glassmorphism ? 'blur(16px)' : 'none',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span 
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-extrabold text-sm border shadow-sm"
            style={{
              borderRadius: borderRadius,
              backgroundColor: colors.badgeBg || 'rgba(99, 102, 241, 0.15)',
              color: colors.primary,
              borderColor: `${colors.primary}40`,
            }}
          >
            {profile.personal.name ? profile.personal.name.charAt(0) : 'P'}
          </span>
          <span className="font-bold text-sm sm:text-base tracking-tight truncate" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
            {profile.personal.name || 'Your Name'}
          </span>
        </div>

        {/* Desktop Navigation */}
        {scaleMode !== 'mobile' && (
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
            {sections.filter(s => s !== 'hero').map(sec => (
              <a
                key={sec}
                href={`#canvas-${sec}`}
                className="capitalize hover:opacity-80 transition-opacity"
                style={{ color: colors.textMuted }}
              >
                {sec}
              </a>
            ))}
            <a
              href={`mailto:${profile.personal.email || 'hello@example.com'}`}
              className="px-3 py-1.5 font-semibold text-white flex items-center gap-1 shadow-sm transition-opacity hover:opacity-90 text-xs"
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius,
              }}
            >
              <span>{strategy.callToAction?.label || 'Contact'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </nav>
        )}

        {/* Mobile menu toggle */}
        {(scaleMode === 'mobile' || true) && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-slate-400 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </header>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div 
          className="px-6 py-3 border-b flex flex-col gap-2"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {sections.filter(s => s !== 'hero').map(sec => (
            <a
              key={sec}
              href={`#canvas-${sec}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold capitalize py-1"
              style={{ color: colors.textMuted }}
            >
              {sec}
            </a>
          ))}
        </div>
      )}

      {/* Main Canvas Container */}
      <div className="p-5 sm:p-8 md:p-10 space-y-12 sm:space-y-16 max-w-5xl mx-auto min-w-0">
        
        {/* HERO SECTION */}
        <section id="canvas-hero" className="pt-2 pb-4 space-y-4 relative group min-w-0">
          <button
            onClick={() => onEditSection('hero')}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded bg-indigo-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md z-10"
          >
            <Edit3 className="w-3 h-3" />
            <span>AI Edit Hero</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border max-w-full"
            style={{
              borderRadius: borderRadius,
              backgroundColor: colors.badgeBg || 'rgba(99, 102, 241, 0.1)',
              color: colors.primary,
              borderColor: `${colors.primary}33`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{strategy.targetRole || profile.personal.headline}</span>
          </div>

          <h1 
            className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight break-words"
            style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}
          >
            Hi, I'm <span style={{ color: colors.primary }}>{profile.personal.name || 'Candidate'}</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl break-words" style={{ color: colors.textMuted }}>
            {profile.personal.bio || profile.personal.headline}
          </p>

          {profile.personal.location && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.textMuted }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.accent }} />
              <span>{profile.personal.location}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#canvas-contact"
              className="px-4 py-2 font-semibold text-white text-xs flex items-center gap-1.5 shadow-md transition-opacity hover:opacity-90"
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius,
              }}
            >
              <span>Get in Touch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2">
              {profile.personal.socialLinks?.github && (
                <a
                  href={profile.personal.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 border transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius,
                    color: colors.textMuted,
                  }}
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}
              {profile.personal.socialLinks?.linkedin && (
                <a
                  href={profile.personal.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 border transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius,
                    color: colors.textMuted,
                  }}
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {profile.personal.email && (
                <a
                  href={`mailto:${profile.personal.email}`}
                  className="p-2 border transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius,
                    color: colors.textMuted,
                  }}
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* PROJECTS SECTION (All Projects Rendered) */}
        {profile.projects && profile.projects.length > 0 && (
          <section id="canvas-projects" className="space-y-4 sm:space-y-6 relative group min-w-0">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
              <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                <Code className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                <span>Featured Projects ({profile.projects.length})</span>
              </h2>
              <button
                onClick={() => onEditSection('projects')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit with AI</span>
              </button>
            </div>

            <div className={projectGridClass}>
              {profile.projects.map((proj) => (
                <div 
                  key={proj.id}
                  className="p-4 sm:p-5 border flex flex-col justify-between space-y-3 transition-all min-w-0 overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius,
                  }}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm sm:text-base truncate" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                        {proj.name}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {proj.githubUrl && <Github className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />}
                        {proj.liveUrl && <ExternalLink className="w-3.5 h-3.5" style={{ color: colors.textMuted }} />}
                      </div>
                    </div>

                    {proj.tagline && (
                      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate" style={{ color: colors.accent }}>{proj.tagline}</p>
                    )}

                    <p className="text-xs leading-relaxed break-words" style={{ color: colors.textMuted }}>{proj.description}</p>

                    {proj.highlights && proj.highlights.length > 0 && (
                      <ul className="text-[11px] space-y-1 list-disc list-inside pt-1" style={{ color: colors.textMuted }}>
                        {proj.highlights.map((h: string, idx: number) => (
                          <li key={idx} className="break-words">{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t min-w-0" style={{ borderColor: `${colors.border}80` }}>
                      {proj.technologies.map((t: string) => (
                        <span 
                          key={t}
                          className="px-2 py-0.5 text-[10px] font-medium border break-all max-w-full"
                          style={{
                            backgroundColor: colors.badgeBg,
                            color: colors.badgeText || colors.primary,
                            borderColor: `${colors.primary}30`,
                            borderRadius: '4px',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EXPERIENCE SECTION */}
        {profile.experience && profile.experience.length > 0 && (
          <section id="canvas-experience" className="space-y-4 sm:space-y-6 relative group min-w-0">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
              <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                <Briefcase className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                <span>Work Experience</span>
              </h2>
              <button
                onClick={() => onEditSection('experience')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit with AI</span>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {profile.experience.map((exp) => (
                <div 
                  key={exp.id}
                  className="p-4 sm:p-5 border space-y-2 min-w-0"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base break-words">{exp.role}</h3>
                      <p className="text-xs font-semibold" style={{ color: colors.primary }}>{exp.company}</p>
                    </div>
                    <span className="text-[10px] sm:text-[11px]" style={{ color: colors.textMuted }}>
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </span>
                  </div>

                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="text-xs space-y-1.5 list-disc list-inside pt-1 leading-relaxed" style={{ color: colors.textMuted }}>
                      {exp.highlights.map((h, i) => <li key={i} className="break-words">{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SKILLS SECTION (Fixed responsive wrapping) */}
        {profile.skills && profile.skills.length > 0 && (
          <section id="canvas-skills" className="space-y-4 sm:space-y-6 relative group min-w-0">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
              <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                <span>Skills & Toolkit</span>
              </h2>
            </div>

            <div className={skillGridClass}>
              {profile.skills.map((cat) => (
                <div 
                  key={cat.category}
                  className="p-3.5 sm:p-4 border space-y-2 min-w-0 overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius,
                  }}
                >
                  <h3 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate" style={{ color: colors.accent }}>{cat.category}</h3>
                  <div className="flex flex-wrap gap-1.5 min-w-0">
                    {cat.skills.map((s) => (
                      <span 
                        key={s}
                        className="px-2 py-0.5 text-[11px] font-medium border break-words max-w-full inline-block leading-tight text-center"
                        style={{
                          backgroundColor: colors.badgeBg,
                          color: colors.badgeText || colors.primary,
                          borderColor: `${colors.primary}30`,
                          borderRadius: '4px',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EDUCATION SECTION */}
        {profile.education && profile.education.length > 0 && (
          <section id="canvas-education" className="space-y-4 sm:space-y-6 relative group min-w-0">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
              <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                <GraduationCap className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                <span>Education</span>
              </h2>
            </div>
            <div className="space-y-3">
              {profile.education.map((edu) => (
                <div key={edu.id} className="p-4 sm:p-5 border space-y-1.5 min-w-0" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="font-bold text-sm sm:text-base break-words">
                      {edu.degree} {edu.fieldOfStudy && !edu.degree.toLowerCase().includes(edu.fieldOfStudy.toLowerCase()) ? `in ${edu.fieldOfStudy}` : ''}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.textMuted }}>
                      <span>{edu.startDate} {edu.endDate ? `- ${edu.endDate}` : ''}</span>
                      {edu.gpaOrGrade && (
                        <span className="font-medium px-2 py-0.5 rounded text-[11px]" style={{ backgroundColor: colors.badgeBg, color: colors.accent }}>
                          {edu.gpaOrGrade}
                        </span>
                      )}
                    </div>
                  </div>
                  {edu.institution && (
                    <p className="text-xs font-semibold" style={{ color: colors.primary }}>{edu.institution}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CERTIFICATIONS SECTION */}
        {profile.certifications && profile.certifications.length > 0 && (
          <section id="canvas-certifications" className="space-y-4 sm:space-y-6 relative group min-w-0">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.border }}>
              <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                <Award className="w-5 h-5 flex-shrink-0" style={{ color: colors.primary }} />
                <span>Certifications ({profile.certifications.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.certifications.map((cert: any, idx: number) => (
                <div key={idx} className="p-4 border space-y-1.5 min-w-0 flex flex-col justify-between" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius }}>
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm break-words flex items-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                      <span>{cert.name}</span>
                    </h3>
                    {cert.issuer && <p className="text-xs font-medium pl-5.5" style={{ color: colors.primary }}>{cert.issuer}</p>}
                  </div>
                  {cert.date && <p className="text-[10px] pl-5.5" style={{ color: colors.textMuted }}>{cert.date}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ACHIEVEMENTS & PUBLICATIONS */}
        {((profile.achievements && profile.achievements.length > 0) || (profile.publications && profile.publications.length > 0)) && (
          <section className={twoColSectionClass}>
            {profile.publications && profile.publications.length > 0 && (
              <div className="space-y-3 min-w-0">
                <h3 className="text-base sm:text-lg font-bold border-b pb-2 flex items-center gap-2" style={{ borderColor: colors.border, fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                  <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} />
                  <span>Publications</span>
                </h3>
                <div className="space-y-2">
                  {profile.publications.map((pub: any, idx: number) => (
                    <div key={idx} className="p-3.5 sm:p-4 border space-y-1 min-w-0" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius }}>
                      <h4 className="font-bold text-xs sm:text-sm break-words">{pub.title}</h4>
                      <p className="text-xs" style={{ color: colors.accent }}>{pub.venue} {pub.year ? `(${pub.year})` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profile.achievements && profile.achievements.length > 0 && (
              <div className="space-y-3 min-w-0">
                <h3 className="text-base sm:text-lg font-bold border-b pb-2 flex items-center gap-2" style={{ borderColor: colors.border, fontFamily: `'${design.typography.headingFont}', sans-serif` }}>
                  <Award className="w-4 h-4 flex-shrink-0" style={{ color: colors.primary }} />
                  <span>Key Achievements</span>
                </h3>
                <div className="p-3.5 sm:p-4 border min-w-0" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius }}>
                  <ul className="text-xs space-y-1.5 list-disc list-inside leading-relaxed" style={{ color: colors.textMuted }}>
                    {profile.achievements.map((ach: string, idx: number) => <li key={idx} className="break-words">{ach}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {/* CONTACT SECTION */}
        <section 
          id="canvas-contact" 
          className="p-6 sm:p-8 space-y-6 border shadow-sm min-w-0"
          style={{
            backgroundColor: colors.surface,
            borderColor: `${colors.primary}50`,
            borderRadius: borderRadius,
          }}
        >
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: `'${design.typography.headingFont}', sans-serif` }}>Let's Connect</h2>
            <p className="text-xs max-w-md mx-auto break-words" style={{ color: colors.textMuted }}>
              Open to discussing new projects, technical roles, or innovative collaborations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Email Card */}
            {profile.personal.email && (
              <div 
                className="p-3.5 border flex items-center justify-between gap-3 text-xs min-w-0 transition-all hover:border-indigo-400"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: colors.textMuted }}>Email</div>
                    <a href={`mailto:${profile.personal.email}`} className="font-semibold text-xs hover:underline truncate block" style={{ color: colors.textPrimary }}>
                      {profile.personal.email}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(profile.personal.email!, 'email')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded border flex items-center gap-1 flex-shrink-0 transition-colors"
                  style={{ backgroundColor: colors.badgeBg, color: colors.primary, borderColor: `${colors.primary}30` }}
                  title="Copy Email"
                >
                  {copiedField === 'email' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Phone Card */}
            {profile.personal.phone && (
              <div 
                className="p-3.5 border flex items-center justify-between gap-3 text-xs min-w-0 transition-all hover:border-indigo-400"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: colors.textMuted }}>Phone</div>
                    <a href={`tel:${profile.personal.phone}`} className="font-semibold text-xs hover:underline truncate block" style={{ color: colors.textPrimary }}>
                      {profile.personal.phone}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(profile.personal.phone!, 'phone')}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded border flex items-center gap-1 flex-shrink-0 transition-colors"
                  style={{ backgroundColor: colors.badgeBg, color: colors.primary, borderColor: `${colors.primary}30` }}
                  title="Copy Phone"
                >
                  {copiedField === 'phone' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Location Card */}
            {profile.personal.location && (
              <div 
                className="p-3.5 border flex items-center gap-2.5 text-xs min-w-0"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius }}
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: colors.textMuted }}>Location</div>
                  <div className="font-semibold text-xs truncate" style={{ color: colors.textPrimary }}>
                    {profile.personal.location}
                  </div>
                </div>
              </div>
            )}

            {/* LinkedIn Link Card */}
            {profile.personal.socialLinks?.linkedin && (
              <a
                href={profile.personal.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 border flex items-center justify-between gap-3 text-xs min-w-0 transition-all hover:border-indigo-400"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 flex-shrink-0">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: colors.textMuted }}>LinkedIn</div>
                    <div className="font-semibold text-xs truncate" style={{ color: colors.textPrimary }}>
                      View LinkedIn Profile
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.textMuted }} />
              </a>
            )}

            {/* GitHub Link Card */}
            {profile.personal.socialLinks?.github && (
              <a
                href={profile.personal.socialLinks.github}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 border flex items-center justify-between gap-3 text-xs min-w-0 transition-all hover:border-indigo-400"
                style={{ backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 flex-shrink-0">
                    <Github className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: colors.textMuted }}>GitHub</div>
                    <div className="font-semibold text-xs truncate" style={{ color: colors.textPrimary }}>
                      View GitHub Repositories
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.textMuted }} />
              </a>
            )}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t text-center text-[11px]" style={{ borderColor: colors.border, color: colors.textMuted }}>
        <p>© {new Date().getFullYear()} {profile.personal.name || 'Candidate'}. Built with AI Portfolio Generator.</p>
      </footer>
    </div>
  );
};
