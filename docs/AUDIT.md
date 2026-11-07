# 🕵️ JanSahay AI — Comprehensive Codebase & Architecture Audit

**Repository**: [github.com/dharshanmende-afk/jansahay](https://github.com/dharshanmende-afk/jansahay)  
**Audit Date**: November 8, 2026  
**Auditor**: Senior Full-Stack + DevOps & AI Engineer Reviewer  
**Commit Inspected**: `532bede` (`docs: add publication-grade project architecture report PDF and generator script`)  
**Standard**: Honesty First — Zero Fake Metrics, Rigorous Verification against Codebase

---

## 1. Executive Summary

This audit evaluates the codebase to establish a baseline of what is **actually implemented and working**, what is **partially built**, and what is **claimed in documentation but missing from code**.

* **Core Strengths**: The deterministic eligibility rules engine (`server/src/services/eligibilityEngine.js`, 98.77% stmt coverage), cross-scheme document deduplication (`server/src/services/documentAnalysisService.js`, 97.25% coverage), 50 seeded welfare schemes, 14 statutory RTS document guides, client-side vector PDF generation (`jspdf`), and the 46 passing unit/integration tests (`node --test`) are genuine, verified, and functioning.
* **Critical Deficiencies**:
  1. **No True ORM / Dual-Mode DB Divergence**: While raw SQL migrations and a `pgClient.js` pool exist, **Prisma is not installed or configured**. In local runs without PostgreSQL, the system silently defaults to `server/data/jansahay-db.json`.
  2. **Static RAG vs. Dynamic Agent**: The AI is currently an in-memory TF-IDF semantic chunk matcher calling Gemini 1.5 Flash via a single-turn `generateContent` API call. There are **no dynamic tools**, **no agentic loop**, **no function calling**, and **no conversational profile extraction**. The client even has a legacy keyword fallback in `client/src/services/aiKnowledgeBase.js` claiming the app is built with "Spring Boot and MySQL"!
  3. **Repository Clutter**: Over 35MB of leftover Replit monorepo files (`artifacts/`, `lib/`, `pnpm-*.yaml`, `tsconfig*.json`, duplicate `documentation/` vs `docs/`) bloat the repository.
  4. **PWA Incomplete**: The manifest references `/icon-192.png` and `/icon-512.png`, but neither exists in `client/public/`.
  5. **Security Gaps**: JWT refresh tokens are decoded statelessly without database persistence or rotation tracking; `docker-compose.yml` provides fallback production secrets.

---

## 2. README Claim vs. Reality Matrix

| Feature / Claim | README Claim | Reality in Code | Status | File Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **PostgreSQL Database** | "PostgreSQL v16+ Relational persistence" | Raw PostgreSQL pool in `pgClient.js` with SQL migration file, BUT runtime defaults to `jansahay-db.json` when PostgreSQL is offline. | **Partial** | `server/src/db/pgClient.js`<br>`server/src/db/database.js:46-52`<br>`server/src/db/migrations/001_initial_schema.sql` |
| **ORM / Data Access** | "Prisma / Drizzle ORM Latest" | **Prisma is NOT installed anywhere**. Drizzle configuration is stranded in dead folder `lib/db/drizzle.config.ts` and never imported by runtime. | **Missing** | `server/package.json` (no prisma)<br>`lib/db/` (unimported) |
| **Input Validation** | "Validate every request with Zod" | Zod v4 schemas validate `/auth/register`, `/auth/login`, and `/profile`. However, query params in `/schemes`, `/documents`, and several admin routes lack Zod schemas. | **Partial** | `server/src/middleware/validate.js`<br>`server/src/schemas/validationSchemas.js`<br>`server/src/routes/schemeRoutes.js:9` |
| **Security Headers** | "Helmet enabled" | Helmet is installed and mounted globally in Express app. | **Implemented** | `server/src/server.js:47` |
| **Rate Limiting** | "Express-rate-limit stricter on /auth and /ai" | Mounted globally (100 req/15m) and stricter on `/api/auth` & `/api/ai` (30 req/15m). | **Implemented** | `server/src/server.js:52-68`<br>`server/src/middleware/rateLimiter.js` |
| **JWT Refresh Tokens** | "JWT expiry plus refresh-token flow with rotation" | `POST /api/auth/refresh` exists and verifies refresh token, but tokens are **not saved in database**; no revocation or replay-detection. | **Partial** | `server/src/routes/authRoutes.js:90-128` |
| **Deterministic Rules Engine** | "Transparent Strong Match, Potential, More Info" | Highly robust deterministic engine evaluating rules with condition diagnostics across income, category, land, age, etc. | **Implemented** | `server/src/services/eligibilityEngine.js`<br>`server/tests/unit/eligibilityEngine.test.js` |
| **Document Deduplication** | "Cross-Scheme Document Deduplication Engine" | Mathematical set-union deduplication across matched schemes with in-hand inventory reconciliation. | **Implemented** | `server/src/services/documentAnalysisService.js`<br>`server/tests/unit/documentDeduplication.test.js` |
| **AI / Gemini RAG** | "Grounded Multilingual AI with Google Gemini RAG" | TF-IDF vector index with 238 chunks + raw Axios call to Gemini 1.5 Flash. Single-turn only. **No function calling, no dynamic tools, no conversational profile builder**. | **Partial** | `server/src/services/ragService.js:628-677`<br>`server/src/routes/aiRoutes.js` |
| **Vector Index** | "pgvector or in-memory vector index" | In-memory TF-IDF + cosine similarity matrix. No pgvector extension used. | **Partial** | `server/src/services/ragService.js:144-240` |
| **Live Gov Sync / Scraper** | "Continuous ingestion from PIB, MyScheme, MahaDBT" | Cheerio scrapers implemented, but official government portals frequently block scrapers (403/WAF), causing silent fallback to cached seed data. | **Partial** | `server/src/services/govDataService.js:23-80` |
| **PWA & Offline Access** | "Installable PWA with offline scheme catalog" | `manifest.json` and `sw.js` exist with stale-while-revalidate for `/schemes`. **Missing icon files on disk** (`/icon-192.png`, `/icon-512.png` return 404). | **Partial** | `client/public/manifest.json`<br>`client/public/sw.js`<br>`client/public/` (no icons) |
| **PDF Export** | "Export recommendations and document checklist as PDF" | Client-side jsPDF utility generates vector dossiers and checklists; also CLI generator for project report PDF. | **Implemented** | `client/src/utils/pdfExport.js`<br>`docs/JanSahay_AI_Project_Report.pdf` |
| **Admin Policy Analytics** | "Top-viewed schemes, missing documents, language usage" | Endpoint `GET /api/admin/analytics` and UI tab in `AdminDashboardPage.jsx` render in-demand schemes, missing certificate bottlenecks, and language charts. | **Implemented** | `server/src/routes/adminRoutes.js:40-108`<br>`client/src/pages/AdminDashboardPage.jsx` |
| **50 Schemes & 14 RTS Guides** | "50 verified schemes & 14 RTS statutory guides" | Complete database array containing 50 schemes and 14 statutory RTS document guides with `sourceUrl` and `lastVerifiedAt`. | **Implemented** | `server/src/db/seedData.js`<br>`server/data/jansahay-db.json` |
| **Docker & Nginx** | "Multi-stage Dockerfiles and Nginx reverse proxy" | `server/Dockerfile` (node:20-alpine), `client/Dockerfile` (nginx:1.27-alpine), `docker-compose.yml` with postgres, server, and client. | **Implemented** | `server/Dockerfile`<br>`client/Dockerfile`<br>`docker-compose.yml` |
| **CI/CD Pipeline** | "GitHub Actions CI pipeline" | Matrix build workflow running lint, test, and Docker build. | **Implemented** | `.github/workflows/ci.yml` |
| **Test Suite** | "Vitest/Supertest 70%+ coverage on services" | 46 tests pass using **Node native test runner** (`node --test`), not Vitest. Core service coverage is 73.55% overall (Eligibility 98.77%, Deduplication 97.25%, RAG 89.21%). | **Partial** | `server/package.json:12-15`<br>`server/tests/` |
| **Deployments** | "Render/Railway backend and Netlify frontend" | `netlify.toml` configured with SPA routing; `render.yaml` blueprint committed. Live app verified on Netlify. | **Implemented** | `netlify.toml`<br>`render.yaml` |

---

## 3. Security & Vulnerability Findings

1. **Fallback Secrets in `docker-compose.yml`**:
   Lines 45-46 of `docker-compose.yml` contain fallback strings:
   `JWT_SECRET: ${JWT_SECRET:-jansahay-prod-jwt-secret-key-at-least-32-chars-long}`. If started without a `.env` file, predictable keys are used.
2. **Stateless Refresh Token Vulnerability**:
   `POST /api/auth/refresh` (`server/src/routes/authRoutes.js`) verifies the refresh token signature via `jwt.verify`, but does not verify whether the token has been revoked, rotated, or blacklisted.
3. **No Account or Data Deletion Endpoint**:
   Under Digital Personal Data Protection Act (DPDP) and best practices, citizens must be able to delete their profile and account. No `DELETE /api/profile` or `DELETE /api/auth/me` exists.
4. **Outdated Copy Claiming Spring Boot / MySQL in Client**:
   `client/src/services/aiKnowledgeBase.js` (line 27) returns text to users stating:
   `"Built with React 18, Vite, Spring Boot 3 (Java 17), and Aiven MySQL"`. This contradicts the actual Node.js/PostgreSQL stack.
5. **Masking of Sensitive Logged Data**:
   Morgan logs raw request URLs and statuses, but body sanitization/masking (stripping Aadhaar references or passwords from logs) is not explicitly enforced across custom log calls.

---

## 4. Dead, Duplicate & Cluttered Files

| Directory / File | Description | Impact | Recommendation |
| :--- | :--- | :--- | :--- |
| `artifacts/` (`api-server`, `jansahay`, `mockup-sandbox`) | ~30MB of leftover Replit workspaces, duplicate TypeScript code, `.replit-artifact` folders. | Huge repository bloat, confuses reviewers. | **Delete completely** in Phase 1. |
| `documentation/` vs `docs/` | `documentation/` has 6 markdown files; `docs/` has `JanSahay_AI_Project_Report.pdf`. | Duplicate doc folders. | **Merge all markdown files into `docs/`**; delete `documentation/`. |
| `lib/` (`api-client-react`, `api-spec`, `api-zod`, `db`) | Leftover monorepo packages; zero files are imported by `server` or `client`. | Confuses developers about where schemas and DB models reside. | **Remove** in Phase 1. |
| `pnpm-lock.yaml` & `pnpm-workspace.yaml` | Redundant package lockfiles since subprojects use standard `npm`. | Confuses package management tooling. | **Remove** in Phase 1. |
| `tsconfig.base.json` & `tsconfig.json` (root) | TypeScript config files in a pure ESM JavaScript repository. | Confuses TypeScript linters. | **Remove** in Phase 1. |
| `vercel.json` | Redundant deployment config alongside `netlify.toml` and `render.yaml`. | Inconsistent deployment story. | **Remove** in Phase 1. |
| `client/public/manifest.json` icons | References `/icon-192.png` and `/icon-512.png`, but neither exists in `client/public/`. | PWA installation warning; missing assets. | **Add real SVG/PNG icons** in Phase 1. |
| `scripts/src/hello.ts` | Dead demo typescript script. | Unused clutter. | **Remove** in Phase 1. |

---

## 5. Fresh Clone & Developer Experience Audit

When testing the steps from `README.md` on a clean environment:

1. **Root `npm install` does nothing**:
   Root `package.json` contains scripts but no `dependencies` or `workspaces`. A developer running `npm install` at root gets no subproject packages installed.
2. **Missing `npm run install:all`**:
   The developer must manually run `cd server && npm install`, then `cd ../client && npm install`. A root helper script or npm workspaces is needed.
3. **Database Setup Ambiguity**:
   Running `npm run seed` before starting PostgreSQL fails with an unhandled rejection if PostgreSQL credentials are provided but the server is unreachable; the fallback only works when `DATABASE_URL` is completely omitted.
4. **GitHub Clone URL**:
   The README has mixed-casing: `https://github.com/dharshanmende-afk/JanSahay.git` vs `jansahay`.

---

## 6. Government Data Freshness & Scraper Reality Check

* **50 Schemes & 14 RTS Guides**: All 50 schemes have `sourceUrl` and `lastVerifiedAt` attributes in `server/src/db/seedData.js`.
* **Automated Link & Freshness Verification**: There is currently no CI script that checks if `sourceUrl` links return HTTP 200, or warns if `lastVerifiedAt` is older than 180 days.
* **Scraper Reality**: NIC and state portals (`mahadbt.maharashtra.gov.in`, `pmkisan.gov.in`) routinely block direct Cheerio scraping with HTTP 403 / Cloudflare challenges. The platform's cache fallback currently protects uptime, but scrapers must be labeled as best-effort synchronization, not guaranteed live scraping.

---

## 7. Proposed Order of Work (Phases 1 through 9)

To achieve the goal of a production-quality, honest, and impressive portfolio project with a dynamic AI agent:

* **PHASE 1: TRUTH AND CLEANUP**
  - Delete `artifacts/`, `lib/`, `documentation/` (merge into `docs/`), redundant `pnpm-*`, and unused `tsconfig*.json`.
  - Provide missing PWA icons (`icon-192.png`, `icon-512.png`).
  - Add root workspace / `npm run install:all` script.
  - Rewrite `README.md` to truthfully reflect code reality, moving unbuilt features to "Roadmap (Planned)".
  - Provide one-line GitHub "About" description and topics.

* **PHASE 2: DATABASE WITH PRISMA**
  - Install and initialize Prisma ORM in `server/`.
  - Commit Prisma schema with 10 tables: `users`, `profiles`, `schemes`, `scheme_rules`, `document_guides`, `user_documents`, `policy_updates`, `chat_sessions`, `chat_messages`, `feedback`.
  - Create and commit Prisma migrations.
  - Write robust seed script that imports existing 50 schemes and 14 RTS guides.
  - Keep REST API response contracts 100% backward-compatible.

* **PHASE 3: SECURITY & PRIVACY**
  - Comprehensive Zod validation on every route and query parameter.
  - Replace Morgan with structured `pino` logger.
  - Implement real DB-backed JWT refresh token rotation with revocation detection.
  - Add `DELETE /api/profile` (data deletion) and `DELETE /api/auth/me` (account deletion) endpoints and client UI.
  - Add Privacy Policy page in client.

* **PHASE 4: TESTING & COVERAGE**
  - Install Vitest + Supertest in `server/`.
  - Add comprehensive boundary tests for eligibility engine, deduplication, and auth.
  - Target and measure 70%+ coverage on `services/`.
  - Add npm scripts: `test`, `test:coverage`, `lint`.

* **PHASE 5: DYNAMIC CONVERSATIONAL AI AGENT (5a to 5g)**
  - **5a**: Implement tools loop (`server/src/services/ai/tools.js`) with 7 tools (`search_schemes`, `get_scheme_details`, `check_eligibility`, `get_missing_documents`, `get_document_guide`, `get_latest_updates`, `update_profile`).
  - **5b**: Conversational profile building and multi-turn session memory stored in DB.
  - **5c**: Grounded verification, citation checks, and hallucination rejection.
  - **5d**: Multilingual detection and response (EN, HI, MR, and romanized Hinglish/Marathi).
  - **5e**: Streaming SSE UI with status chips and scheme cards inside chat.
  - **5f**: Prompt injection safety, rate limits, and fallback banner.
  - **5g**: Evaluation benchmark suite (`scripts/eval-ai.js`) with 40+ cases; output report in `docs/AI_EVALUATION.md`.

* **PHASE 6: REAL-USER USABILITY**
  - Anonymous mode (check eligibility without login).
  - Voice STT & TTS (Web Speech API) for Hindi and Marathi.
  - PWA offline mode verification and real Lighthouse measurement.
  - Accessibility audit (WCAG AA).
  - "Report wrong information" feedback button on scheme cards.

* **PHASE 7: DATA GOVERNANCE & ADMIN INTELLIGENCE**
  - CI validation script checking scheme `sourceUrl` and flagging verification dates older than 180 days.
  - Data-only guide for adding new state schemes.
  - Admin analytics for unanswered AI questions and user feedback reports.

* **PHASE 8: DEVOPS & CLOUD HARDENING**
  - Fix non-root users in Dockerfiles; remove fallback secrets from `docker-compose.yml`.
  - GitHub Actions CI matrix with secret scanning and npm audit.
  - Observability setup (Sentry, UptimeRobot guide, nightly DB backup script).
  - Production `RUNBOOK.md` and `DEPLOYMENT_GUIDE.md`.

* **PHASE 9: PRESENTATION & PORTFOLIO PACKAGING**
  - Final README polish with measured metrics, Mermaid diagrams, and demo recording guide.
  - `docs/ARCHITECTURE.md` with trade-offs.
  - `docs/RESUME_BULLETS.md` with strictly measured resume numbers.
