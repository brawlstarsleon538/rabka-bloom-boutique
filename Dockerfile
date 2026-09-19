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

# No build arguments are needed: all data access goes through server functions,
# so nothing secret is inlined into the client bundle and DATABASE_URL is only
# read at runtime.
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
