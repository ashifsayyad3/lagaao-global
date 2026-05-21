FROM node:20-alpine AS base
WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS dev-deps
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# ─── Build ────────────────────────────────────────────────────
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Production runner ────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production PORT=4200

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 lagaao

# Only copy SSR server + static browser assets — no build toolchain
COPY --from=builder --chown=lagaao:nodejs /app/dist/frontend/server  ./dist/frontend/server
COPY --from=builder --chown=lagaao:nodejs /app/dist/frontend/browser ./dist/frontend/browser
COPY --from=deps    --chown=lagaao:nodejs /app/node_modules          ./node_modules
COPY --chown=lagaao:nodejs package.json ./

USER lagaao
EXPOSE 4200

CMD ["node", "dist/frontend/server/server.mjs"]
