# ==============================================================================
# JanSahay AI Root Dockerfile — Production Multi-Stage Deployment (Node.js)
# Used by platforms (Render, Railway, Fly.io) that build from repo root
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY server/package.json server/package-lock.json ./
RUN npm ci --only=production

# Stage 2: Production Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Security: Run as non-root user
USER node

# Copy dependencies and application code
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node server/package.json ./
COPY --chown=node:node server/src ./src
COPY --chown=node:node server/data ./data

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
