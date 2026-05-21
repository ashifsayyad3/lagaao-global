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
ENV NODE_ENV=production

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 lagaao

COPY --from=builder --chown=lagaao:nodejs /app/dist        ./dist
COPY --from=deps    --chown=lagaao:nodejs /app/node_modules ./node_modules
COPY --chown=lagaao:nodejs package.json ./

USER lagaao
EXPOSE 3000

# Graceful shutdown: node handles SIGTERM
CMD ["node", "dist/app.js"]
