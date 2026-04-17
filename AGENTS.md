# Shredmap — agent instructions

This document captures the **product vision** and **technical guardrails** for automated agents (and humans) working on this repository.

**Longer reference (routes, APIs, env, data):** [`docs/shredmap/index.md`](docs/shredmap/index.md). Update the relevant feature/reference wiki page(s) (and this file when vision/key paths change) whenever you ship or materially change a feature — see `.cursor/rules/keep-docs-up-to-date.mdc`.

## What we are building

**Shredmap** is a community-maintained website for discovering **UK mountain bike parks**. The experience centers on a **full-screen interactive map** (Google Maps JavaScript API) with **pins for every park** stored in **Postgres**. Users can explore **without logging in**.

### Public experience (no auth)

- **Homepage**: map fills the viewport (`100dvh`); parks appear as markers from the database.
- **Tap/click a pin**: show park details — name, logo, facilities, opening hours (when present), ratings, links, etc.
- **Layout**: **mobile-first**. On **narrow viewports**, details appear as a **full-screen** panel. On **desktop**, details use a **side panel** so the map stays visible.
- **Visual direction**: **dark mode**, modern, energetic — think **extreme sports / Red Bull** energy: bold typography, motion, gradients, and purposeful animation — without sacrificing readability or performance.

### Data sources

- **Bike parks** are loaded from **Postgres**. Initial rows come from a **one-off data export** you maintain: replace `data/bike-parks.seed.json` with your downloaded/transformed dataset and run `pnpm db:seed` (the repo ships a tiny placeholder so the map has something to render).
- **Postgres** is the source of truth for map markers and app features (`bike_parks`, `park_reviews`, `users`, …).

### Authentication (WorkOS + AuthKit)

- **WorkOS** is the only sign-in path: **AuthKit** hosted UI, **`assertWorkOsConfigured()`** in `lib/auth/workos-env.ts` fails fast if required env vars are missing (no legacy login).
- **Social logins**: **Google OAuth** and **Instagram** (configured in the WorkOS dashboard alongside AuthKit).
- **Session**: `@workos-inc/authkit-nextjs` — callback at `/callback`, `authkitProxy` in `proxy.ts`, `AuthKitProvider` in the root layout.
- **User sync**: OAuth callback runs `syncWorkOsUserToDatabase` so every WorkOS user gets a row in `users` (`work_os_user_id`) for app data (reviews, linking, etc.).
- **AuthZ ownership**: WorkOS is the source of truth for roles and permissions. Do not store user authorization roles in Postgres; resolve them from WorkOS (session and/or WorkOS membership APIs) at request time.

### Logged-in capabilities (vision)

| Capability | Who |
|------------|-----|
| **Mates, ride plans, map mate overlay** | Any signed-in user with a synced `users` row (`/mates`, `/api/friends`, `/api/ride-plans`) |
| **Post reviews** for a park | WorkOS roles `member`, `admin`, or `moderator` |
| **Add / edit / delete bike parks** | **Admin** or **moderator** WorkOS role slugs (see `lib/auth/bike-park-staff-roles.ts`; enforced on API routes) |

The intent is **community maintenance**: the map and directory improve through contributions, with trusted moderators curating structure and quality.

### Non-goals / constraints for agents

- **Do not** replace the map with a non–Google Maps implementation unless the product owner asks — the Google Maps JS API is a deliberate choice.
- **Do not** require login for viewing the map or park details.
- **Prefer mobile UX** when tradeoffs appear between phone and desktop.
- **Keep changes focused** on the requested task; avoid drive-by refactors across unrelated boilerplate unless the task requires it.

### Integration guardrails (agents)

- For **WorkOS** or other third-party auth/authz SDK changes, validate fields and payload shapes against the **installed SDK types** in `node_modules` before coding.
- Use the relevant skill references (for WorkOS: `workos` skill + the matching `references/*.md`) and prefer canonical SDK/session fields over guessed JSON shapes.
- If docs and runtime types differ, treat the installed SDK types as the implementation contract and document any discrepancy in `docs/shredmap/`.
- Do **not** cast objects (`as SomeObject`, `as Record<...>`, `as unknown as ...`) to force a shape. Use real types, inference, destructuring, and type guards instead.
- If an object cast seems unavoidable, stop and ask the user for permission before adding it.

