import { z } from 'zod';

export const CareerArchetypeEnum = z.enum([
  'software_engineer',
  'designer',
  'researcher',
  'student_fresher',
  'product_leader',
  'general_professional',
]);
export type CareerArchetype = z.infer<typeof CareerArchetypeEnum>;

export const SectionTypeEnum = z.enum([
  'hero',
  'about',
  'experience',
  'projects',
  'skills',
  'education',
  'certifications',
  'publications',
  'achievements',
  'contact',
]);
export type SectionType = z.infer<typeof SectionTypeEnum>;

export const CallToActionSchema = z.object({
  label: z.string(),
  actionType: z.enum(['email', 'link', 'resume_download']),
  target: z.string(),
});
export type CallToAction = z.infer<typeof CallToActionSchema>;

export const PortfolioStrategySchema = z.object({
  archetype: CareerArchetypeEnum,
  targetRole: z.string().default(''),
  narrativeTone: z.enum(['modern_tech', 'minimal_editorial', 'executive', 'creative_vibrant', 'academic']),
  sectionOrder: z.array(SectionTypeEnum),
  featuredProjectIds: z.array(z.string()).default([]),
  callToAction: CallToActionSchema,
  layoutRecommendation: z.string().default(''),
});
export type PortfolioStrategy = z.infer<typeof PortfolioStrategySchema>;
