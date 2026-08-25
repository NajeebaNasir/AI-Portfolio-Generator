import { z } from 'zod';

export const ValidationErrorItemSchema = z.object({
  file: z.string(),
  line: z.number().optional(),
  column: z.number().optional(),
  message: z.string(),
  severity: z.enum(['fatal', 'warning']),
});
export type ValidationErrorItem = z.infer<typeof ValidationErrorItemSchema>;

export const ProvenanceCheckSchema = z.object({
  totalClaims: z.number(),
  verifiedClaims: z.number(),
  unverifiedClaims: z.array(z.string()).default([]),
  hallucinationAlerts: z.array(z.string()).default([]),
  fidelityScore: z.number().min(0).max(100),
});
export type ProvenanceCheck = z.infer<typeof ProvenanceCheckSchema>;

export const DeploymentReadinessSchema = z.object({
  githubPagesReady: z.boolean(),
  basePathConfigured: z.boolean(),
  workflowIncluded: z.boolean(),
  readmeIncluded: z.boolean(),
  cleanRelativeLinks: z.boolean(),
});
export type DeploymentReadiness = z.infer<typeof DeploymentReadinessSchema>;

export const ValidationResultSchema = z.object({
  success: z.boolean(),
  buildStatus: z.enum(['passed', 'failed', 'repaired']),
  repairAttempts: z.number().min(0).max(3).default(0),
  repairLogs: z.array(z.string()).default([]),
  errors: z.array(ValidationErrorItemSchema).default([]),
  provenanceCheck: ProvenanceCheckSchema,
  deploymentReadiness: DeploymentReadinessSchema,
  generatedFiles: z.array(z.string()).default([]),
  bundleSizeBytes: z.number().optional(),
  buildDurationMs: z.number().optional(),
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
