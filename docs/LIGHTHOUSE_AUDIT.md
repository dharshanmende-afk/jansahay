# JanSahay AI — Lighthouse & Mobile PWA Audit Report

**Audit Date:** 2026-11-12  
**Lighthouse Version:** 13.6.0 (Headless Chrome)  
**Target URL:** `http://127.0.0.1:4173/` (`vite preview` production bundle backed by Express API on `:5000`)

---

## 1. Lighthouse Category Scores (Measured)

| Category | Mobile Preset | Desktop Preset |
| :--- | :---: | :---: |
| **Performance** | **100** | **100** |
| **Accessibility** | **100** | **100** |
| **Best Practices** | **100** | **100** |
| **SEO** | **100** | **100** |

---

## 2. Core Web Vitals & Timing Metrics

| Metric | Mobile | Desktop |
| :--- | :---: | :---: |
| First Contentful Paint (FCP) | `1.5 s` | `0.5 s` |
| Largest Contentful Paint (LCP) | `1.5 s` | `0.5 s` |
| Cumulative Layout Shift (CLS) | `0` | `0.035` |
| Total Blocking Time (TBT) | `60 ms` | `0 ms` |
| Speed Index (SI) | `1.5 s` | `0.6 s` |
| Time to Interactive (TTI) | `2.5 s` | — |

### Remaining Non-Blocking Diagnostics Observed
- `unused-javascript`: Estimated savings of `35 KiB` across secondary helpers.
- `render-blocking-insight`: External Google Fonts CSS stylesheet adds `840 ms` (mobile) / `310 ms` (desktop).

---

## 3. Issues Identified on First Run & Resolved

1. **Desktop CLS (`0.681` -> `0.035`)**:
   - *Cause*: Lazy-loading the landing route `/` caused `<main>` to briefly render a compact loading fallback before `HomePage` mounted, shifting `<footer>` by `0.645`.
   - *Fix*: Eagerly imported `HomePage` while keeping secondary routes (`ProfileWizardPage`, `RecommendationsPage`, `SchemesCatalogPage`, `SchemeDetailPage`, `DocumentPreparationPage`, `DocumentGuidesCatalogPage`, `LiveUpdatesPage`, `AdminDashboardPage`, `LoginPage`, `RegisterPage`, `PrivacyPolicyPage`) code-split via `React.lazy`, and added `minHeight: '75vh'` on `PageLoader`.
2. **WCAG AA Color Contrast (`96` -> `100`)**:
   - *Cause*: `#ea580c` pill on white (`3.55:1`) in `HomePage.jsx` and `#64748b` muted text on `#0f172a` (`3.75:1`) in `Footer.jsx`.
   - *Fix*: Upgraded to `#9a3412` on `#ffffff` and `#cbd5e1` on `#0f172a` (passing >= `4.5:1`).
3. **`robots.txt` Validation (`91` -> `100` SEO)**:
   - *Cause*: Missing `client/public/robots.txt` caused Vite SPA fallback to return `index.html`.
   - *Fix*: Added standard `client/public/robots.txt`.
4. **Console Network `502` (`Best Practices 96` -> `100`)**:
   - *Cause*: `client/vite.config.js` proxied `/api` to `localhost:8080` instead of default backend port `5000`.
   - *Fix*: Aligned proxy target to `process.env.VITE_API_PROXY || 'http://127.0.0.1:5000'`.

---

## 4. 360px Mobile Viewport & PWA Service Worker Verification (Chrome CDP)

Audited at exact **360x800** mobile viewport (`deviceScaleFactor: 2`) in headless Chrome (`127.0.0.1:4173`):

| Route | ScrollWidth / InnerWidth | Horizontal Overflow | Skip Link & `<main>` Landmark |
| :--- | :---: | :---: | :---: |
| `/` | `360 / 360` | `0 px` | Present |
| `/profile` | `360 / 360` | `0 px` | Present |
| `/schemes` | `360 / 360` | `0 px` | Present |
| `/document-guides` | `360 / 360` | `0 px` | Present |
| `/updates` | `360 / 360` | `0 px` | Present |
| `/recommendations` | `360 / 360` | `0 px` | Present |
| `/document-preparation` | `360 / 360` | `0 px` | Present |
| `/privacy` | `360 / 360` | `0 px` | Present |

- **Manifest (`/manifest.json`)**: `HTTP 200`, valid PNG `192x192` & `512x512` icons, `standalone` display mode.
- **Service Worker (`/sw.js` `jansahay-v2`)**: `HTTP 200`, confirmed `activated` in Chrome (`navigator.serviceWorker.getRegistrations()` -> `count: 1, activeState: "activated"`), precaching static shell and stale-while-revalidate caching `/api/schemes`, `/api/documents/guides`, `/api/updates`, and `/api/documents/preparation-dashboard` for offline access alongside `localStorage` anonymous/offline caches.
