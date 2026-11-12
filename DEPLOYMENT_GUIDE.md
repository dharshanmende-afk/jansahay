# JanSahay AI v2.0 — Production DevOps & Cloud Deployment Guide

This guide walks through deploying the **JanSahay AI** platform (**Node.js 20 + Express API + Prisma + PostgreSQL 16 + React 18 Vite PWA**) using free/starter cloud services or self-hosted Docker Compose, along with observability setup (**UptimeRobot, Sentry, Plausible Analytics**).

---

## Architecture Overview

| Layer | Technology | Recommended Host | Config File |
| :--- | :--- | :--- | :--- |
| **Database** | PostgreSQL 16 (Managed + Prisma ORM) | Render PostgreSQL / Railway | [`render.yaml`](render.yaml) |
| **Backend API** | Node.js 20 + Express + Pino + Zod | Render Web Service / Railway | [`render.yaml`](render.yaml) / [`railway.toml`](railway.toml) |
| **Frontend PWA** | React 18 + Vite + Nginx / Edge CDN | Netlify (or Nginx container) | [`netlify.toml`](netlify.toml) |
| **Self-Hosted Stack** | Docker Compose (`postgres`, `server`, `client` non-root) | Any Linux VM / Docker Desktop | [`docker-compose.yml`](docker-compose.yml) |

---

## Option A: One-Command Self-Hosted Stack (`docker compose up --build`)

1. Copy `.env.example` to `.env` and replace `JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD`, and optional `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```
2. Launch PostgreSQL 16, non-root Node.js API (`server:5000`), and non-root Nginx SPA + reverse proxy (`client:80 -> 8080`):
   ```bash
   docker compose up --build -d
   ```
3. Verify container health:
   ```bash
   docker compose ps
   curl http://localhost:5000/api/health
   curl -I http://localhost/
   ```
4. Seed initial schemes/guides cleanly (no dev demo users are created when `NODE_ENV=production`):
   ```bash
   docker compose exec server npm run seed
   ```

---

## Option B: Cloud Deployment (Render or Railway + Netlify)

### Step 1: Deploy Backend & Managed PostgreSQL on Render

1. Fork or connect `https://github.com/dharshanmende-afk/jansahay` in the [Render Dashboard](https://dashboard.render.com).
2. Choose **New → Blueprint** and select [`render.yaml`](render.yaml). This provisions:
   - `jansahay-db` (Managed PostgreSQL 16 database)
   - `jansahay-backend` (Node.js web service in `server/` with health check `/api/health`)
3. In Render **Environment Variables**, verify/add:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `DATABASE_URL` *(auto-linked from `jansahay-db`)*
   - `JWT_SECRET` & `JWT_REFRESH_SECRET` *(auto-generated >=32 chars by Render)*
   - `CORS_ORIGIN=https://<your-site>.netlify.app`
   - `AI_PROVIDER=gemini` *(or `deterministic` if running without LLM keys)*
   - `GEMINI_API_KEY=<your-gemini-key>`
   - `SENTRY_DSN=<your-sentry-dsn>` *(optional free-tier error reporting)*
4. Once `jansahay-backend` is live, open Render **Shell** once to push schema & seed verified schemes/guides:
   ```bash
   npm run db:push && npm run seed
   ```
   *(Because `NODE_ENV=production`, zero demo accounts are seeded.)*
5. Confirm health check:
   ```bash
   curl https://jansahay-backend.onrender.com/api/health
   ```

#### Alternative Backend Host: Railway
1. Create a **New Project → Deploy from GitHub repo** in [Railway](https://railway.app) (detected via [`railway.toml`](railway.toml) and root [`Dockerfile`](Dockerfile)).
2. Add a **PostgreSQL** plugin in the same project and link `${{Postgres.DATABASE_URL}}` as `DATABASE_URL`.
3. Set the same environment variables (`NODE_ENV=production`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `AI_PROVIDER`, `GEMINI_API_KEY`, `SENTRY_DSN`).

---

### Step 2: Deploy React PWA Frontend on Netlify

1. Go to [Netlify](https://app.netlify.com) → **Add new site → Import an existing project** → select your GitHub repository.
2. Netlify reads [`netlify.toml`](netlify.toml) automatically (`base = "client"`, `publish = "dist"`, `command = "npm run build"`, Node `20`).
3. In **Site settings → Environment variables**, set:
   - `VITE_API_URL=https://jansahay-backend.onrender.com/api` *(your Render or Railway backend URL)*
   - `VITE_PLAUSIBLE_DOMAIN=<your-domain>` *(optional cookie-free analytics)*
4. Trigger **Deploy site**. Single-page routing fallback (`/* -> /index.html 200`) and security headers are pre-configured in [`netlify.toml`](netlify.toml).
5. Copy your Netlify domain and update `CORS_ORIGIN` on Render/Railway so authenticated requests work cross-origin.

---

## Observability Setup (Free Tier)

### 1. Structured Logs & `/api/health`
- Backend logs structured JSON via `pino` and `pino-http` ([`logger.js`](server/src/utils/logger.js)) with automatic key redaction (`password`, `token`, `authorization`, `aadhaar`, `bank`).
- `GET /api/health` verifies database connectivity, uptime, active services, and observability status (`200 OK` or `503 DEGRADED`).

### 2. Uptime Monitoring (UptimeRobot — Free Tier)
1. Create a free account at [uptimerobot.com](https://uptimerobot.com).
2. Add a **HTTP(s) Monitor**:
   - **Friendly Name:** `JanSahay AI Backend API`
   - **URL:** `https://jansahay-backend.onrender.com/api/health`
   - **Monitoring Interval:** `5 minutes`
   - **Keyword Check (Optional):** `"status":"UP"` (helps keep Render free-tier containers warm cleanly and alerts via email/Slack if downtime >5 mins).

### 3. Error Tracking (Sentry — Free Developer Tier)
1. Create a **Node.js** project at [sentry.io](https://sentry.io) and copy the **DSN**.
2. Set `SENTRY_DSN` in your backend environment variables (Render / Railway / `.env`).
3. [`observability.js`](server/src/utils/observability.js) transmits `>=500` server errors asynchronously via Sentry Envelope API with sensitive fields (`aadhaar`, `pan`, `bank`, `password`, `token`) automatically scrubbed to `[REDACTED]`. No action needed if `SENTRY_DSN` is omitted.

### 4. Privacy-Friendly Analytics (Plausible)
1. Create an account at [plausible.io](https://plausible.io) (or self-host Plausible Community Edition) and add your Netlify/custom domain.
2. Set `VITE_PLAUSIBLE_DOMAIN=your-site.netlify.app` in Netlify environment variables and rebuild.
3. [`App.jsx`](client/src/App.jsx) loads `plausible.io/js/script.js` only when `VITE_PLAUSIBLE_DOMAIN` is present — **zero cookies, zero third-party ad trackers, and DPDP-aligned**.

---

## CI/CD GitHub Secrets (Optional Deploy Hooks)

GitHub Actions (`.github/workflows/ci.yml`) runs ESLint, scheme citation validation, Vitest unit/integration tests + coverage, RAG & AI agent evaluations, `vite build`, `npm audit`, Gitleaks secret scanning, and multi-stage Docker builds on every PR and push.

To trigger explicit Render/Netlify rebuild hooks on `main`, optionally set in **GitHub Repository Settings → Secrets and variables → Actions**:
- `RENDER_DEPLOY_HOOK_URL` (from Render Service Settings → Deploy Hook)
- `NETLIFY_BUILD_HOOK_URL` (from Netlify Site Configuration → Build Hooks)
