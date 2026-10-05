# syntax=docker/dockerfile:1
# =============================================================================
# Akrem Mobile — single-origin production image
#   /api/*  and the built storefront are served by ONE process, so a reverse
#   proxy (Caddy, nginx, Traefik) only needs a single upstream.
# =============================================================================

# ---- stage 1 · build the React storefront ------------------------------------
FROM node:24-bookworm-slim AS web
WORKDIR /app/frontend
# python3/make/g++ let better-sqlite3 fall back to a source build on platforms
# where no prebuilt binary exists.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY frontend/package.json ./
# `npm install` (no lockfile is committed yet). Once you commit package-lock.json
# for both apps, switch these two lines to `npm ci` for reproducible builds.
RUN npm install --no-audit --no-fund
COPY frontend/ ./
# Sub-path hosting: docker compose build --build-arg VITE_BASE=/shop/
ARG VITE_BASE=/
ENV VITE_BASE=$VITE_BASE
RUN npm run build

# ---- stage 2 · backend production dependencies -------------------------------
FROM node:24-bookworm-slim AS api
WORKDIR /app/backend
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY backend/package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# ---- stage 3 · runtime --------------------------------------------------------
FROM node:24-bookworm-slim AS runtime
LABEL org.opencontainers.image.title="akrem-store" \
      org.opencontainers.image.description="Akrem Mobile — Algerian mobile phone store (Express + SQLite + React)"

ENV NODE_ENV=production \
    PORT=8084 \
    HOST=0.0.0.0 \
    DB_PATH=/data/store.db

WORKDIR /app/backend
COPY --from=api  /app/backend/node_modules ./node_modules
COPY backend/package.json ./package.json
COPY backend/src ./src
# backend/src/server.js resolves the storefront at ../../frontend/dist
COPY --from=web /app/frontend/dist /app/frontend/dist

# SQLite lives on a mounted volume so orders survive a rebuild
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 8084
CMD ["node", "src/server.js"]