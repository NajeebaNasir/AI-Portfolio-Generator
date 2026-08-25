import { Request, Response } from 'express';
import { PdfParser } from '../services/ingestion/pdfParser';
import { DocxParser } from '../services/ingestion/docxParser';
import { ProfileExtractor } from '../services/intelligence/profileExtractor';
import { ProfileEnricher } from '../services/intelligence/profileEnricher';
import { PortfolioStrategist } from '../services/intelligence/portfolioStrategist';
import { LlmFactory } from '../services/llm/LlmFactory';

export class ResumeController {
  public static async parseResume(req: Request, res: Response): Promise<void> {
    try {
      // ── 1. Extract raw text from uploaded file ──────────────────────────
      let rawText = '';

      if (req.file) {
        const mimeType = req.file.mimetype;
        const originalName = req.file.originalname.toLowerCase();

        if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
          rawText = await PdfParser.parse(req.file.buffer);
        } else if (
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          originalName.endsWith('.docx')
        ) {
          rawText = await DocxParser.parse(req.file.buffer);
        } else {
          rawText = req.file.buffer.toString('utf-8');
        }
      } else if (req.body?.text) {
        rawText = req.body.text;
      } else {
        res.status(400).json({ error: 'Please upload a PDF/DOCX resume file or provide resume text.' });
        return;
      }

      if (!rawText || rawText.trim().length < 10) {
        res.status(400).json({ error: 'Extracted resume text is too short or empty.' });
        return;
      }

      // Log the parsed text so we can see exactly what the PDF parser produces
      console.log('\n========== PARSED RESUME TEXT ==========\n');
      console.log(rawText);
      console.log('\n========================================\n');

      // ── 2. LLM call #1: Extract structured profile from resume text ─────
      const extractor = new ProfileExtractor();
      const { profile, warnings, engineUsed } = await extractor.extractProfile(rawText);

      // ── 3. LLM call #2: Enrich bio, tagline, project narratives ─────────
      const enricher = new ProfileEnricher();
      const enriched = await enricher.enrich(profile);

      // ── 4. Deterministic: classify archetype, pick theme, order sections ─
      const strategist = new PortfolioStrategist();
      const userThemeOverride = req.body?.themeOverride;
      const { strategy, designSpec } = strategist.generateStrategy(profile, userThemeOverride);

      // strategy.sectionOrder is already built from actual profile content by
      // the deterministic strategist — no need to rebuild it here.

      res.json({
        success: true,
        rawResumeText: rawText,
        profile,
        enriched,
        strategy,
        designSpec,
        warnings,
        engineUsed,
      });
    } catch (err: any) {
      console.error('[ResumeController] Error parsing resume:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An error occurred while parsing your resume.',
      });
    }
  }

  public static async regenerateSection(req: Request, res: Response): Promise<void> {
    try {
      const { section, profile, instruction } = req.body;
      if (!section || !profile || !instruction) {
        res.status(400).json({ error: 'Missing section, profile, or instruction.' });
        return;
      }

      let updatedData: any;

      try {
        const llm = LlmFactory.getProvider();

        const systemPrompt = `You are an expert portfolio copywriter.
Rewrite only the specified section of the candidate's profile according to the user instruction.
Rules:
- Do NOT add facts not present in the current data.
- Do NOT remove or change factual information (companies, dates, technologies, names).
- Write in a confident, portfolio-quality tone.
- Output ONLY valid JSON for the updated section — no markdown, no commentary.`;

        const userPrompt = `Section to update: ${section}
User instruction: "${instruction}"
Candidate: ${profile.personal?.name}
Current data for this section:
${JSON.stringify(section === 'personal' || section === 'hero' ? profile.personal : profile[section], null, 2)}`;

        updatedData = await llm.generateStructuredJson<any>([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);
      } catch (llmErr) {
        // Pass-through: return the existing section data unchanged.
        // Never invent or mutate data when the LLM is unavailable.
        console.warn('[ResumeController] LLM section edit failed, returning unchanged data:', llmErr);
        updatedData = (section === 'personal' || section === 'hero')
          ? profile.personal ?? {}
          : profile[section] ?? {};
      }

      res.json({ success: true, section, data: updatedData });
    } catch (err: any) {
      console.error('[ResumeController] Error in regenerateSection:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
