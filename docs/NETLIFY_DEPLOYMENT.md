# Netlify Deployment Guide for JanSahay AI

## Root Cause of Common Vite SPA Deployment Failures
1. **Missing `netlify.toml`:** Netlify defaults to `publish = "build"` unless `netlify.toml` sets `base = "client"`, `publish = "dist"`, and `command = "npm run build"`.
2. **SPA Sub-route 404s:** Direct visits or refreshes on `/schemes`, `/profile`, `/recommendations`, or `/admin` require `/* -> /index.html` status `200` rewrite rules.
3. **API URL Mismatch:** Static builds need `VITE_API_URL` configured in Netlify Site Settings pointing to the Render/Railway Node.js API URL (`https://<service>.onrender.com/api`).

---

## Configuration Included in This Repository

- [`netlify.toml`](../netlify.toml): Configures Node `20`, `client/` base directory, `dist/` publish directory, security headers, immutable `/assets/*` caching, and SPA catch-all rewrite.
- [`client/public/_redirects`](../client/public/_redirects): Redundant SPA fallback (`/* /index.html 200`) copied cleanly into `client/dist/`.

---

## Steps to Deploy on Netlify

1. Log in to **[Netlify Dashboard](https://app.netlify.com)** and select **Add new site → Import an existing project**.
2. Connect GitHub repository: `dharshanmende-afk/jansahay` (`main` branch).
3. Leave **Base directory** blank in the Netlify import UI so Netlify reads root `netlify.toml` cleanly (`base = "client"`, `NPM_FLAGS = "--workspaces=false"`, `command = "npm run build"`, `publish = "dist"`).
4. Under **Environment variables**, add:
   - `VITE_API_URL` = `https://<your-render-or-railway-backend>.onrender.com/api`
   - `VITE_PLAUSIBLE_DOMAIN` *(optional cookie-free analytics domain)*
5. Click **Deploy site**. Afterward, update `CORS_ORIGIN` on your backend host to include your Netlify domain.
