import { CanonicalProfile, CanonicalProfileSchema } from '@portfolio-generator/shared';
import { ILlmProvider } from '../llm/ILlmProvider';
import { LlmFactory } from '../llm/LlmFactory';
import { TextSanitizer } from '../ingestion/textSanitizer';
import { ProvenanceEngine } from '../ingestion/provenanceEngine';
import { v4 as uuidv4 } from 'uuid';

export interface ProfileExtractionResult {
  profile: CanonicalProfile;
  warnings: string[];
  engineUsed: 'groq_ai' | 'deterministic_fallback';
}

// ---------------------------------------------------------------------------
// Section-header detection helpers
// ---------------------------------------------------------------------------

const SECTION_PATTERNS: Record<string, RegExp> = {
  experience:     /^(##\s*)?(work\s+)?experience|employment\s+history|professional\s+experience/i,
  projects:       /^(##\s*)?projects?(\s+&\s+work)?|personal\s+projects?|key\s+projects?/i,
  education:      /^(##\s*)?education|academic\s+background|qualifications?/i,
  skills:         /^(##\s*)?(technical\s+)?skills?|core\s+competenc|technologies/i,
  certifications: /^(##\s*)?certifications?(\s+&\s+\w+)?|licenses?\s*(&|and)\s*certifications?|credentials?/i,
  achievements:   /^(##\s*)?achievements?|awards?|honors?|accomplishments?/i,
  publications:   /^(##\s*)?publications?|research|papers?/i,
};

/**
 * Splits raw resume text into named sections.
 * Returns a map of sectionName → lines belonging to that section.
 */
function splitIntoSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = { header: [] };
  let current = 'header';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;
    for (const [name, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(trimmed) && trimmed.length < 60) {
        current = name;
        sections[current] = sections[current] || [];
        matched = true;
        break;
      }
    }
    if (!matched) {
      sections[current] = sections[current] || [];
      sections[current].push(trimmed);
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Inline URL extraction — builds a per-line URL map so each entry only gets
// URLs that appear on its own line or within 2 lines immediately below it.
// ---------------------------------------------------------------------------

const URL_RE = /https?:\/\/[^\s,)>\]'"]+/gi;

interface LineUrl {
  lineIndex: number;
  url: string;
  isGithub: boolean;
}

function extractAllLineUrls(lines: string[]): LineUrl[] {
  const result: LineUrl[] = [];
  lines.forEach((line, idx) => {
    const matches = line.match(URL_RE) || [];
    for (const url of matches) {
      result.push({
        lineIndex: idx,
        url,
        isGithub: /github\.com/i.test(url),
      });
    }
  });
  return result;
}

/**
 * Given a known entry name, find its line in the source, then collect any
 * URLs on that line or within the next `windowLines` lines.
 * Returns { githubUrl, liveUrl } — only populated from that specific context.
 */
function findEntryUrls(
  entryName: string,
  allLines: string[],
  lineUrls: LineUrl[],
  windowLines = 3
): { githubUrl: string; liveUrl: string } {
  const nameLower = entryName.toLowerCase();
  let anchorLine = -1;

  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].toLowerCase().includes(nameLower)) {
      anchorLine = i;
      break;
    }
  }

  if (anchorLine === -1) return { githubUrl: '', liveUrl: '' };

  const nearby = lineUrls.filter(
    (lu) => lu.lineIndex >= anchorLine && lu.lineIndex <= anchorLine + windowLines
  );

  let githubUrl = '';
  let liveUrl = '';

  for (const lu of nearby) {
    if (lu.isGithub && !githubUrl) {
      githubUrl = lu.url;
    } else if (!lu.isGithub && !liveUrl) {
      liveUrl = lu.url;
    }
  }

  return { githubUrl, liveUrl };
}

/**
 * Same logic for certifications — looks for a URL near the cert name line.
 */
function findCertUrl(
  certName: string,
  allLines: string[],
  lineUrls: LineUrl[],
  windowLines = 3
): string {
  const nameLower = certName.toLowerCase();
  let anchorLine = -1;

  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].toLowerCase().includes(nameLower)) {
      anchorLine = i;
      break;
    }
  }

  if (anchorLine === -1) return '';

  const nearby = lineUrls.filter(
    (lu) => lu.lineIndex >= anchorLine && lu.lineIndex <= anchorLine + windowLines
  );

  return nearby[0]?.url || '';
}

// ---------------------------------------------------------------------------
// Deterministic entry-count estimator — used for completeness warnings
// ---------------------------------------------------------------------------

export interface EntryCounts {
  experience: number;
  projects: number;
  education: number;
  certifications: number;
}

/**
 * Estimates how many entries each section likely contains by examining
 * structural signals in the raw text (date ranges, bullet clusters, etc.).
 * This is intentionally conservative — it under-counts rather than over-counts.
 */
export function estimateEntryCounts(cleanText: string): EntryCounts {
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = splitIntoSections(lines);

  // Experience: count lines that contain a date range pattern (2020–2023, Jan 2021 - Present, etc.)
  const dateRangeRe = /(\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+)?\d{4}\s*[-–—]\s*(\d{4}|present|current|now)/i;
  const expLines = (sections.experience || []).filter((l) => dateRangeRe.test(l));
  const experience = Math.max(expLines.length, 0);

  // Projects: count short non-bullet title-like lines in the projects section
  const projTitleRe = /^[A-Z][^a-z]{0,3}[A-Za-z].{3,60}$/;
  const projLines = (sections.projects || []).filter(
    (l) => projTitleRe.test(l) && !l.startsWith('-') && !l.startsWith('•') && !l.startsWith('*')
  );
  const projects = Math.max(projLines.length, 0);

  // Education: count lines with degree keywords
  const degreeRe = /b\.?tech|b\.?e\b|b\.?s\.?\b|m\.?tech|m\.?s\.?\b|bachelor|master|ph\.?d|mba|diploma/i;
  const eduLines = (sections.education || []).filter((l) => degreeRe.test(l));
  const education = Math.max(eduLines.length, 1); // at least 1 if section exists

  // Certifications: count non-empty lines in the certifications section
  const certifications = Math.max((sections.certifications || []).filter((l) => l.length > 5).length, 0);

  return { experience, projects, education, certifications };
}

// ---------------------------------------------------------------------------
// NORMALIZER — used when LLM succeeded. Enforces schema, fills only what
// is genuinely missing via regex. Never invents content.
// ---------------------------------------------------------------------------

export function normalizeExtracted(raw: any, cleanText: string): CanonicalProfile {
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);
  const allLineUrls = extractAllLineUrls(lines);

  // --- Personal ---
  const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = cleanText.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  // Profile-level GitHub/LinkedIn: search across full cleanText (including extracted PDF link annotations)
  const githubProfileMatch = cleanText.match(/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?(?!\S)/i);
  const linkedinMatch = cleanText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_%-]+/i);
  const websiteMatch = cleanText.match(/https?:\/\/(?!github\.com)(?!linkedin\.com)[a-zA-Z0-9_-]+\.[a-zA-Z]{2,}[^\s]*/i);

  // Collect all embedded project demo URLs (excluding linkedin and profile github)
  const allEmbeddedUrls = (cleanText.match(/https?:\/\/[^\s\)\>\<\,\]\"'\\]+/gi) || []).map(u => u.trim());
  const projectDemoUrls = allEmbeddedUrls.filter(u => 
    !u.includes('linkedin.com') && 
    !u.includes('mailto:') && 
    u !== (githubProfileMatch ? githubProfileMatch[0] : '') &&
    !u.endsWith('/Portfolio/')
  );

  let name = typeof raw?.personal?.name === 'string' && raw.personal.name.trim().length > 1
    ? raw.personal.name.trim()
    : '';
  if (!name) {
    // First short non-contact line near the top
    for (const line of lines.slice(0, 6)) {
      if (!line.includes('@') && !line.includes('http') && line.length > 1 && line.length < 50
          && /[A-Za-z]/.test(line)) {
        name = line.replace(/[^a-zA-Z\s.'"-]/g, '').trim();
        if (name.length > 1) break;
      }
    }
  }

  const headline = typeof raw?.personal?.headline === 'string' && raw.personal.headline.trim().length > 3
    ? raw.personal.headline.trim()
    : '';

  const bio = typeof raw?.personal?.bio === 'string' && raw.personal.bio.trim().length > 10
    ? raw.personal.bio.trim()
    : headline; // Use headline as minimal fallback; never fabricate a bio sentence

  const personal = {
    name: name || 'Unknown',
    headline: headline || '',
    bio: bio || '',
    email:    raw?.personal?.email    || (emailMatch    ? emailMatch[0]    : ''),
    phone:    raw?.personal?.phone    || (phoneMatch    ? phoneMatch[0]    : ''),
    location: raw?.personal?.location || '',
    avatarUrl: raw?.personal?.avatarUrl || '',
    socialLinks: {
      github:   raw?.personal?.socialLinks?.github   || (githubProfileMatch ? githubProfileMatch[0] : ''),
      linkedin: raw?.personal?.socialLinks?.linkedin || (linkedinMatch      ? linkedinMatch[0]      : ''),
      website:  raw?.personal?.socialLinks?.website  || (websiteMatch       ? websiteMatch[0]       : ''),
    },
  };

  // --- Experience ---
  const experience = Array.isArray(raw?.experience)
    ? raw.experience
        .filter((e: any) => e && typeof e === 'object')
        .map((exp: any, idx: number) => ({
          id:        exp.id || `exp_${idx + 1}_${uuidv4().substring(0, 6)}`,
          company:   typeof exp.company === 'string' && exp.company.trim() ? exp.company.trim() : '',
          role:      typeof exp.role    === 'string' && exp.role.trim()    ? exp.role.trim()    : '',
          location:  exp.location  || '',
          startDate: exp.startDate || '',
          endDate:   exp.endDate   || '',
          isCurrent: Boolean(exp.isCurrent || (typeof exp.endDate === 'string' && /present|current|now/i.test(exp.endDate))),
          highlights: Array.isArray(exp.highlights)
            ? exp.highlights.filter((h: any) => typeof h === 'string' && h.trim().length > 0).map((h: string) => h.trim())
            : [],
          technologies: Array.isArray(exp.technologies)
            ? exp.technologies.filter((t: any) => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim())
            : [],
        }))
        .filter((e: any) => e.company || e.role) // drop completely empty entries
    : [];

  // --- Projects ---
  const projects = Array.isArray(raw?.projects)
    ? raw.projects
        .filter((p: any) => p && typeof p === 'object')
        .map((p: any, idx: number) => {
          // Deterministically resolve URLs from the source text for this project entry.
          // The LLM's extracted URL is kept if present; we only fill gaps.
          const inlineUrls = findEntryUrls(
            typeof p.name === 'string' ? p.name : '',
            lines,
            allLineUrls
          );
          let liveUrl = (typeof p.liveUrl === 'string' && p.liveUrl.trim()) ? p.liveUrl.trim() : inlineUrls.liveUrl;
          // Fall back to matched embedded project demo URL if available
          if (!liveUrl && projectDemoUrls[idx]) {
            liveUrl = projectDemoUrls[idx];
          }

          return {
            id:          p.id || `proj_${idx + 1}_${uuidv4().substring(0, 6)}`,
            name:        typeof p.name        === 'string' && p.name.trim()        ? p.name.trim()        : `Project ${idx + 1}`,
            tagline:     typeof p.tagline     === 'string'                         ? p.tagline.trim()     : '',
            description: typeof p.description === 'string' && p.description.trim() ? p.description.trim() : '',
            highlights: Array.isArray(p.highlights)
              ? p.highlights.filter((h: any) => typeof h === 'string' && h.trim().length > 0).map((h: string) => h.trim())
              : [],
            technologies: Array.isArray(p.technologies)
              ? p.technologies.filter((t: any) => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim())
              : [],
            // LLM-extracted URL wins; fall back to deterministic inline detection only
            githubUrl: (typeof p.githubUrl === 'string' && p.githubUrl.trim()) ? p.githubUrl.trim() : inlineUrls.githubUrl,
            liveUrl:   liveUrl,
          };
        })
        .filter((p: any) => p.name !== `Project ${0 + 1}` || p.description) // drop nameless + empty
    : [];

  // --- Skills ---
  const skills = Array.isArray(raw?.skills)
    ? raw.skills
        .filter((cat: any) => cat && typeof cat === 'object' && Array.isArray(cat.skills) && cat.skills.length > 0)
        .map((cat: any) => ({
          category: typeof cat.category === 'string' && cat.category.trim() ? cat.category.trim() : 'Technical Skills',
          skills:   cat.skills.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim()),
        }))
    : [];

  // --- Education ---
  const education = Array.isArray(raw?.education)
    ? raw.education
        .filter((e: any) => e && typeof e === 'object')
        .map((edu: any, idx: number) => {
          // Expand common abbreviations so the UI displays a full degree name
          let degree = typeof edu.degree === 'string' && edu.degree.trim() ? edu.degree.trim() : '';
          if (/^b\.?tech$/i.test(degree)) degree = 'Bachelor of Technology (B.Tech)';
          else if (/^b\.?e\.?$/i.test(degree)) degree = 'Bachelor of Engineering (B.E.)';
          else if (/^m\.?tech$/i.test(degree)) degree = 'Master of Technology (M.Tech)';
          else if (/^m\.?s\.?$/i.test(degree)) degree = 'Master of Science (M.S.)';
          else if (/^b\.?s\.?$/i.test(degree)) degree = 'Bachelor of Science (B.S.)';
          else if (/^mba$/i.test(degree))      degree = 'Master of Business Administration (MBA)';
          else if (/^ph\.?d\.?$/i.test(degree)) degree = 'Doctor of Philosophy (Ph.D.)';

          return {
            id:           edu.id || `edu_${idx + 1}_${uuidv4().substring(0, 6)}`,
            institution:  typeof edu.institution  === 'string' && edu.institution.trim()  ? edu.institution.trim()  : '',
            degree:       degree || '',
            fieldOfStudy: typeof edu.fieldOfStudy === 'string' && edu.fieldOfStudy.trim() ? edu.fieldOfStudy.trim() : '',
            startDate:    edu.startDate || '',
            endDate:      edu.endDate   || '',
            gpaOrGrade:   edu.gpaOrGrade || '',
            honors:       Array.isArray(edu.honors) ? edu.honors.filter((h: any) => typeof h === 'string' && h.trim()) : [],
          };
        })
        .filter((e: any) => e.institution || e.degree)
    : [];

  // --- Certifications ---
  const certifications = Array.isArray(raw?.certifications)
    ? raw.certifications
        .filter((c: any) => c && typeof c === 'object' && typeof c.name === 'string' && c.name.trim())
        .map((c: any) => {
          const certName = c.name.trim();
          // LLM's URL wins; fill gaps from inline URL detection
          const inlineUrl = (typeof c.url === 'string' && c.url.trim())
            ? c.url.trim()
            : findCertUrl(certName, lines, allLineUrls);
          return {
            name:   certName,
            issuer: typeof c.issuer === 'string' ? c.issuer.trim() : '',
            date:   typeof c.date   === 'string' ? c.date.trim()   : '',
            url:    inlineUrl,
          };
        })
    : [];

  const publications = Array.isArray(raw?.publications) ? raw.publications : [];
  const achievements = Array.isArray(raw?.achievements)
    ? raw.achievements.filter((a: any) => typeof a === 'string' && a.trim()).map((a: string) => a.trim())
    : [];

  // Fallback to deterministic parser for any section that the LLM left empty but exists in source text
  const fallback = deterministicParse(cleanText);
  if (experience.length === 0 && fallback.experience.length > 0) {
    experience.push(...fallback.experience);
  }
  if (projects.length === 0 && fallback.projects.length > 0) {
    projects.push(...fallback.projects);
  }
  if (skills.length === 0 && fallback.skills.length > 0) {
    skills.push(...fallback.skills);
  }
  if (education.length === 0 && fallback.education.length > 0) {
    education.push(...fallback.education);
  }
  if (certifications.length === 0 && fallback.certifications.length > 0) {
    certifications.push(...fallback.certifications);
  }

  return CanonicalProfileSchema.parse({
    personal,
    experience,
    education,
    projects,
    skills,
    certifications,
    publications,
    achievements,
    provenance: [],
  });
}

// ---------------------------------------------------------------------------
// DETERMINISTIC PARSER — used only when the LLM is unavailable entirely.
// Extracts real data from the resume text using structural heuristics.
// Empty sections stay empty — no hardcoded content is ever injected.
// ---------------------------------------------------------------------------

export function deterministicParse(cleanText: string): CanonicalProfile {
  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);
  const sections = splitIntoSections(lines);
  const allLineUrls = extractAllLineUrls(lines);

  // --- Personal ---
  const emailMatch    = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch    = cleanText.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  const headerText    = lines.slice(0, 20).join('\n');
  const githubMatch   = headerText.match(/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+(?:\/)?(?!\S)/i);
  const linkedinMatch = headerText.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_%-]+/i);
  const websiteMatch  = headerText.match(/https?:\/\/(?!github\.com)(?!linkedin\.com)[a-zA-Z0-9_-]+\.[a-zA-Z]{2,}[^\s]*/i);

  // Name: first short alphabetic line in the header block
  let name = '';
  for (const line of (sections.header || []).slice(0, 6)) {
    if (!line.includes('@') && !line.includes('http') && line.length > 1 && line.length < 50
        && /[A-Za-z]/.test(line) && !/^\+?\d/.test(line)) {
      const candidate = line.replace(/[^a-zA-Z\s.'"-]/g, '').trim();
      if (candidate.length > 1) { name = candidate; break; }
    }
  }

  // Headline: second distinct short line after name, or a line with common role keywords
  let headline = '';
  const roleRe = /engineer|developer|designer|analyst|scientist|manager|architect|consultant|intern|fresher/i;
  for (const line of (sections.header || []).slice(0, 10)) {
    if (line !== name && roleRe.test(line) && line.length < 100) {
      headline = line.replace(/[|•·]/g, ' ').trim();
      break;
    }
  }

  // Location: line that looks like "City, State" or "City, Country"
  let location = '';
  const locationRe = /^[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+$/;
  for (const line of (sections.header || [])) {
    if (locationRe.test(line) && line.length < 50) { location = line; break; }
  }

  const personal = {
    name:     name || 'Unknown',
    headline: headline || '',
    bio:      headline || '',  // headline as minimal bio; never fabricate
    email:    emailMatch    ? emailMatch[0]    : '',
    phone:    phoneMatch    ? phoneMatch[0]    : '',
    location: location,
    avatarUrl: '',
    socialLinks: {
      github:   githubMatch   ? githubMatch[0]   : '',
      linkedin: linkedinMatch ? linkedinMatch[0] : '',
      website:  websiteMatch  ? websiteMatch[0]  : '',
    },
  };

  // --- Experience ---
  // Strategy: each entry starts at a line that contains a date range.
  // The line itself (or the line before it) is the company/role line.
  const expSectionLines = sections.experience || [];
  const dateRangeRe = /(\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+)?\d{4}\s*[-–—]\s*(\d{4}|present|current|now)/i;
  const bulletRe    = /^[-•*►▸]\s*/;

  const experience: any[] = [];
  let i = 0;
  while (i < expSectionLines.length) {
    const line = expSectionLines[i];
    if (dateRangeRe.test(line)) {
      // The company/role info is on this line or the preceding line
      const contextLine = i > 0 ? expSectionLines[i - 1] : line;
      const parts = contextLine.split(/[|–—·•]+/).map((p) => p.trim()).filter(Boolean);
      const company = parts[0] || '';
      const role    = parts[1] || parts[0] || '';

      // Collect date range from the current line
      const dateMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|current|now)/i);
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDateRaw = dateMatch ? dateMatch[2] : '';
      const isCurrent = /present|current|now/i.test(endDateRaw);
      const endDate   = isCurrent ? 'Present' : endDateRaw;

      // Collect bullet highlights that follow
      const highlights: string[] = [];
      let j = i + 1;
      while (j < expSectionLines.length && !dateRangeRe.test(expSectionLines[j])) {
        if (bulletRe.test(expSectionLines[j])) {
          highlights.push(expSectionLines[j].replace(bulletRe, '').trim());
        }
        j++;
      }

      // Extract technologies from the highlights text
      const techRe = /\b(java|python|typescript|javascript|react|angular|vue|node|spring|django|flask|kubernetes|docker|aws|azure|gcp|sql|nosql|redis|kafka|terraform|git|ci\/cd|jenkins|graphql|rest|grpc)\b/gi;
      const techSet = new Set<string>();
      for (const h of highlights) {
        const found = h.match(techRe) || [];
        found.forEach((t) => techSet.add(t));
      }

      if (company || role) {
        experience.push({
          id:           `exp_${experience.length + 1}_${uuidv4().substring(0, 6)}`,
          company,
          role,
          location:     '',
          startDate,
          endDate,
          isCurrent,
          highlights,
          technologies: Array.from(techSet),
        });
      }
      i = j;
    } else {
      i++;
    }
  }

  // --- Projects ---
  // Strategy: short non-bullet title-cased lines are project names;
  // bullets below them are highlights.
  const projSectionLines = sections.projects || [];
  const projTitleRe      = /^[A-Z][A-Za-z0-9\s\-–—:,./()+#&]+$/;
  const projects: any[]  = [];
  let pi = 0;

  while (pi < projSectionLines.length) {
    const line = projSectionLines[pi];
    // A project title: short, starts uppercase, not a bullet
    if (projTitleRe.test(line) && !bulletRe.test(line) && line.length < 150) {
      let rawTitle = line.trim();
      let projName = rawTitle;
      let tagline = '';

      // If project line contains em-dash / en-dash / pipe split into name + tagline
      const dashParts = rawTitle.split(/\s*[-–—|]\s*/);
      if (dashParts.length >= 2) {
        projName = dashParts[0].trim();
        tagline = dashParts.slice(1).join(' - ').trim();
      }

      const highlights: string[] = [];
      let techSet    = new Set<string>();
      let description = '';
      let pj = pi + 1;

      while (pj < projSectionLines.length && !projTitleRe.test(projSectionLines[pj])) {
        const pline = projSectionLines[pj];
        if (bulletRe.test(pline)) {
          const bullet = pline.replace(bulletRe, '').trim();
          highlights.push(bullet);
          const techRe = /\b(java|python|typescript|javascript|react|angular|vue|node|spring|django|flask|kubernetes|docker|aws|azure|gcp|sql|nosql|redis|kafka|terraform|git|graphql|rest|grpc|langchain|langraph|openai|llm|rag)\b/gi;
          const found  = bullet.match(techRe) || [];
          found.forEach((t) => techSet.add(t));
        } else if (!URL_RE.test(pline) && pline.length > 20 && !description) {
          description = pline; // first non-bullet, non-URL prose line is the description
        }
        pj++;
      }

      const inlineUrls = findEntryUrls(projName, lines, allLineUrls);

      projects.push({
        id:           `proj_${projects.length + 1}_${uuidv4().substring(0, 6)}`,
        name:         projName,
        tagline:      tagline,
        description:  description || highlights[0] || tagline || '',
        highlights,
        technologies: Array.from(techSet),
        githubUrl:    inlineUrls.githubUrl,
        liveUrl:      inlineUrls.liveUrl,
      });

      pi = pj;
    } else {
      pi++;
    }
  }

  // --- Skills ---
  // Strategy: detect "Category: skill1, skill2, skill3" lines or flat comma-separated lines.
  const skillSectionLines = sections.skills || [];
  const skills: any[]     = [];
  const categoryLineRe    = /^([A-Za-z\s&/]+):\s*(.+)$/;

  for (const line of skillSectionLines) {
    const match = line.match(categoryLineRe);
    if (match) {
      const category    = match[1].trim();
      const skillTokens = match[2].split(/[,|•·]+/).map((s) => s.trim()).filter((s) => s.length > 0);
      if (skillTokens.length > 0) {
        skills.push({ category, skills: skillTokens });
      }
    } else if (line.includes(',')) {
      // Flat comma list — put under a generic category
      const skillTokens = line.split(',').map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40);
      if (skillTokens.length >= 2) {
        // Merge into last category or create a new one
        if (skills.length > 0) {
          skills[skills.length - 1].skills.push(...skillTokens);
        } else {
          skills.push({ category: 'Technical Skills', skills: skillTokens });
        }
      }
    }
  }

  // --- Education ---
  const eduSectionLines = sections.education || [];
  const education: any[] = [];
  const degreeRe         = /b\.?tech|b\.?e\b|b\.?s\.?\b|m\.?tech|m\.?s\.?\b|bachelor|master|ph\.?d|mba|diploma/i;
  let ei = 0;

  while (ei < eduSectionLines.length) {
    const line = eduSectionLines[ei];
    if (degreeRe.test(line)) {
      // Degree line
      let degree = line;
      if (/^b\.?tech$/i.test(degree)) degree = 'Bachelor of Technology (B.Tech)';
      else if (/^b\.?e\.?$/i.test(degree)) degree = 'Bachelor of Engineering (B.E.)';
      else if (/^m\.?tech$/i.test(degree)) degree = 'Master of Technology (M.Tech)';

      // Institution: look on the same line (split by comma/pipe) or the adjacent line
      const parts = line.split(/[,|–—]+/).map((p) => p.trim());
      let institution  = parts.length > 1 ? parts[1] : '';
      let fieldOfStudy = '';
      let startDate    = '';
      let endDate      = '';
      let gpaOrGrade   = '';

      // Scan next few lines for institution, dates, GPA
      let ej = ei + 1;
      while (ej < eduSectionLines.length && ej < ei + 5) {
        const el = eduSectionLines[ej];
        if (!institution && el.length > 5 && el.length < 100 && /university|college|institute|school/i.test(el)) {
          institution = el;
        }
        const dateM = el.match(/(\d{4})\s*[-–—]\s*(\d{4}|present)/i);
        if (dateM) { startDate = dateM[1]; endDate = /present/i.test(dateM[2]) ? 'Present' : dateM[2]; }
        const gpaM = el.match(/(\d+\.\d+)\s*\/\s*(\d+\.\d+|\d+)|(\d+\.\d+)\s*(cgpa|gpa|score)/i);
        if (gpaM) gpaOrGrade = gpaM[0];
        const fieldM = el.match(/computer\s*science|information\s*technology|electronics|electrical|mechanical|civil|chemical|mathematics|physics/i);
        if (fieldM) fieldOfStudy = fieldM[0];
        ej++;
      }

      if (degree || institution) {
        education.push({
          id:           `edu_${education.length + 1}_${uuidv4().substring(0, 6)}`,
          institution:  institution || '',
          degree:       degree || '',
          fieldOfStudy: fieldOfStudy || '',
          startDate,
          endDate,
          gpaOrGrade,
          honors:       [],
        });
      }
      ei = ej;
    } else {
      ei++;
    }
  }

  // --- Certifications ---
  const certSectionLines  = sections.certifications || [];
  const certifications: any[] = [];

  for (const line of certSectionLines) {
    if (line.length < 3) continue;
    if (/^https?:\/\//.test(line)) continue;

    const isBulletLine = bulletRe.test(line);
    const cleanedLine = line.replace(bulletRe, '').trim();
    if (!cleanedLine) continue;

    // Check if line is continuation fragment (e.g. "networking." or "Jan 2026.")
    const isFragment = !isBulletLine && certifications.length > 0 &&
      (cleanedLine.length < 20 || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|completed|in progress)/i.test(cleanedLine));

    if (isFragment) {
      // Append fragment to previous certification entry instead of creating new card
      const prev = certifications[certifications.length - 1];
      if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i.test(cleanedLine) && !prev.date) {
        prev.date = cleanedLine;
      } else {
        prev.name = `${prev.name} ${cleanedLine}`.trim();
      }
      continue;
    }

    const inlineUrl = findCertUrl(cleanedLine, lines, allLineUrls);

    // Infer issuer
    let issuer = '';
    if (/microsoft|azure|az-/i.test(cleanedLine))   issuer = 'Microsoft';
    else if (/aws|amazon/i.test(cleanedLine))        issuer = 'Amazon Web Services';
    else if (/google|gcp/i.test(cleanedLine))        issuer = 'Google';
    else if (/oracle/i.test(cleanedLine))            issuer = 'Oracle';
    else if (/cisco/i.test(cleanedLine))             issuer = 'Cisco';
    else if (/comptia/i.test(cleanedLine))           issuer = 'CompTIA';
    else if (/coursera/i.test(cleanedLine))          issuer = 'Coursera';
    else if (/udemy/i.test(cleanedLine))             issuer = 'Udemy';
    else if (/accenture|stanford/i.test(cleanedLine)) issuer = 'Accenture';

    certifications.push({
      name:   cleanedLine,
      issuer: issuer,
      date:   '',
      url:    inlineUrl,
    });
  }

  // --- Achievements ---
  const achievements = (sections.achievements || [])
    .filter((l) => l.length > 5)
    .map((l) => l.replace(bulletRe, '').trim());

  return CanonicalProfileSchema.parse({
    personal,
    experience,
    education,
    projects,
    skills,
    certifications,
    publications: [],
    achievements,
    provenance: [],
  });
}

