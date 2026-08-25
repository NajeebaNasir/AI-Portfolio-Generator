import { CanonicalProfile } from '@portfolio-generator/shared';
import { ILlmProvider } from '../llm/ILlmProvider';
import { LlmFactory } from '../llm/LlmFactory';

export interface EnrichedContent {
  about: string;           // polished 3–4 sentence portfolio-quality bio
  tagline: string;         // punchy single-line headline for the hero section
  projectNarratives: Record<string, string>; // project id → 2–3 sentence narrative
}

/**
 * ProfileEnricher — the second and final LLM call in the pipeline.
 *
 * PURPOSE:
 * ProfileExtractor faithfully extracts facts from the resume.
 * That gives us accurate structured data but resume-speak prose:
 * terse bullet fragments, abbreviated titles, passive voice.
 * A portfolio needs to read differently — confident, engaging, first-person.
 *
 * This enricher takes the already-structured profile (not the raw resume text)
 * and asks the LLM to do one thing: improve presentation quality.
 *
 * WHAT IT MAY DO:
 * - Rewrite the bio/summary into portfolio-quality prose
 * - Craft a punchy tagline from the headline + experience
 * - Convert project bullet points into a flowing 2–3 sentence narrative
 *
 * WHAT IT MUST NOT DO:
 * - Add facts not present in the profile
 * - Remove facts present in the profile
 * - Change company names, dates, technologies, or project names
 *
 * TOKEN EFFICIENCY:
 * We send only the fields that need enrichment — not the full profile.
 * Skills, education, certifications, and experience highlights are already
 * well-structured and rendered directly; they don't need LLM polish.
 */
export class ProfileEnricher {
  private llm: ILlmProvider;

  constructor(llm?: ILlmProvider) {
    this.llm = llm || LlmFactory.getProvider();
  }

  public async enrich(profile: CanonicalProfile): Promise<EnrichedContent> {
    // Build a minimal payload — only what needs polishing.
    // We deliberately exclude skills, education, certifications, experience
    // highlights — those render faithfully from the extracted data.
    const projectSummaries = profile.projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      highlights: p.highlights.slice(0, 3),   // top 3 bullets as context
      technologies: p.technologies,
    }));

    const systemPrompt = `You are a professional portfolio copywriter. Your job is to improve the PRESENTATION of already-verified resume data — not to add, remove, or change any facts.

Rules you must follow without exception:
1. Do NOT invent any new facts, companies, technologies, projects, or achievements.
2. Do NOT remove or contradict any fact from the input.
3. Do NOT change project names, company names, or technology names.
4. Write in first-person, confident, portfolio tone — not resume-speak.
5. Keep "about" to 3–4 sentences maximum.
6. Keep "tagline" to one punchy line under 12 words.
7. For each project narrative: 2–3 sentences maximum. Start with what it does, then the interesting technical challenge or impact.
8. Output pure JSON only — no markdown, no code fences.`;

    const userPrompt = `Candidate name: ${profile.personal.name}
Headline: ${profile.personal.headline}
Current bio/summary: ${profile.personal.bio || profile.personal.headline}
Experience: ${profile.experience.map((e) => `${e.role} at ${e.company} (${e.startDate}–${e.endDate || 'Present'})`).join('; ')}

Projects to write narratives for:
${JSON.stringify(projectSummaries, null, 2)}

Output JSON:
{
  "about": "3–4 sentence portfolio bio in first person",
  "tagline": "Punchy single-line tagline under 12 words",
  "projectNarratives": {
    ${projectSummaries.map((p) => `"${p.id}": "2–3 sentence narrative for ${p.name}"`).join(',\n    ')}
  }
}`;

    try {
      const result = await this.llm.generateStructuredJson<any>([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // Validate and sanitise — never let LLM output break the pipeline
      const about = typeof result?.about === 'string' && result.about.trim().length > 10
        ? result.about.trim()
        : profile.personal.bio || profile.personal.headline;

      const tagline = typeof result?.tagline === 'string' && result.tagline.trim().length > 3
        ? result.tagline.trim()
        : profile.personal.headline;

      const projectNarratives: Record<string, string> = {};
      for (const p of projectSummaries) {
        const narrative = result?.projectNarratives?.[p.id];
        projectNarratives[p.id] = typeof narrative === 'string' && narrative.trim().length > 10
          ? narrative.trim()
          : p.description || p.highlights[0] || '';
      }

      return { about, tagline, projectNarratives };
    } catch (err: any) {
      console.warn('[ProfileEnricher] LLM enrichment failed, using raw extracted content:', err.message);
      // Graceful fallback — use the extracted data as-is, no enrichment
      const projectNarratives: Record<string, string> = {};
      for (const p of profile.projects) {
        projectNarratives[p.id] = p.description || p.highlights[0] || '';
      }
      return {
        about: profile.personal.bio || profile.personal.headline,
        tagline: profile.personal.headline,
        projectNarratives,
      };
    }
  }
}
