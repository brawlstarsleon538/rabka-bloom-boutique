# syntax=docker/dockerfile:1

# ---------- build ----------
# Debian-based Bun image: the repo ships bun.lock, and glibc avoids surprises
# with rolldown's native bindings.
FROM oven/bun:1 AS builder
WORKDIR /app

# Manifests first so the dependency layer survives source-only changes.
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_* values are inlined into the client bundle while it builds, so they have
# to exist here. Supplying them only at runtime leaves the browser with no
# Supabase credentials. Railway forwards service variables to declared ARGs.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

RUN bun run build

# ---------- runtime ----------
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Nitro's node-server preset reads HOST/PORT. Binding 0.0.0.0 is required for
# Railway to reach the container; Railway overrides PORT at runtime.
ENV HOST=0.0.0.0
ENV PORT=8080

# The node-server build is a self-contained bundle (server, client assets and
# the handful of traced modules), so the runtime image needs no install step.
COPY --from=builder --chown=node:node /app/.output ./.output

USER node
EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