## Key files and areas

| Area | Location |
|------|----------|
| Map UI | `components/map/` (`shred-map.tsx`, `park-detail-panel.tsx`, `map-chrome.tsx`, `home-map-loader.tsx`) |
| Mates and ride plans | `app/(mates)/mates/`, `app/(marketing)/mates/join/[token]/`, `components/mates/`, `lib/social/`, `app/api/friends/`, `app/api/ride-plans/` |
| Bike park API | `app/api/bike-parks/`, staff auth `lib/auth/bike-park-staff.ts`, `lib/db/queries.ts` |
| Park reviews | `components/reviews/`, `app/(app)/bike-parks/[parkId]/review/`, `app/api/bike-parks/[id]/reviews/` |
| Staff bike park UI | `app/(app)/admin/bike-parks/` |
| Schema | `lib/db/schema.ts` — `bikeParks`, `parkReviews`, `friendInvitations`, `friendships`, `mateInviteLinks`, `ridePlans`, `users.workOsUserId` |
| Seed bike parks | `data/bike-parks.seed.json` + `lib/bike-parks/seed-from-json.ts`, invoked from `lib/db/seed.ts` |
| WorkOS callback | `app/callback/route.ts`, `lib/auth/sync-workos-user.ts` |
| WorkOS env | `lib/auth/workos-env.ts` — `assertWorkOsConfigured()` |
| Request proxy (WorkOS) | `proxy.ts` — WorkOS `authkitProxy` |

## Environment variables

See `.env.example`. Minimum for the full vision:

- `POSTGRES_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- WorkOS (required): `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI` (must match the WorkOS dashboard and the `/callback` route)

## Follow-up work (not necessarily implemented yet)

- Richer opening hours editing, image uploads, and moderation workflows.
When in doubt, re-read this file and match existing patterns in the codebase before introducing new abstractions.

## Cursor Cloud specific instructions

### Services overview

| Service | How to run | Notes |
|---------|-----------|-------|
| Next.js dev server | `pnpm dev` | Runs on port 3000 with Turbopack |
| Postgres (Neon) | Hosted — no local setup | Uses `@neondatabase/serverless` HTTP driver; `POSTGRES_URL` env var |

### Key commands

See `README.md` → Scripts table for all commands. Quick reference:

- **Dev server:** `pnpm dev` (Turbopack, port 3000)
- **Type check:** `npx tsc --noEmit`
- **Tests:** `pnpm test` (Vitest)
- **Build:** `pnpm build`
- **DB migrate:** `pnpm db:migrate`
- **DB seed:** `pnpm db:seed` (fails gracefully if data already exists — duplicate-key errors are expected on re-runs)

### Non-obvious caveats

- **No ESLint**: the project has no lint script or ESLint config. Use `npx tsc --noEmit` as the primary static analysis step.
- **WorkOS env vars are required at startup**: `proxy.ts` calls `assertWorkOsConfigured()` at module-import time, and the root layout also calls it. The dev server will crash if `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, or `NEXT_PUBLIC_WORKOS_REDIRECT_URI` are missing.
- **`.env` file must be created from environment secrets**: copy `.env.example` and populate from environment variables. The `.env` file is gitignored.
- **pnpm build scripts**: `package.json` includes `pnpm.onlyBuiltDependencies` to allow `@tailwindcss/oxide`, `esbuild`, and `sharp` native builds without interactive approval.
- **Database is Neon-only**: the Drizzle connection in `lib/db/drizzle.ts` uses `@neondatabase/serverless` (HTTP driver). A standard local `pg` connection will not work without code changes.
- **Seed is not idempotent**: `pnpm db:seed` inserts rows without upsert logic — re-running on a seeded database fails with duplicate-key errors. This is harmless; the data is already present.
