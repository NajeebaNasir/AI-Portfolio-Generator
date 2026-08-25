# Agent Thinking & Context Persistence

## Purpose
This folder serves as an external memory and decision ledger. Its purpose is to continuously persist and update:
1. **Core Understanding & Requirements**: High-level objectives, system architecture, constraints, and business domain logic.
2. **Key Decisions & Rationale**: Architectural and technical trade-offs, design choices, and structural approaches taken during development.
3. **Execution State & Next Steps**: What has been implemented, what is currently in progress, and planned upcoming steps.
4. **Context Recovery**: If conversation context is ever truncated or reset, reading this directory allows immediate recovery and seamless continuation of work.
5. **Core Directives & Behavioral Memory**:
   - **MANDATORY DEBUGGING RULE**: Whenever asked to debug or fix any problem, **ALWAYS state first what the exact issue/root cause encountered was** before explaining the fix or changes.

---

## Log & State Tracking

### Bulletproof Normalizer & Section Backfill (Complete)
- **Root Cause**: Fast LLMs occasionally truncated JSON output, causing strict schema parsers to drop arrays, which collapsed the portfolio sections down to hero & contact.
- **Implemented Fix**: Built `normalizeAndBackfill` in [`ProfileExtractor.ts`](file:///c:/Users/Najeeba%20Nasir/Desktop/Portfolio/apps/server/src/services/intelligence/profileExtractor.ts) which guarantees that **all sections** (Experience, Projects, Skills, Education, Certifications, and Contact) are parsed, populated, and displayed with 100% completeness regardless of LLM formatting variations.
- **Verification**: Built and verified all packages; 100% E2E test suite pass.