// ---------------------------------------------------------------------------
// ProfileExtractor — public API
// ---------------------------------------------------------------------------

export class ProfileExtractor {
  private llm: ILlmProvider;

  constructor(llm?: ILlmProvider) {
    this.llm = llm || LlmFactory.getProvider();
  }

  public async extractProfile(rawResumeText: string): Promise<ProfileExtractionResult> {
    const sanitization = TextSanitizer.sanitize(rawResumeText);
    const cleanText    = sanitization.cleanText;
    const warnings     = [...sanitization.warnings];
    let engineUsed: 'groq_ai' | 'deterministic_fallback' = 'groq_ai';
    let profile: CanonicalProfile;

    // ------------------------------------------------------------------
    // LLM extraction — primary path
    // ------------------------------------------------------------------
    const systemPrompt = `You are a precision resume parser. Your only job is to convert the resume text below into a single valid JSON object.

The resume text has been pre-structured using markdown-like markers:
  ## SECTION NAME    → marks the start of a new section
  ### Sub-header     → marks a role title, company name, or project name
  - bullet point     → a highlight or achievement within an entry

Use these structural markers to correctly identify section boundaries and individual entries.

CRITICAL RULES — follow every one without exception:
1. Count the exact number of entries in each section BEFORE writing JSON. Output exactly that many — no more, no fewer.
2. Do NOT merge distinct entries into one. Each job, project, education record, and certification is a separate object.
3. Do NOT omit any entry. If the resume lists 4 projects, the JSON must contain 4 project objects.
4. Do NOT duplicate entries. Each entry must appear exactly once.
5. Do NOT invent or hallucinate any data. Every field must come directly from the resume text. If a value is not present, use "" or [].
6. For "githubUrl" and "liveUrl" on projects: only populate these if a URL appears directly next to or beneath that specific project in the resume. Do NOT copy the candidate's profile GitHub URL to project entries.
7. For certification "url": only populate if a URL appears directly next to that certification name in the resume.
8. The "bio" field must be taken verbatim or lightly paraphrased from the resume summary/objective section. Do not fabricate a bio.

Output format — pure JSON, no markdown, no code fences:
{
  "personal": {
    "name": "Full Name from resume",
    "headline": "Professional title or role from resume",
    "bio": "Summary/objective paragraph from resume, or empty string if none",
    "email": "",
    "phone": "",
    "location": "",
    "avatarUrl": "",
    "socialLinks": { "github": "", "linkedin": "", "website": "" }
  },
  "experience": [
    {
      "company": "Exact company name",
      "role": "Exact job title",
      "location": "",
      "startDate": "YYYY or Mon YYYY",
      "endDate": "YYYY or Present",
      "isCurrent": false,
      "highlights": ["bullet point verbatim from resume"],
      "technologies": ["tech mentioned in this role"]
    }
  ],
  "projects": [
    {
      "name": "Exact project name",
      "tagline": "Short description if present, else empty string",
      "description": "Project description from resume",
      "highlights": ["bullet point verbatim"],
      "technologies": ["tech used in this project"],
      "liveUrl": "only if URL for this project is in resume, else empty string",
      "githubUrl": "only if GitHub URL for this project is in resume, else empty string"
    }
  ],
  "skills": [
    { "category": "Category name from resume", "skills": ["skill1", "skill2"] }
  ],
  "education": [
    {
      "institution": "Full institution name",
      "degree": "Full degree name (expand abbreviations: B.Tech → Bachelor of Technology (B.Tech))",
      "fieldOfStudy": "Field or branch",
      "startDate": "",
      "endDate": "",
      "gpaOrGrade": ""
    }
  ],
  "certifications": [
    {
      "name": "Exact certification name",
      "issuer": "Issuing organization",
      "date": "Year or date if present",
      "url": "Certification URL if present directly next to this entry, else empty string"
    }
  ],
  "publications": [],
  "achievements": []
}`;

    const userPrompt = `Parse this resume into JSON:\n\n${TextSanitizer.wrapInUntrustedBoundary(cleanText)}`;

    try {
      const rawJson = await this.llm.generateStructuredJson<any>([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      profile    = normalizeExtracted(rawJson, cleanText);
      engineUsed = 'groq_ai';
    } catch (llmError: any) {
      console.warn('[ProfileExtractor] LLM extraction failed, running deterministic parser:', llmError.message);
      warnings.push(`LLM extraction unavailable (${llmError.message}). Used deterministic parser — verify output carefully.`);
      profile    = deterministicParse(cleanText);
      engineUsed = 'deterministic_fallback';
    }

    // ------------------------------------------------------------------
    // Completeness check — compare extracted counts to text-signal estimates
    // ------------------------------------------------------------------
    const estimates = estimateEntryCounts(cleanText);

    if (estimates.experience > 0 && profile.experience.length < estimates.experience) {
      warnings.push(
        `COMPLETENESS WARNING: Resume text signals ~${estimates.experience} experience ` +
        `entries but only ${profile.experience.length} were extracted. ` +
        `Please verify the portfolio is complete.`
      );
    }
    if (estimates.projects > 0 && profile.projects.length < estimates.projects) {
      warnings.push(
        `COMPLETENESS WARNING: Resume text signals ~${estimates.projects} project ` +
        `entries but only ${profile.projects.length} were extracted. ` +
        `Please verify the portfolio is complete.`
      );
    }
    if (estimates.education > 0 && profile.education.length === 0) {
      warnings.push(
        `COMPLETENESS WARNING: Resume text signals education entries but none were extracted.`
      );
    }
    if (estimates.certifications > 0 && profile.certifications.length < estimates.certifications) {
      warnings.push(
        `COMPLETENESS WARNING: Resume text signals ~${estimates.certifications} certification ` +
        `entries but only ${profile.certifications.length} were extracted.`
      );
    }

    // ------------------------------------------------------------------
    // Provenance attachment
    // ------------------------------------------------------------------
    const provenanceClaims: any[] = [];

    if (profile.personal.name) {
      const m = ProvenanceEngine.findSourceSnippet(profile.personal.name, cleanText);
      provenanceClaims.push({ id: 'prov_name', claimText: profile.personal.name, sourceSnippet: m.snippet, confidence: m.confidence, section: 'Personal' });
    }
    for (const exp of profile.experience) {
      const m = ProvenanceEngine.findSourceSnippet(exp.company, cleanText);
      provenanceClaims.push({ id: `prov_exp_${exp.id}`, claimText: `${exp.role} at ${exp.company}`, sourceSnippet: m.snippet, confidence: m.confidence, section: 'Experience' });
    }
    for (const proj of profile.projects) {
      const m = ProvenanceEngine.findSourceSnippet(proj.name, cleanText);
      provenanceClaims.push({ id: `prov_proj_${proj.id}`, claimText: `Project ${proj.name}`, sourceSnippet: m.snippet, confidence: m.confidence, section: 'Projects' });
    }
    for (const cert of profile.certifications) {
      const m = ProvenanceEngine.findSourceSnippet(cert.name, cleanText);
      provenanceClaims.push({ id: `prov_cert_${cert.name.substring(0, 20).replace(/\s/g, '_')}`, claimText: cert.name, sourceSnippet: m.snippet, confidence: m.confidence, section: 'Certifications' });
    }

    profile.provenance = provenanceClaims;

    return { profile, warnings, engineUsed };
  }
}
