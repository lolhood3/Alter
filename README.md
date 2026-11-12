# ALTER 1.0

A local-first Next.js application built around the Living Core: seven mode configurations, eight operational Core states, MATCH check-ins, SHIFT directions, Reality Shift transitions, Echoes, Timeline Rewind, Inner Universe, Dreamscape, settings, and ALTER Command.

## Architecture

- **Next.js App Router, React, and TypeScript** provide the routes and application shell.
- **Three.js/GLSL** renders the shared Living Core. A layered CSS/SVG/canvas environment supplies each mode's lighting and particles. WebGL has a CSS fallback.
- **Zustand** manages application state. Mode, environment, settings, and Echoes persist in browser `localStorage` under `alter.v1`; conversations and transition state are session-only.
- **Drizzle ORM and PostgreSQL are optional infrastructure.** There are currently no database tables or product-data queries. The only database consumer is `GET /api/health`.
- Fonts are self-hosted through Fontsource, so production builds do not need to contact Google Fonts.

## Run locally

```sh
npm ci
npm run dev
```

No environment variables are required. Open the local URL printed by Next.js.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The tests cover the optional-database health contract, modal and radio-group keyboard behavior, fixed MATCH/SHIFT configuration logic, persisted-state repair, unavailable storage, and reset timer cancellation.

## Health and optional PostgreSQL

With no `DATABASE_URL`, `GET /api/health` returns HTTP 200:

```json
{ "ok": true, "database": "not_configured" }
```

This is a healthy state for the current local-first MVP, not disabled product functionality. When `DATABASE_URL` is set, the endpoint lazily creates a PostgreSQL pool and executes `select 1`. It returns `database: "connected"` on success, or HTTP 503 with `database: "unavailable"` if the configured database cannot be reached. Database initialization never runs during module import or build-time page-data collection.

To enable that optional check on Vercel:

1. Provision PostgreSQL with any Vercel-compatible provider.
2. In **Project Settings → Environment Variables**, add `DATABASE_URL` as the provider's PostgreSQL connection URI for the intended environments. Include SSL parameters required by that provider.
3. Redeploy. Do not use a local or placeholder URI in production.

No schema migration is needed for the MVP. `drizzle.config.json` retains a local-development PostgreSQL URL for future schema work; it is not used by the application build. Copy `.env.example` to `.env.local` only if you are developing database-backed functionality.

## Deployment

The project uses Next.js defaults and has no custom Vercel configuration. `npm run build` is the production build command. `DATABASE_URL` is not a deployment requirement unless the optional database health check is desired.

Real browser/WebGL rendering still depends on the device and browser. The Living Core uses a fallback when WebGL initialization or its context is unavailable.
