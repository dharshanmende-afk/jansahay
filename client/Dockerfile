# ==============================================================================
# JanSahay AI Web Client — Multi-Stage Non-Root Nginx Dockerfile
# ==============================================================================

# Stage 1: Build Vite static bundle
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL="/api"
ARG VITE_PLAUSIBLE_DOMAIN=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PLAUSIBLE_DOMAIN=$VITE_PLAUSIBLE_DOMAIN

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Unprivileged non-root Nginx runtime (UID 101, port 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner

USER root
RUN rm -rf /usr/share/nginx/html/*
COPY --chown=101:101 --from=builder /app/dist /usr/share/nginx/html
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf

USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
