export interface SanitizedResult {
  cleanText: string;
  originalLength: number;
  truncated: boolean;
  warnings: string[];
}

export class TextSanitizer {
  private static readonly MAX_CHARS = 50000;

  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
    /system\s*:\s*you\s+are/gi,
    /disregard\s+(above|all)\s+guidelines/gi,
    /you\s+must\s+now\s+act\s+as/gi,
    /drop\s+table/gi,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  ];

  public static sanitize(rawText: string): SanitizedResult {
    const warnings: string[] = [];
    if (!rawText || typeof rawText !== 'string') {
      return { cleanText: '', originalLength: 0, truncated: false, warnings: ['Empty or non-string input'] };
    }

    const originalLength = rawText.length;

    // 1. Normalize line endings and remove null/dangerous binary bytes
    let text = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Detect and neutralize potential prompt injection phrases
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        warnings.push(`Neutralized potential prompt injection or unsafe pattern: ${pattern.toString()}`);
        text = text.replace(pattern, (match) => `[UNTRUSTED_TEXT_MUTED: "${match}"]`);
      }
    }

    // 3. If the text has no ## markers already (i.e. it was not pre-structured
    //    by pdfParser or docxParser — it came in as raw plain text), run a
    //    structural inference pass to promote section headers and bullets to
    //    the same ## / - format that the other parsers produce.
    //    This gives the LLM consistent structural signal regardless of input type.
    if (!text.includes('## ')) {
      text = TextSanitizer.inferStructure(text);
    }

    // 4. Prevent token exhaustion by truncating if excessive
    let truncated = false;
    if (text.length > this.MAX_CHARS) {
      text = text.substring(0, this.MAX_CHARS);
      truncated = true;
      warnings.push(`Text exceeded ${this.MAX_CHARS} characters and was safely truncated.`);
    }

    return {
      cleanText: text.trim(),
      originalLength,
      truncated,
      warnings,
    };
  }

  /**
   * Infers structure from plain text by promoting likely section headers
   * to ## markers and normalising bullet characters.
   *
   * Rules (in order):
   * 1. ALL-CAPS lines that are short (< 50 chars) and non-numeric → ## header
   * 2. Title-Case lines that are short AND followed by a blank line
   *    or a bullet line → ## header (common in plain-text resumes)
   * 3. Lines starting with common bullet proxies (*, ·, ►, ▸) → - bullet
   * 4. Everything else → unchanged body text
   *
   * These heuristics are intentionally conservative — they under-promote
   * rather than over-promote to avoid mis-marking content as headers.
   */
  private static inferStructure(rawText: string): string {
    const lines = rawText.split('\n');
    const output: string[] = [];

    const BULLET_PROXIES = /^[*·►▸▶‣⁃]\s+/;
    const ALL_CAPS_RE    = /^[A-Z][A-Z\s&/():'"-]{2,}$/;
    const TITLE_CASE_RE  = /^([A-Z][a-z]+(\s+[A-Z][a-z]*)*(\s+[&/]\s+[A-Z][a-z]*)*)\s*:?\s*$/;
    const DATE_RE        = /\d{4}/;
    const EMAIL_RE       = /@/;

    for (let i = 0; i < lines.length; i++) {
      const line    = lines[i].trim();
      const nextLine = (lines[i + 1] || '').trim();

      if (!line) {
        output.push('');
        continue;
      }

      // Already structured by a prior parser
      if (line.startsWith('## ') || line.startsWith('### ') || line.startsWith('- ')) {
        output.push(line);
        continue;
      }

      // Bullet proxy normalisation
      if (BULLET_PROXIES.test(line)) {
        output.push(`- ${line.replace(BULLET_PROXIES, '').trim()}`);
        continue;
      }

      // ALL-CAPS section header (e.g. "EXPERIENCE", "TECHNICAL SKILLS")
      const alphabetic = line.replace(/[^a-zA-Z]/g, '');
      const isAllCaps  = alphabetic.length >= 3 && alphabetic === alphabetic.toUpperCase();
      if (isAllCaps && line.length < 50 && !DATE_RE.test(line) && !EMAIL_RE.test(line)) {
        if (output.length > 0) output.push('');
        output.push(`## ${line}`);
        continue;
      }

      // Title-Case short line followed by blank or bullet → section header
      const isAfterBlank   = i === 0 || (lines[i - 1] || '').trim() === '';
      const beforeBulletOrBlank = nextLine === '' || nextLine.startsWith('-') || BULLET_PROXIES.test(nextLine);
      if (
        TITLE_CASE_RE.test(line) &&
        line.length < 50 &&
        !DATE_RE.test(line) &&
        !EMAIL_RE.test(line) &&
        (isAfterBlank || beforeBulletOrBlank)
      ) {
        if (output.length > 0) output.push('');
        output.push(`## ${line}`);
        continue;
      }

      output.push(line);
    }

    return output.join('\n');
  }

  public static wrapInUntrustedBoundary(cleanText: string): string {
    return `<UNTRUSTED_RESUME_DATA>\n${cleanText}\n</UNTRUSTED_RESUME_DATA>`;
  }
}
