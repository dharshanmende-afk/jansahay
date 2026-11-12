# ==============================================================================
# JanSahay AI API Server — Production Multi-Stage Dockerfile (Node.js 20 Alpine)
# ==============================================================================

# Stage 1: Install dependencies, generate Prisma Client, and prune dev tools
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci \
  && npx prisma generate --schema=./prisma/schema.prisma \
  && npm prune --omit=dev

# Stage 2: Minimal Non-Root Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node src ./src
COPY --chown=node:node data ./data
COPY --chown=node:node scripts ./scripts

# Security: Run strictly as unprivileged non-root user
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "src/server.js"]
