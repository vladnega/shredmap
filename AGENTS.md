# Shredmap — agent instructions

This document captures the **product vision** and **technical guardrails** for automated agents (and humans) working on this repository.

**Longer reference (routes, APIs, env, data):** [`docs/shredmap.md`](docs/shredmap.md). Update that doc (and this file when vision/key paths change) whenever you ship or materially change a feature — see `.cursor/rules/keep-docs-up-to-date.mdc`.

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
- **User sync**: OAuth callback runs `syncWorkOsUserToDatabase` so every WorkOS user gets a row in `users` (`work_os_user_id`) for app data (reviews, roles, etc.).

### Logged-in capabilities (vision)

| Capability | Who |
|------------|-----|
| **Post reviews** for a park | Any signed-in user |
| **Add / edit bike parks** | **Moderators** only (`users.role` or a dedicated moderator flag — align on one approach as the app evolves) |

The intent is **community maintenance**: the map and directory improve through contributions, with trusted moderators curating structure and quality.

### Non-goals / constraints for agents

- **Do not** replace the map with a non–Google Maps implementation unless the product owner asks — the Google Maps JS API is a deliberate choice.
- **Do not** require login for viewing the map or park details.
- **Prefer mobile UX** when tradeoffs appear between phone and desktop.
- **Keep changes focused** on the requested task; avoid drive-by refactors across unrelated boilerplate unless the task requires it.

## Key files and areas

| Area | Location |
|------|----------|
| Map UI | `components/map/` (`shred-map.tsx`, `park-detail-panel.tsx`, `map-chrome.tsx`, `home-map-loader.tsx`) |
| Bike park API | `app/api/bike-parks/`, `lib/db/queries.ts` (`listBikeParkMarkers`, `getBikeParkById`) |
| Schema | `lib/db/schema.ts` — `bikeParks`, `parkReviews`, `users.workOsUserId` |
| Seed bike parks | `data/bike-parks.seed.json` + `lib/bike-parks/seed-from-json.ts`, invoked from `lib/db/seed.ts` |
| WorkOS callback | `app/callback/route.ts`, `lib/auth/sync-workos-user.ts` |
| WorkOS env | `lib/auth/workos-env.ts` — `assertWorkOsConfigured()` |
| Request proxy (WorkOS) | `proxy.ts` — WorkOS `authkitProxy` |

## Environment variables

See `.env.example`. Minimum for the full vision:

- `POSTGRES_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- WorkOS (required): `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI` (must match the WorkOS dashboard and the `/callback` route)

## Follow-up work (not necessarily implemented yet)

- Review submission UI and API (authenticated).
- Moderator-only CRUD for `bike_parks` (admin routes + UI).
- Richer opening hours editing, image uploads, and moderation workflows.
When in doubt, re-read this file and match existing patterns in the codebase before introducing new abstractions.
