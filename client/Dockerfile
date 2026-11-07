# ==============================================================================
# JanSahay AI Web Client — Production Multi-Stage Dockerfile (Vite + Nginx)
# ==============================================================================

# Stage 1: Build Static Assets
FROM node:20-alpine AS builder
WORKDIR /app

# Pass API URL at build time (defaults to relative /api or Render URL)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Stage 2: Production High-Performance Web Server
FROM nginx:1.27-alpine AS runner

# Security: Remove default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
