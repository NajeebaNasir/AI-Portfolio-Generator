import { Request, Response } from 'express';
import { TemplateEngine } from '../services/generator/templateEngine';
import { SandboxManager } from '../services/validation/sandboxManager';
import { BuildValidator } from '../services/validation/buildValidator';
import { RepairEngine } from '../services/repair/repairEngine';
import { ZipPackager } from '../services/export/zipPackager';

export class PortfolioController {
  public static async generateAndValidate(req: Request, res: Response): Promise<void> {
    const sandbox = new SandboxManager();
    try {
      const { profile, designSpec, strategy, rawResumeText, enriched } = req.body;

      if (!profile || !designSpec || !strategy) {
        res.status(400).json({ error: 'Missing required profile, designSpec, or strategy in payload.' });
        return;
      }

      // 1. Generate portfolio files — enriched content flows into portfolioData.ts
      //    and is used by App.tsx for the polished bio, tagline, and project narratives.
      const projectFiles = TemplateEngine.generateProjectFiles(
        profile, designSpec, strategy, enriched ?? undefined
      );

      // 2. Write to ephemeral sandbox
      sandbox.initialize(projectFiles);

      // 3. Structural validation
      let validationResult = BuildValidator.validate(
        sandbox, profile, rawResumeText || '', strategy, designSpec
      );

      // 4. LLM self-repair if structural errors exist (rare with deterministic template)
      if (!validationResult.success) {
        const repairEngine = new RepairEngine();
        validationResult = await repairEngine.repairProject(
          sandbox, validationResult, 2,
          profile, rawResumeText || '', strategy, designSpec
        );
      }

      res.json({
        success: validationResult.success,
        validationResult,
        files: projectFiles.map((f) => ({ relativePath: f.relativePath, size: f.content.length })),
      });
    } catch (err: any) {
      console.error('[PortfolioController] Error in generateAndValidate:', err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      sandbox.cleanup();
    }
  }

  public static async downloadZip(req: Request, res: Response): Promise<void> {
    const sandbox = new SandboxManager();
    try {
      const { profile, designSpec, strategy, enriched } = req.body;

      if (!profile || !designSpec || !strategy) {
        res.status(400).json({ error: 'Missing profile, designSpec, or strategy.' });
        return;
      }

      const projectFiles = TemplateEngine.generateProjectFiles(
        profile, designSpec, strategy, enriched ?? undefined
      );
      sandbox.initialize(projectFiles);

      const candidateName = (profile.personal.name || 'portfolio')
        .toLowerCase().replace(/[^a-z0-9]/g, '-');

      ZipPackager.streamZipResponse(sandbox, res, `${candidateName}-portfolio.zip`);
    } catch (err: any) {
      console.error('[PortfolioController] Error downloading zip:', err);
      if (!res.headersSent) res.status(500).json({ error: err.message });
    } finally {
      setTimeout(() => sandbox.cleanup(), 15000);
    }
  }
}
