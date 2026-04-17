# Social mates, ride plans, and map overlay (plan)

## Context (current codebase)

- **Identity**: [`lib/db/queries.ts`](../../lib/db/queries.ts) `getUser()` maps WorkOS `withAuth()` → local [`users`](../../lib/db/schema.ts) via `workOsUserId`. Authenticated API routes follow the reviews pattern ([`app/api/bike-parks/[id]/reviews/route.ts`](../../app/api/bike-parks/[id]/reviews/route.ts)).
- **Map markers**: [`components/map/replace-bike-park-markers.ts`](../../components/map/replace-bike-park-markers.ts) builds one `google.maps.Marker` per park from [`BikeParkMapPoint`](../../lib/bike-parks/fetch-bike-parks-for-map.ts) (id, name, lat, lng, logos). No per-viewer overlay today.
- **Naming collision**: [`invitations`](../../lib/db/schema.ts) is **organization/team** invites — friend flow needs **new tables** (e.g. `friend_invitations`, `friendships`) to avoid confusion and wrong joins.

## Data model

**1. `friend_invitations`**

- `id` (serial PK), `inviter_user_id` → `users.id`, `invitee_user_id` → `users.id`, `status` (`pending` | `accepted` | `rejected` | `cancelled`), `created_at`, `responded_at` (nullable).
- Check: `inviter_user_id != invitee_user_id`.
- Uniqueness: partial unique index on `(inviter_user_id, invitee_user_id)` where `status = 'pending'`.
- MVP: invitee must already exist in `users`; invites by **email** resolve to `users.email` (normalized compare); if no row, return clear 404/422 — document as limitation.

**2. `friendships` (symmetric)**

- Canonical pair: `user_low_id`, `user_high_id` with `user_low_id < user_high_id`, composite PK.
- Created when an invite transitions to `accepted` (transaction: update invite + insert friendship).

**3. `ride_plans`**

- `user_id`, `ride_on` (PostgreSQL `date`), `bike_park_id` (uuid FK → `bike_parks.id`), timestamps.
- MVP: `UNIQUE (user_id, ride_on)` — one park per user per calendar day.

**Privacy**: counts and friend lists only for **accepted** friendships. Anonymous map users see no overlay.

Schema + migration + [`docs/shredmap/reference/data-model.md`](../../docs/shredmap/reference/data-model.md).

## Server API (REST)

Use `getUser()` / `withAuth()` — any signed-in user with a local `users` row (same bar as `/account`).

| Method | Route | Purpose |
|--------|--------|--------|
| `GET` | `/api/friends` | List accepted friends. |
| `POST` | `/api/friends/invitations` | Body `{ email }` — create pending invite. |
| `GET` | `/api/friends/invitations` | `{ incoming, outgoing }`. |
| `POST` | `/api/friends/invitations/[id]/accept` | Accept (+ friendship). |
| `POST` | `/api/friends/invitations/[id]/reject` | Reject. |
| `DELETE` | `/api/friends/invitations/[id]` | Cancel outgoing pending. |

**Ride plans**

| Method | Route | Purpose |
|--------|--------|--------|
| `GET` | `/api/ride-plans?date=YYYY-MM-DD` | Viewer’s plan for that day. |
| `PUT` | `/api/ride-plans` | Upsert `{ date, bikeParkId }`. |
| `DELETE` | `/api/ride-plans?date=YYYY-MM-DD` | Clear plan. |
| `GET` | `/api/ride-plans/mates-on-map?date=YYYY-MM-DD` | `{ counts: Record<parkId, number> }` for mates. |

Zod schemas alongside existing API schema patterns.

## Routes and navigation: Map vs Mates

- **Map** stays on the **homepage** [`/`](../../app/(marketing)/page.tsx) (or current map entry) — full-screen map as today.
- **Mates** (invites inbox/outbox, mates list, no DMs) lives on a **dedicated route**: **`/mates`**, implemented under [`app/(app)/mates/`](../../app/(app)/) so `withAuth({ ensureSignedIn: true })` from the app layout applies.

**Primary switch: the shredmap chrome button**

- In [`components/map/map-chrome.tsx`](../../components/map/map-chrome.tsx), the **left branded pill** (Mountain icon + “shredmap” text, `pointer-events-auto`) is the **mode switch** between Map and Mates:
  - Refactor that cluster into a **two-segment control** (or two clear `Link` targets inside one pill): **Map** → `/`, **Mates** → `/mates`.
  - Use `usePathname()` (or equivalent) to show **active** styling on the current segment (`/` vs `/mates`).
  - **Signed-out users**: only Map is relevant; either hide the Mates segment or show Mates as a link that hits `(app)` and redirects to sign-in (match existing auth UX for protected routes).
  - **Do not** rely on a duplicate “Mates” entry only inside the hamburger menu for primary navigation — the **shredmap pill** is the main switch (dropdown can still include a Mates link for consistency if useful).

**Mates page layout**

- Full-width content under app shell (reuse [`AppHeader`](../../components/app/app-header.tsx) on `(app)` routes). If the mates page should **not** duplicate the floating `MapChrome`, either omit `MapChrome` on `/mates` or render a **shared top bar** component used by both map and mates that contains the same shredmap switch — prefer one implementation so the switch is identical on map and mates views.

## Map and client UX

- Extend [`BikeParkMapPoint`](../../lib/bike-parks/fetch-bike-parks-for-map.ts) with optional `matesRidingCount`.
- [`ShredMap`](../../components/map/shred-map.tsx): date picker (signed-in), merge counts from `/api/ride-plans/mates-on-map`, update [`replaceBikeParkMarkersOnMap`](../../components/map/replace-bike-park-markers.ts) for distinct styling when count > 0.
- [`ParkDetailPanel`](../../components/map/park-detail-panel.tsx): “I’m riding here” for selected date when logged in.

## Documentation

- New [`docs/shredmap/features/social-and-ride-plans.md`](../../docs/shredmap/features/social-and-ride-plans.md): routes (`/`, `/mates`), chrome switch behavior, API, privacy, limits.
- Update [`docs/shredmap/index.md`](../../docs/shredmap/index.md), data-model reference, [`AGENTS.md`](../../AGENTS.md) key files.

## Out of scope

- DMs, inviting non-users, push notifications.

## Implementation todos

1. Schema + migration + data-model docs  
2. Queries + API routes + Zod  
3. Map overlay + markers + park panel CTA  
4. **`/mates` page + shredmap pill as Map/Mates switch (pathname-aware)**  
5. Wiki + AGENTS updates  
