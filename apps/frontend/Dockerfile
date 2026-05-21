FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/dist/frontend/server ./dist/frontend/server
COPY --from=builder /app/dist/frontend/browser ./dist/frontend/browser
COPY --from=deps    /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 4200
CMD ["node", "dist/frontend/server/server.mjs"]
