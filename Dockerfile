# ==============================================================================
# JanSahay AI Root Dockerfile — Production Multi-Stage Deployment (Node.js 20)
# Used by PaaS platforms (Render, Railway, Fly.io) building from repository root
# ==============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma
RUN npm ci \
  && npx prisma generate --schema=./prisma/schema.prisma \
  && npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node server/package.json ./
COPY --chown=node:node server/prisma ./prisma
COPY --chown=node:node server/src ./src
COPY --chown=node:node server/data ./data
COPY --chown=node:node server/scripts ./scripts

# Security: Run strictly as unprivileged non-root user
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "src/server.js"]
