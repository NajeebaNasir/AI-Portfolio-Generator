import { z } from 'zod';

export const ProvenanceClaimSchema = z.object({
  id: z.string(),
  claimText: z.string(),
  sourceSnippet: z.string(),
  confidence: z.number().min(0).max(1).default(1.0),
  section: z.string().optional(),
});
export type ProvenanceClaim = z.infer<typeof ProvenanceClaimSchema>;

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional().default(''),
  startDate: z.string(),
  endDate: z.string().optional().default(''),
  isCurrent: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  tagline: z.string().optional().default(''),
  description: z.string(),
  highlights: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  liveUrl: z.string().optional().default(''),
  githubUrl: z.string().optional().default(''),
});
export type ProjectItem = z.infer<typeof ProjectItemSchema>;

export const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  gpaOrGrade: z.string().optional().default(''),
  honors: z.array(z.string()).default([]),
});
export type EducationItem = z.infer<typeof EducationItemSchema>;

export const SkillCategorySchema = z.object({
  category: z.string(),
  skills: z.array(z.string()),
});
export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const CertificationItemSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string().optional().default(''),
  url: z.string().optional().default(''),
});
export type CertificationItem = z.infer<typeof CertificationItemSchema>;

export const PublicationItemSchema = z.object({
  title: z.string(),
  venue: z.string(),
  year: z.string().optional().default(''),
  url: z.string().optional().default(''),
  authors: z.array(z.string()).default([]),
});
export type PublicationItem = z.infer<typeof PublicationItemSchema>;

export const PersonalInfoSchema = z.object({
  name: z.string(),
  headline: z.string(),
  bio: z.string(),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  location: z.string().optional().default(''),
  avatarUrl: z.string().optional().default(''),
  socialLinks: z.record(z.string()).default({}), // e.g. github, linkedin, twitter, website
});
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

export const CanonicalProfileSchema = z.object({
  personal: PersonalInfoSchema,
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  skills: z.array(SkillCategorySchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  publications: z.array(PublicationItemSchema).default([]),
  achievements: z.array(z.string()).default([]),
  provenance: z.array(ProvenanceClaimSchema).default([]),
});
export type CanonicalProfile = z.infer<typeof CanonicalProfileSchema>;
