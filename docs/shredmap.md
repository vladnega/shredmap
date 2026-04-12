# Shredmap — application documentation

**Shredmap** is a community-oriented site for discovering **UK mountain bike parks**. The main experience is a **full-screen Google Map** with database-backed markers; users can browse **without signing in**. The stack is **Next.js (App Router)**, **Postgres**, **Drizzle ORM**, **Tailwind CSS**, and **WorkOS AuthKit** (required — see `assertWorkOsConfigured()` in `lib/auth/workos-env.ts`).

---

## User-facing features

### Map (homepage)

- **Route:** `/` (`app/(marketing)/page.tsx`) loads `HomeMapLoader`, which dynamically imports the client map (`ssr: false`) so the Google Maps JS API only runs in the browser.
- **Markers:** Loaded from `GET /api/bike-parks` via `lib/bike-parks/fetch-bike-parks-for-map.ts`, which validates the JSON and passes points to `replaceBikeParkMarkersOnMap` (`components/map/replace-bike-park-markers.ts`). Requests respect **abort signals** so rapid navigation or remounts do not apply stale markers.
- **Selection:** Choosing a marker sets a selected park id; details are fetched from `GET /api/bike-parks/[id]` (`components/map/shred-map.tsx`).
- **Layout:** **Mobile-first** — narrow viewports use a **full-screen detail panel**; **desktop** uses a **side panel** so the map stays visible (`park-detail-panel.tsx`, `shred-map.tsx`).
- **Chrome:** Top bar with branding and sign-in (`map-chrome.tsx`). **`/sign-in`** and **`/sign-up`** are server routes that immediately redirect to WorkOS AuthKit via `getSignInUrl` / `getSignUpUrl` (`lib/auth/workos-redirect.ts`; optional `?redirect=` for return path).

### Authentication

**WorkOS AuthKit only** — required env vars are validated with **`assertWorkOsConfigured()`** (`lib/auth/workos-env.ts`); the app throws if they are missing. Hosted AuthKit flow; callback **`GET /callback`** (`app/callback/route.ts`) runs **`syncWorkOsUserToDatabase`** so each WorkOS user has a row in `users` (`workOsUserId`). Root **`proxy.ts`** runs **`authkitProxy`** from `@workos-inc/authkit-nextjs` (Next.js convention; replaces deprecated `middleware.ts`). The **`(app)`** layout uses **`withAuth({ ensureSignedIn: true })`** for `/dashboard`, `/account`, `/admin`, `/chat`. Configure OAuth providers (e.g. Google) in the **WorkOS dashboard**.

### Inherited starter surfaces

The repo still includes **marketing**, **catalog** (`/items`), **dashboard**, **account**, **admin**, and **AI chat** from the original boilerplate. See [`boilerplate.md`](./boilerplate.md) for route groups and patterns. Product focus for Shredmap is the **map + bike parks**; other areas may remain demos until extended.

---

## API routes (bike parks)

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/bike-parks` | Returns `{ parks }` with minimal fields for map markers (`listBikeParkMarkers` in `lib/db/queries.ts`). |
| `GET` | `/api/bike-parks/[id]` | Returns a full `bike_parks` row for the detail panel. |

Other JSON routes (`/api/user`, `/api/organization`, `/api/items`, `/api/ai/chat`, `/api/webhooks`, `/api/admin/items`) follow the boilerplate; protect or extend as needed.

---

## Data model (bike parks)

Table `bike_parks` (see `lib/db/schema.ts`) stores:

- Identity and position: `id` (UUID), `name`, `latitude`, `longitude`
- Presentation: `description`, `logoUrl`, `pinLogoUrl`, `galleryImageUrls`
- Trail stats: `trailCount`, `totalTrailLengthKm`
- Ratings: `ratingScore`, `ratingVoteCount`
- Facilities: `amenities` (JSON object of booleans)
- Links and business: `primaryCtaUrl`, `primaryCtaType`, `payment`, `status`
- **Opening hours:** `openingHours` (JSON)
- **Provenance:** `sourceUrl`
- Timestamps: `createdAt`, `updatedAt`

`park_reviews` links `bike_parks` to `users` with `rating` and `body` — intended for logged-in reviews; UI/API may be incomplete until built out.

---

## Seed data and imports

- **Seed file:** `data/bike-parks.seed.json` — replace or extend this file and run `pnpm db:seed` to refresh local DB rows (see `lib/bike-parks/seed-from-json.ts` and `lib/db/seed.ts`).
- **Postgres** is the source of truth for markers in production.

Historical context: early iterations referenced seeding from external MTB directory APIs; the maintained path for this repo is **JSON seed + migrations**, unless you add a new import script.

---

## Environment variables

See **`.env.example`** in the repo root. Highlights:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` or `DATABASE_URL` | Postgres connection string. **Neon:** set either variable to the string from the Neon dashboard (hosts end in `neon.tech`; the app uses Neon's HTTP driver on Vercel). For local Docker, see `pnpm db:setup`. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser key with **Maps JavaScript API** enabled (homepage map) |
| `BASE_URL` | Canonical URL (links, callbacks) |
| `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | WorkOS AuthKit (required; must match dashboard; redirect URI typically `…/callback`) |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Optional — `/chat` and `/api/ai/chat` |

### Vercel: “Development” vs hosted deploys

In the dashboard, **Development** is where you store variables for **local** work (`vercel env pull`, `vercel pull --environment=development`). It is **not** the same as a **Preview** deployment.

Hosted test URLs always come from **Preview** (`vercel deploy` without `--prod`) or **Production** (`vercel deploy --prod`), unless you add a **custom environment**.

`vercel deploy --target development` fails with *Custom environment not found* because the CLI treats any target other than `production` / `preview` as a **custom environment slug**, and the built-in Development bucket is not a deployable custom environment in that API.

**To get a stable hosted URL that uses the same secrets as Development:**

1. In Vercel: **Project → Settings → Environments → Create environment**.
2. Choose a slug (this repo assumes **`dev`**) and set **type** / options so it matches your workflow; use **Import variables from → Development** (or copy them) so keys match what you use locally.
3. Deploy from the repo root:

   `pnpm vercel:deploy:dev`

   (runs `vercel deploy --target dev`.)

If you prefer another slug, change the script in `package.json` or run `vercel deploy --target <your-slug> -y`.

Until that custom environment exists, use **`vercel deploy --target preview`** (or plain `vercel deploy`) for a hosted Preview deployment using **Preview**-scoped variables.

---

## Key source locations

| Area | Path |
|------|------|
| Map UI | `components/map/` — `shred-map.tsx`, `park-detail-panel.tsx`, `map-chrome.tsx`, `home-map-loader.tsx`, `replace-bike-park-markers.ts` |
| Client fetch helpers | `lib/bike-parks/fetch-bike-parks-for-map.ts` |
| DB queries | `lib/db/queries.ts` — `listBikeParkMarkers`, `getBikeParkById`, user/org helpers |
| Schema | `lib/db/schema.ts` — `bikeParks`, `parkReviews`, `users` |
| WorkOS sync | `lib/auth/sync-workos-user.ts`, `lib/auth/workos-env.ts` |
| Request proxy (WorkOS) | `proxy.ts` — `authkitProxy` |

---

## Planned / follow-up (from product notes)

Document these in this file when they ship:

- Review submission (authenticated) and listing on park detail
- Moderator-only create/update for `bike_parks`

---

## Related reading

- [`AGENTS.md`](../AGENTS.md) — short agent-oriented vision and constraints
- [`boilerplate.md`](./boilerplate.md) — starter layout and customization
- [`.env.example`](../.env.example) — full env list
