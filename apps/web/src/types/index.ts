import {
  CanonicalProfile,
  PortfolioStrategy,
  DesignSpec,
  ValidationResult,
  ProvenanceCheck,
} from '@portfolio-generator/shared';

export type AppStep = 'upload' | 'preview' | 'export';

export interface EnrichedContent {
  about: string;
  tagline: string;
  projectNarratives: Record<string, string>;
}

export interface ParseResumeResponse {
  success: boolean;
  rawResumeText: string;
  profile: CanonicalProfile;
  enriched?: EnrichedContent;
  strategy: PortfolioStrategy;
  designSpec: DesignSpec;
  provenanceCheck?: ProvenanceCheck;
  warnings: string[];
  engineUsed?: 'groq_ai' | 'deterministic_fallback';
  error?: string;
}

export interface GeneratePortfolioResponse {
  success: boolean;
  validationResult: ValidationResult;
  files: { relativePath: string; size: number }[];
  error?: string;
}
