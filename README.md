# 🚀 AI Portfolio Generator Agent (`PortfolioForge`)

> An intelligent, local-first monorepo web application that transforms candidate resumes (PDF/DOCX/Text) into high-converting, fully customized developer portfolio websites with zero code loss and 100% deterministic layout stability.

Developed & Maintained by **[Najeeba Nasir](https://github.com/NajeebaNasir)**

---

## 🌟 Key Features

- **🛡️ The Two-Artifact Contract:** Strictly decouples raw candidate data (`resume.json`) from LLM design decisions (`portfolio.config.json`). The renderer is 100% deterministic, guaranteeing every generated portfolio is responsive, stable, and zero-hallucination.
- **🤖 BYOK Multi-LLM Orchestration:** Powered by Groq API (`groq/compound-mini`, `openai/gpt-oss-20b`, `llama-3.1-8b-instant`) with automatic fallback to deterministic rule engines under rate limits.
- **🎨 Interactive Live Studio:** Live preview workspace featuring:
  - **Floating Sticky Header:** Pinning navigation links (`Projects`, `Experience`, `Skills`, `Education`, `Certifications`, `Contact`) for seamless scrolling.
  - **Theme & Token Customizer:** Swap typography, border radius, density, and color palettes on the fly.
  - **Targeted AI Re-Writer:** Section-by-section AI copy refactoring modal.
- **📋 1-Click Contact Hub:** Cleanly renders all candidate contact details (Email, Phone, Address/Location, LinkedIn, GitHub) with built-in **1-Click Copy-to-Clipboard** feedback.
- **📦 Zero-Config Export & CI/CD Hub:** Generates a downloadable ZIP bundle pre-configured with official GitHub Pages CI/CD workflow (`.github/workflows/deploy.yml`) for push-to-deploy hosting.

---

## 🏗️ Architecture & Pipeline Stages

```
[ Upload Resume ] ➔ [ 1. Parse (Deterministic) ] ➔ [ 2. Extract (LLM Schema) ]
                                                            │
                                                            ▼
[ Export ZIP / CI ] ◄─ [ 4. Deterministic Render ] ◄─ [ 3. Design Orchestrator ]
```

1. **Stage 1 - Ingestion & Parsing:** Extracts raw text from PDF/DOCX files using `pdf-parse` and `mammoth`.
2. **Stage 2 - Structured LLM Extraction:** Transforms text into a validated JSON Resume schema (`CanonicalProfile`), preventing facts from being invented.
3. **Stage 3 - Design Orchestration:** Selects optimal design archetype, color palette, typography pairing, and component selection.
4. **Stage 4 - Deterministic Studio Rendering:** Maps tokens directly into typed React components.
5. **Stage 5 - ZIP Packaging & Deployment:** Streams export files with pre-wired GitHub Actions.

---

## 📁 Monorepo Structure

```
├── apps/
│   ├── web/               # React 18 + Vite Live Studio UI & Canvas Component Engine
│   └── server/            # Express Node API Server (LLM Provider, Parser, Exporter)
├── packages/
│   └── shared/            # Shared Zod Schemas, Archetypes & Design Spec Tokens
├── start.ps1              # PowerShell Automated Launcher & Port Cleanup
└── start.bat              # Windows Batch Launcher & Port Cleanup
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Groq API Key**: Get a key from [Groq Console](https://console.groq.com/)

### 2. Environment Setup
Create a `.env` file inside `apps/server/.env`:
```env
PORT=3001
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Launching the Application
You can run the automated launcher script (frees ports `3001` & `5173` automatically and starts both servers):

#### **On Windows (PowerShell):**
```powershell
.\start.ps1
```

#### **On Windows (Command Prompt / Batch):**
```cmd
start.bat
```

#### **Or Manual Start:**
```bash
# Install dependencies across monorepo
npm install

# Start backend server
npm run dev --prefix apps/server

# Start frontend web studio (in another terminal)
npm run dev --prefix apps/web
```

Access the studio live at **`http://localhost:5173`**!

---

## 👤 Author & Maintainer

**Najeeba Nasir**
- GitHub: [@NajeebaNasir](https://github.com/NajeebaNasir)
