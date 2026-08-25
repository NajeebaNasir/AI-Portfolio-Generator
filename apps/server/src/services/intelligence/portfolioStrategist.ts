import {
  CanonicalProfile,
  PortfolioStrategy,
  PortfolioStrategySchema,
  CareerArchetype,
  DesignSpec,
  PRESET_THEMES,
  ThemeId,
} from '@portfolio-generator/shared';

/**
 * PortfolioStrategist — fully deterministic.
 *
 * All decisions (archetype, section order, theme) are derived from the
 * already-structured CanonicalProfile using rule-based logic. No LLM call.
 *
 * Rationale:
 * - Archetype classification: simple keyword + count rules, no language
 *   understanding needed.
 * - Section order: just check which sections have content.
 * - Theme selection: a 5-row lookup table keyed on archetype.
 *
 * The LLM's strategy call was previously being overridden by resumeController
 * anyway (section order rebuilt from scratch after the call returned). Removing
 * the call saves ~600–800 tokens per request with zero quality loss.
 *
 * Quality is instead invested in ProfileEnricher which polishes bio and
 * project narratives — where LLM output is genuinely visible to the user.
 */
export class PortfolioStrategist {

  // ---------------------------------------------------------------------------
  // Archetype classification — rule-based
  // ---------------------------------------------------------------------------
  public static classifyArchetype(profile: CanonicalProfile): CareerArchetype {
    const pubCount  = profile.publications?.length  || 0;
    const expCount  = profile.experience?.length    || 0;
    const projCount = profile.projects?.length      || 0;
    const headline  = (profile.personal.headline    || '').toLowerCase();
    const bio       = (profile.personal.bio         || '').toLowerCase();
    const combined  = `${headline} ${bio}`;

    if (
      pubCount >= 2 ||
      /\b(research|phd|ph\.d|scientist|postdoc|professor|academia)\b/.test(combined)
    ) return 'researcher';

    if (
      /\b(ui\/ux|ux design|product design|visual design|graphic design|interaction design)\b/.test(combined)
    ) return 'designer';

    if (
      /\b(product manager|engineering manager|vp of|head of|director of|chief)\b/.test(combined)
    ) return 'product_leader';

    if (
      expCount === 0 ||
      (expCount <= 1 && projCount >= 2) ||
      /\b(student|fresher|graduate|intern|entry.?level)\b/.test(combined)
    ) return 'student_fresher';

    return 'software_engineer';
  }

  // ---------------------------------------------------------------------------
  // Theme selection — lookup table keyed on archetype
  // ---------------------------------------------------------------------------
  public static selectTheme(archetype: CareerArchetype, userThemeOverride?: ThemeId): ThemeId {
    if (userThemeOverride && PRESET_THEMES[userThemeOverride]) return userThemeOverride;

    const ARCHETYPE_THEME: Record<CareerArchetype, ThemeId> = {
      software_engineer: 'cyber_dark',
      student_fresher:   'nordic_slate',
      designer:          'minimal_light',
      product_leader:    'modern_glass',
      researcher:        'editorial_serif',
      general_professional: 'minimal_light',
    };
    return ARCHETYPE_THEME[archetype] ?? 'cyber_dark';
  }

  // ---------------------------------------------------------------------------
  // Section order — content-density driven, no 'about' (no rendered section)
  // ---------------------------------------------------------------------------
  public static determineSectionOrder(
    profile: CanonicalProfile,
    archetype: CareerArchetype
  ): string[] {
    const has = {
      experience:     (profile.experience?.length    || 0) > 0,
      projects:       (profile.projects?.length      || 0) > 0,
      skills:         (profile.skills?.length        || 0) > 0,
      education:      (profile.education?.length     || 0) > 0,
      certifications: (profile.certifications?.length || 0) > 0,
      achievements:   (profile.achievements?.length  || 0) > 0,
      publications:   (profile.publications?.length  || 0) > 0,
    };

    // Base order per archetype — strongest material first
    const orders: Record<CareerArchetype, (keyof typeof has)[]> = {
      software_engineer:    ['experience', 'projects', 'skills', 'education', 'certifications', 'achievements'],
      student_fresher:      ['projects', 'skills', 'education', 'experience', 'certifications', 'achievements'],
      designer:             ['projects', 'skills', 'experience', 'education', 'achievements', 'certifications'],
      researcher:           ['publications', 'experience', 'projects', 'education', 'skills', 'certifications'],
      product_leader:       ['experience', 'achievements', 'projects', 'skills', 'education', 'certifications'],
      general_professional: ['experience', 'skills', 'projects', 'education', 'certifications', 'achievements'],
    };

    const preferred = orders[archetype] ?? orders.software_engineer;
    const sections: string[] = ['hero'];
    for (const key of preferred) {
      if (has[key]) sections.push(key);
    }
    sections.push('contact');
    return sections;
  }

  // ---------------------------------------------------------------------------
  // Main entry point
  // ---------------------------------------------------------------------------
  public generateStrategy(
    profile: CanonicalProfile,
    userThemeOverride?: ThemeId
  ): { strategy: PortfolioStrategy; designSpec: DesignSpec } {
    const archetype   = PortfolioStrategist.classifyArchetype(profile);
    const themeId     = PortfolioStrategist.selectTheme(archetype, userThemeOverride);
    const sectionOrder = PortfolioStrategist.determineSectionOrder(profile, archetype);

    const strategy = PortfolioStrategySchema.parse({
      archetype,
      targetRole:   profile.personal.headline || 'Professional',
      narrativeTone: 'modern_tech',
      sectionOrder,
      featuredProjectIds: profile.projects.slice(0, 3).map((p) => p.id),
      callToAction: {
        label:      'Get in Touch',
        actionType: 'email',
        target:     profile.personal.email
          ? `mailto:${profile.personal.email}`
          : 'mailto:hello@example.com',
      },
      layoutRecommendation: '',
    });

    const designSpec = PRESET_THEMES[themeId] ?? PRESET_THEMES.cyber_dark;
    return { strategy, designSpec };
  }
}
