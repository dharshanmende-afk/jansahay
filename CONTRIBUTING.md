# Contributing to JanSahay AI 🇮🇳

Thank you for your interest in contributing to **JanSahay AI**! This project is dedicated to empowering Indian citizens through seamless, deterministic discovery of government welfare schemes and step-by-step statutory document preparation roadmaps.

---

## 🏛️ Project Architecture Overview

The repository is structured into distinct, decoupled services:

```
JanSahay/
├── client/              # React 18 + Vite frontend (SPA)
│   ├── src/components/  # Modular UI elements (AIChatDrawer, Modals, Navbar)
│   ├── src/pages/       # Route-level views (Catalog, Wizard, Dashboards)
│   ├── src/services/    # Axios HTTP API clients
│   └── src/context/     # React state (AuthContext, LanguageContext)
├── server/              # Node.js + Express backend (REST API)
│   ├── src/routes/      # Endpoint route handlers
│   ├── src/services/    # Core business logic (Eligibility, AI, GovSync)
│   ├── src/middleware/  # Security, Auth, Validation, Rate Limiting
│   ├── src/db/          # Database connection, schemas, and seeds
│   └── tests/           # Unit and integration test suites
├── scripts/             # Automation, DevOps, and platform scripts
│   └── windows/         # Native Windows launcher & setup utilities
├── documentation/       # Architecture & API specifications
└── .env.example         # Environment template
```

---

## 📋 Commit Message Convention

We follow standard **Conventional Commits**:

| Prefix | Usage | Example |
| :--- | :--- | :--- |
| `feat:` | A new user-facing feature | `feat: add PDF export for recommendation roadmaps` |
| `fix:` | A bug fix | `fix: handle edge case in landholding eligibility check` |
| `docs:` | Documentation changes only | `docs: update API endpoints summary in README` |
| `test:` | Adding or updating tests | `test: add unit tests for document deduplication` |
| `chore:` | Build tasks, package updates, housekeeping | `chore: clean root scripts and reorganize windows utilities` |
| `ci:` | CI/CD pipeline changes | `ci: add GitHub Actions workflow for lint and test` |

---

## 🛠️ Local Development Workflow

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14+ (or Docker Compose)

### First-Time Setup
```bash
# Clone the repository
git clone https://github.com/dharshanmende-afk/JanSahay.git
cd JanSahay

# Setup environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Install dependencies
cd server && npm install
cd ../client && npm install
```

### Running Locally
```bash
# Terminal 1: Start Backend (Port 5000)
cd server
npm run dev

# Terminal 2: Start Frontend (Port 5173)
cd client
npm run dev
```

### Windows One-Click Quickstart
Windows users can execute:
```cmd
.\scripts\windows\setup.bat   # Runs dependency installation and config
.\scripts\windows\run.bat     # Launches client and server concurrently
```

---

## 🧪 Testing Standards

All business logic must be thoroughly covered by unit and integration tests:

```bash
cd server
npm test               # Run all test suites
npm run test:coverage  # Run coverage analysis
```

- Target at least **70%+ test coverage** for all modules in `server/src/services/`.
- Never commit broken tests.
- When adding new scheme rules or document guides, add matching test assertions.

---

## 🔒 Security & Data Integrity Rules

1. **Zero Secret Leaks**: Never commit `.env` files, API keys, JWT tokens, or credentials.
2. **Immutable Official Data**: Scheme facts, RTS timelines, issuing authorities, and fee structures must stay accurate to official gazettes and portals (`myscheme.gov.in`, `aaplesarkar.mahaonline.gov.in`, etc.), including explicit `lastVerifiedAt` timestamps.
3. **Defense in Depth**: Every endpoint must enforce input validation, role checks, and error boundaries.
