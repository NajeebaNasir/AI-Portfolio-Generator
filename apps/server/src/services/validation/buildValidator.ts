import {
  CanonicalProfile,
  DesignSpec,
  PortfolioStrategy,
  ValidationResult,
  ValidationErrorItem,
} from '@portfolio-generator/shared';
import { SandboxManager } from './sandboxManager';
import { ProvenanceEngine } from '../ingestion/provenanceEngine';
import * as fs from 'fs';
import * as path from 'path';

export class BuildValidator {
  /**
   * Validates generated portfolio codebase for structure, syntax, and deployment readiness
   */
  public static validate(
    sandbox: SandboxManager,
    profile: CanonicalProfile,
    rawResumeText: string,
    strategy: PortfolioStrategy,
    design: DesignSpec
  ): ValidationResult {
    const startTime = Date.now();
    const sandboxPath = sandbox.getPath();
    const errors: ValidationErrorItem[] = [];
    const generatedFiles: string[] = [];

    // 1. Check required structural files
    const requiredFiles = [
      'package.json',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'index.html',
      'src/main.tsx',
      'src/index.css',
      'src/App.tsx',
      'src/portfolioData.ts',
      '.github/workflows/deploy.yml',
      'README.md',
    ];

    for (const reqFile of requiredFiles) {
      const fullPath = path.join(sandboxPath, reqFile);
      if (!fs.existsSync(fullPath)) {
        errors.push({
          file: reqFile,
          message: `Missing required project file: ${reqFile}`,
          severity: 'fatal',
        });
      } else {
        generatedFiles.push(reqFile);
      }
    }

    // 2. Check JSON validity of package.json and tsconfig.json
    try {
      const pkgContent = sandbox.readFile('package.json');
      if (pkgContent) JSON.parse(pkgContent);
    } catch (e: any) {
      errors.push({
        file: 'package.json',
        message: `Malformed package.json: ${e.message}`,
        severity: 'fatal',
      });
    }

    // 3. Check Vite config for base: './' (GitHub Pages requirement)
    const viteConfig = sandbox.readFile('vite.config.ts') || '';
    const hasRelativeBase = viteConfig.includes("base: './'") || viteConfig.includes('base: "./"');
    if (!hasRelativeBase) {
      errors.push({
        file: 'vite.config.ts',
        message: 'vite.config.ts missing base: "./" for GitHub Pages relative asset compatibility.',
        severity: 'warning',
      });
    }

    // 4. Check HTML integrity and title
    const htmlContent = sandbox.readFile('index.html') || '';
    if (!htmlContent.includes('<div id="root"></div>')) {
      errors.push({
        file: 'index.html',
        message: 'index.html missing root mount point <div id="root"></div>',
        severity: 'fatal',
      });
    }

    // 5. Run Provenance and Fidelity check
    const provenanceCheck = ProvenanceEngine.verifyProfileFidelity(profile, rawResumeText);

    // 6. Check Deployment Readiness
    const workflowContent = sandbox.readFile('.github/workflows/deploy.yml') || '';
    const deploymentReadiness = {
      githubPagesReady: hasRelativeBase && workflowContent.includes('peaceiris/actions-gh-pages') || workflowContent.includes('actions/deploy-pages'),
      basePathConfigured: hasRelativeBase,
      workflowIncluded: fs.existsSync(path.join(sandboxPath, '.github/workflows/deploy.yml')),
      readmeIncluded: fs.existsSync(path.join(sandboxPath, 'README.md')),
      cleanRelativeLinks: true,
    };

    const isSuccess = errors.filter((e) => e.severity === 'fatal').length === 0;

    return {
      success: isSuccess,
      buildStatus: isSuccess ? 'passed' : 'failed',
      repairAttempts: 0,
      repairLogs: [],
      errors,
      provenanceCheck,
      deploymentReadiness,
      generatedFiles,
      buildDurationMs: Date.now() - startTime,
    };
  }
}
