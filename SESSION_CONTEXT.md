# 🧠 Session Context & Handover Memory (`SESSION_CONTEXT.md`)

> **Note for Future AI Agents / Chat Sessions:** Read this file first to understand the architecture, completed fixes, project structure, active Git branches, and runtime environment.

---

## 📌 Project Overview & Repository Specs

- **Project Name:** AI Portfolio Generator Agent (`PortfolioForge`)
- **Author & Maintainer:** [Najeeba Nasir](https://github.com/NajeebaNasir)
- **GitHub Repository:** [https://github.com/NajeebaNasir/AI-Portfolio-Generator](https://github.com/NajeebaNasir/AI-Portfolio-Generator)
- **Current Active Git Branch:** `dev` (Production release branch: `main`)
- **Monorepo Architecture:**
  - `apps/web`: React 18 + Vite Live Studio UI & Canvas rendering engine (Port `5173`)
  - `apps/server`: Express Node API Server for parsing, LLM orchestration, and zip packaging (Port `3001`)
  - `packages/shared`: Shared Zod Schemas (`CanonicalProfile`, `DesignSpec`, `PortfolioStrategy`)

---

## 🏗️ Core Architecture (The Two-Artifact Contract)

Everything in this project follows a strict **Two-Artifact Contract** separating data from design:

1. **Artifact 1 (`resume.json` / `CanonicalProfile`):**
   - Canonical candidate data extracted strictly from PDF/DOCX resumes.
   - Zero-hallucination policy (facts must be strictly derived from candidate input).
2. **Artifact 2 (`portfolio.config.json` / `PortfolioStrategy` & `DesignSpec`):**
   - Design decisions chosen by LLM: archetype (`sidebar`, `hero-centered`, `timeline`, `minimal-editorial`), color palette tokens, typography pairing, density, section selection, copy tone, and design rationale ("Why this design").
3. **100% Deterministic Renderer:**
   - The renderer maps tokens directly into typed React components. The LLM **never** writes raw HTML/CSS strings, guaranteeing layout stability and zero build breakage.

---

## 🛠️ Key Work Accomplished & Fixes Applied

### 1. Groq LLM Ingestion & 413 Rate Limit Solution
- Updated `GroqProvider.ts` with model auto-discovery (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `groq/compound-mini`).
- Configured token reserves to `2800` max tokens to fit strictly inside Groq Free Tier TPM limits (< 8,000 TPM) without truncating multi-section resume JSON output.
- Added dynamic key initialization (`ensureClientInitialized`) in `GroqProvider` so `GROQ_API_KEY` is re-evaluated dynamically even if `LlmFactory` is called before environment setup.

### 2. PDF Embedded Link Annotation Parser (PDFJS Integration)
- Extended `pdfParser.ts` to parse underlying PDF Link Annotation objects (`pageData.getAnnotations()`) containing embedded URLs (`/URI`).
- Automatically extracts candidate profile links (LinkedIn, GitHub, Portfolio) and project demo URLs (`https://codebloodeddeveloper.github.io/RAG_IMPROVISED/`, `https://vibe9452.pythonanywhere.com/`) that are hidden behind text buttons like "Project Link".
- `profileExtractor.ts` maps extracted URLs directly to `socialLinks` and `projects[i].liveUrl` / `projects[i].githubUrl`.

### 2. Full Project Extraction Fix (All 3 Projects)
- Updated project title regex in `profileExtractor.ts` to allow dashes, commas, slashes, pluses, hashes, and ampersands.
- Verified extraction and rendering of all **3 candidate projects**:
  1. **`PE-RCA Agent`** (Automated Incident Root-Cause Analysis)
  2. **`Multi-Agent AI C-Suite Advisor`**
  3. **`Seam Chat`** (Collaboration Platform)

### 3. Certification Fragment Merging
- Implemented fragment continuation merging in `deterministicParse()` inside `profileExtractor.ts`.
- Wrapped PDF lines (e.g. `networking.` and `Jan 2026.`) are merged into parent certification entries, generating **4 clean certification cards**.

### 4. Interactive Live Studio Enhancements
- **1-Click Copy Contact Hub:** Contact section displays Email (`harshilawasthijobs@gmail.com`), Phone (`+91 8707874348`), Location (`Gurugram, India`), LinkedIn, and GitHub with one-click copy-to-clipboard functionality and `[Copied!]` feedback toasts.
- **Floating Sticky Header Navigation:** Added sticky header (`sticky top-0 z-30 shadow-md backdrop-blur-md`) and removed parent overflow trapping in `App.tsx` and `LiveCanvas.tsx` for smooth scrolling navigation.
- **Stacked Full-Width Sections:** Restructured Education and Certifications from 2-column grids into clean full-width stacked section blocks.

### 5. Git Version Control Setup
- Created root `.gitignore` protecting secrets (`.env`) and ignoring `node_modules` and build artifacts (`dist/`).
- Created `main` (production stable) and `dev` (active feature development) branches on GitHub (`https://github.com/NajeebaNasir/AI-Portfolio-Generator.git`).

---

## 🚀 How to Run locally

### 1. Automated Launcher (Recommended)
In PowerShell inside the workspace root:
```powershell
.\start.ps1
```
*(Frees ports `3001` & `5173`, compiles TypeScript sources, and starts both backend and frontend servers).*

### 2. Manual Commands
```powershell
# Compile backend TypeScript
node node_modules/typescript/bin/tsc --project apps/server/tsconfig.json

# Start backend server (Port 3001)
npm run dev --prefix apps/server

# Start frontend web studio (Port 5173)
npm run dev --prefix apps/web
```

---

## 📁 Key File Locations

- **Backend Entry:** [`apps/server/src/index.ts`](file:///c:/Users/Najeeba%20Nasir/Desktop/Portfolio/apps/server/src/index.ts)
- **Profile Extractor:** [`apps/server/src/services/intelligence/profileExtractor.ts`](file:///c:/Users/Najeeba%20Nasir/Desktop/Portfolio/apps/server/src/services/intelligence/profileExtractor.ts)
- **Groq LLM Provider:** [`apps/server/src/services/llm/GroqProvider.ts`](file:///c:/Users/Najeeba%20Nasir/Desktop/Portfolio/apps/server/src/services/llm/GroqProvider.ts)
- **Frontend App Router:** [`apps/web/src/App.tsx`](file:///c:/Users/Najeeba%20Nasir/Desktop/Portfolio/apps/web/src/App.tsx)
- **Live Studio Canvas:** [`apps/web/src/components/LiveCanvas.tsx`](file:///c:/Users/Najeeba%20Nasir/Desktop/Portfolio/apps/web/src/components/LiveCanvas.tsx)
- **Shared Schemas:** [`packages/shared/src/schemas/profile.ts`](file:///c:/Users/Najeeba%20Nasir/Desktop/Portfolio/packages/shared/src/schemas/profile.ts)

---

> **End of Session Context File (`SESSION_CONTEXT.md`)**
