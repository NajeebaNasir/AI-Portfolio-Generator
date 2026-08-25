import { CanonicalProfile, ProvenanceClaim, ProvenanceCheck } from '@portfolio-generator/shared';

export class ProvenanceEngine {
  /**
   * Tokenizes text into lowercase alphanumeric word sets for fuzzy matching
   */
  private static tokenize(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    return new Set(words);
  }

  /**
   * Calculates word overlap score (Jaccard similarity)
   */
  public static calculateOverlap(claim: string, sourceText: string): number {
    const claimTokens = this.tokenize(claim);
    if (claimTokens.size === 0) return 1.0;

    const sourceTokens = this.tokenize(sourceText);
    let matched = 0;

    for (const token of claimTokens) {
      if (sourceTokens.has(token)) {
        matched++;
      }
    }

    return matched / claimTokens.size;
  }

  /**
   * Finds the best matching snippet in source text for a given claim
   */
  public static findSourceSnippet(claim: string, rawText: string): { snippet: string; confidence: number } {
    const rawNormalized = rawText.toLowerCase();
    const claimNormalized = claim.toLowerCase().trim();

    // 1. Direct exact substring match
    if (rawNormalized.includes(claimNormalized)) {
      const idx = rawNormalized.indexOf(claimNormalized);
      const start = Math.max(0, idx - 40);
      const end = Math.min(rawText.length, idx + claim.length + 40);
      return {
        snippet: rawText.substring(start, end).replace(/\n+/g, ' ').trim(),
        confidence: 1.0,
      };
    }

    // 2. Sentence-level best overlap
    const sentences = rawText.split(/[\n.!?]+/).map((s) => s.trim()).filter((s) => s.length > 10);
    let bestSnippet = '';
    let bestScore = 0;

    for (const sentence of sentences) {
      const score = this.calculateOverlap(claim, sentence);
      if (score > bestScore) {
        bestScore = score;
        bestSnippet = sentence;
      }
    }

    // If score is reasonable, return best sentence
    if (bestScore >= 0.4) {
      return {
        snippet: bestSnippet,
        confidence: Math.min(1.0, bestScore * 1.2),
      };
    }

    // Fallback: search across entire text
    const wholeDocScore = this.calculateOverlap(claim, rawText);
    return {
      snippet: wholeDocScore > 0.5 ? 'Grounded across source document context' : 'Unverified claim',
      confidence: wholeDocScore,
    };
  }

  /**
   * Validates an entire extracted CanonicalProfile against the source resume text
   */
  public static verifyProfileFidelity(profile: CanonicalProfile, rawResumeText: string): ProvenanceCheck {
    const claimsToVerify: { section: string; text: string }[] = [];
    const hallucinationAlerts: string[] = [];
    const unverifiedClaims: string[] = [];

    // Personal info claims
    if (profile.personal.name) claimsToVerify.push({ section: 'Personal', text: profile.personal.name });
    if (profile.personal.email) claimsToVerify.push({ section: 'Personal', text: profile.personal.email });
    if (profile.personal.location) claimsToVerify.push({ section: 'Personal', text: profile.personal.location });

    // Experience claims
    for (const exp of profile.experience) {
      claimsToVerify.push({ section: 'Experience', text: `${exp.role} ${exp.company}` });
      for (const h of exp.highlights) {
        claimsToVerify.push({ section: 'Experience Highlight', text: h });
      }
      for (const tech of exp.technologies) {
        claimsToVerify.push({ section: 'Technology', text: tech });
      }
    }

    // Projects
    for (const proj of profile.projects) {
      claimsToVerify.push({ section: 'Project', text: proj.name });
      claimsToVerify.push({ section: 'Project Description', text: proj.description });
      for (const tech of proj.technologies) {
        claimsToVerify.push({ section: 'Technology', text: tech });
      }
    }

    // Education
    for (const edu of profile.education) {
      claimsToVerify.push({ section: 'Education', text: `${edu.degree} ${edu.institution}` });
    }

    // Skills
    for (const cat of profile.skills) {
      for (const s of cat.skills) {
        claimsToVerify.push({ section: 'Skill', text: s });
      }
    }

    // Check each claim
    let verifiedCount = 0;
    const totalClaims = claimsToVerify.length;

    for (const item of claimsToVerify) {
      const match = this.findSourceSnippet(item.text, rawResumeText);
      if (match.confidence >= 0.4) {
        verifiedCount++;
      } else {
        unverifiedClaims.push(`[${item.section}] "${item.text}" (Confidence: ${(match.confidence * 100).toFixed(0)}%)`);
        if (match.confidence < 0.2 && item.section !== 'Personal') {
          hallucinationAlerts.push(`Potential ungrounded entity in ${item.section}: "${item.text}"`);
        }
      }
    }

    const fidelityScore = totalClaims > 0 ? Math.round((verifiedCount / totalClaims) * 100) : 100;

    return {
      totalClaims,
      verifiedClaims: verifiedCount,
      unverifiedClaims,
      hallucinationAlerts,
      fidelityScore,
    };
  }
}
