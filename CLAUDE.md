# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Lagaao.com** — AI-powered multi-category ecommerce + marketplace platform.
Monorepo: `apps/frontend` (Angular 19, SSR, PWA) + `apps/backend` (Node.js/Express/TypeScript) + `libs/`.

## Commands

### Root
```bash
npm run dev          # start both frontend and backend concurrently
npm run docker:up    # start MySQL + Redis via Docker
npm run db:migrate   # run Sequelize migrations
npm run db:seed      # seed database
```

### Frontend (`apps/frontend`)
```bash
npm run dev          # Angular dev server on :4200 (ng serve)
npm run build        # production SSR build
npm run test         # Jest unit tests
ng generate component shared/components/foo --standalone  # new component
ng generate service core/services/bar                     # new service
```

### Backend (`apps/backend`)
```bash
npm run dev          # tsx watch (hot reload) on :3000
npm run build        # tsc compile to dist/
npm run start        # run compiled dist/app.js
npm run test         # Jest
```

## Architecture

### Frontend
- **Standalone components only** — no NgModules anywhere.
- **Lazy loading** via `loadComponent` / `loadChildren` in `app.routes.ts`. Every feature has its own routes file.
- **Signals** for local and global state (`signal`, `computed`, `effect`). No NgRx in Phase 1.
- **Core services** live in `src/app/core/services/` and are `providedIn: 'root'`.
- **Layouts**: `MainLayoutComponent` wraps public pages; `AuthLayoutComponent` wraps `/auth/*`. Both declared in `app.routes.ts` as parent routes.
- **Design system**: all shared UI in `src/app/shared/components/` (standalone, `ChangeDetectionStrategy.OnPush`). Use `lg-button`, `lg-badge`, `lg-skeleton`, `lg-toast-container`.
- **Tailwind** is v3. Design tokens live in `src/styles/_tokens.scss` as CSS custom properties. Always prefer token variables (`var(--color-primary)`) over hardcoded colors in component SCSS.
- **Angular Material** uses the custom M2 theme defined in `src/styles.scss`. Import only the specific Material modules needed per component.

### Backend
- Module structure: `src/modules/<name>/{routes,controller,service,validator}.ts`
- All routes return via helpers in `src/shared/utils/response.util.ts` (`ok`, `created`, `paginated`, `fail`).
- Environment config validated via Zod at startup (`src/config/env.ts`). Never read `process.env` directly elsewhere.
- Error handling: throw `AppError` from services; `errorHandler.middleware.ts` catches it. Sequelize validation errors are caught automatically.
- Soft deletes enabled globally via `paranoid: true` in Sequelize config.
- Rate limiting: `globalRateLimit` (300/15min), `authRateLimit` (10/15min), `apiRateLimit` (60/1min).

### Database
- MySQL 8 via Sequelize ORM. All models import from `src/models/index.ts`.
- Migrations in `migrations/`, seeders in `seeders/`, run via `sequelize-cli`.
- `underscored: true` — all columns use snake_case in DB, camelCase in JS.

### Key conventions
- Component selector prefix: `lg-` (e.g., `lg-button`, `lg-product-card`).
- API versioning: all routes under `/api/v1/`.
- JWT: 15-minute access tokens + 7-day refresh tokens in httpOnly cookies. Logout blocks token in Redis.
- Shared TypeScript interfaces live in `libs/shared-types/src/index.ts`.
- Redis caching: use `cached(key, fetcher, ttl)` from `shared/utils/cache.util.ts`. Invalidate on writes.
- XSS sanitizer runs on every request body/query before route handlers.

### Deployment
```bash
# Production compose (needs .env.production)
docker compose -f docker-compose.prod.yml up -d

# PM2 (non-Docker)
cd apps/backend && npm run build && npx pm2 start ecosystem.config.cjs --env production

# Run DB migrations in prod
npx sequelize-cli db:migrate --env production
```

Nginx config: `nginx/nginx.conf` — reverse proxy on 80/443, SSL termination, gzip, Nginx cache for static assets (7d) and API GETs (30s).
CI/CD: `.github/workflows/ci.yml` (lint+build on every PR) + `.github/workflows/deploy.yml` (SSH deploy on main push).
