# Mates, invites, and ride plans

Signed-in users can connect as **mates** (friends), see **where mates plan to ride** on a chosen **calendar day** on the map, and record their own **ride plan** (one park per day).

There is **no direct messaging** between mates in this version.

## Who can use it

Any user with a synced `users` row (WorkOS sign-in) can send and manage mate invites and ride plans. This is separate from **review-writing** roles (`member` / `admin` / `moderator`).

## Routes and UI

| Route | Purpose |
|-------|---------|
| `/` | Full-screen map. Signed-in: choose a **day** in the top chrome; pins show how many **mates** plan to ride at each park that day. Opening a park shows **mates riding here** with **each mate’s name and ride date** (today and future plans at that park), plus **I’m riding here** to set your own plan. |
| `/mates` | Mates hub: **your mates** list (with **where each mate plans to ride** on a chosen calendar day), plus **shareable invite link**. Signed-out visitors see an explanation and **Sign in** / **Create account** (both return here after AuthKit). |
| `/mates/join/[token]` | **Public** landing for a shareable invite. Recipients can **sign up** or **sign in** (AuthKit `returnTo` brings them back here), then **become mates** — **no prior account required**. |

The **map chrome** (floating header on the map and mates views) includes a **Map | Mates** switch next to the shredmap branding so you can move between the two. If you are not signed in, **Mates** opens `/mates`, which explains that you need an account and offers **Sign in** or **Create account** (no bare redirect to AuthKit).

## Mate invites

### Shareable link

- From **Mates**, you can create a **personal invite link** (rotating token, expiry). Share it anywhere (e.g. WhatsApp).
- **Recipients do not need an account first.** They open the link, choose **Create account** or **Sign in**, complete WorkOS AuthKit, return to the same URL with a session, then confirm **Become mates**.
- **Redirect safety**: `returnTo` is path-only (`/mates/join/...`) via `safeWorkOsReturnTo` — see `lib/auth/workos-redirect.ts`.
- Redeeming creates a **`friendships`** row. Any **pending** rows in `friend_invitations` between the two users are cleared when the link is redeemed.

The **product UI** only supports the **shareable link** for new invites. The `friend_invitations` table and related HTTP routes remain for data that may already exist and for potential future use; org/workspace **`invitations`** (teams) is unrelated.

Mate data lives in **`mate_invite_links`**, **`friendships`**, and (legacy/historical) **`friend_invitations`**.

## Ride plans

- A ride plan is **one bike park per calendar day per user** (`ride_on` as a PostgreSQL `date`, `YYYY-MM-DD` from the client). Rows are keyed by `(user_id, ride_on)`.
- The **calendar day** is whatever the user selects in the browser (local date picker). Document this for riders: “Saturday” means the date they picked, not a stored timezone.
- **Privacy**: only **accepted mates** are counted toward per-park totals for the viewer. Anonymous users see no mate overlay.
- From a park’s detail panel (signed-in), the **Mates riding here** card lists **you** and **mates** with an **upcoming** plan at that park (**today onward**), showing **name** (or **You** for yourself) and **date** per row. Your rows include **remove** (clears that day via `DELETE /api/ride-plans?date=`). **I’m riding here** opens a **calendar** (today and future only); saving sets or updates your plan for the **chosen day** (defaults to **today** when you open the picker).

## Map markers

When at least one mate has a plan at a park for the selected day, the marker shows a **numeric label** (count of distinct mates) and a higher **z-index** so it stands out. Parks with logos keep their logo icon; counts without a logo use an orange circle fallback.

## HTTP API (summary)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/friends` | List accepted mates. |
| `GET` | `/api/friends/invite-link` | Signed-in: current shareable link URL + expiry, or `null` / `needsRefresh`. |
| `POST` | `/api/friends/invite-link` | Signed-in: create or rotate link. |
| `GET` | `/api/friends/invite-link/preview?token=` | Public: `{ ok, inviterLabel? }` for the join page. |
| `POST` | `/api/friends/invite-link/redeem` | Body `{ "token" }`. Signed-in: add `friendships` row. |
| `GET` | `/api/ride-plans?date=YYYY-MM-DD` | Current user’s plan that day, if any. |
| `PUT` | `/api/ride-plans` | Body `{ "date", "bikeParkId" }`. |
| `DELETE` | `/api/ride-plans?date=YYYY-MM-DD` | Clear plan. |
| `GET` | `/api/ride-plans/mates-on-map?date=YYYY-MM-DD` | `{ "counts": { [bikeParkId]: number } }` for mates. |
| `GET` | `/api/ride-plans/mates-at-park?from=YYYY-MM-DD&bikeParkId=` | `{ "riders": [ { userId, name, email, rideOn, isViewer } ] }` — **you** and **mates** with a plan at that park on **ride_on ≥ from** (one row per person per day; `isViewer` marks your rows so the UI can offer **remove**). |
| `GET` | `/api/ride-plans/mates-for-day?date=YYYY-MM-DD` | `{ "plans": [ { mateId, name, email, bikeParkId, parkName } ] }` — each mate’s plan for that day. |

Signed-in session is required for mate management and ride plans. **Preview** is public; **redeem** requires a session (after sign-up, the new user has a `users` row from `syncWorkOsUserToDatabase`).

Absolute invite URLs use **`BASE_URL`** when set (see `.env.example`); otherwise the API falls back to the request origin.

**Legacy (not used by current UI):** `GET/POST /api/friends/invitations` and related accept/reject/cancel routes still exist for the `friend_invitations` table.

## Implementation pointers

- Schema: `lib/db/schema.ts` — `friendInvitations`, `friendships`, `mateInviteLinks`, `ridePlans`.
- Domain helpers: `lib/social/queries.ts`; invite-link redeem validates in route.
- Map overlay fetch: `lib/social/fetch-mates-on-map.ts`.
- Mates UI: `components/mates/mates-dashboard.tsx`, routes `app/(mates)/mates/`, `app/(marketing)/mates/join/[token]/`.

## Related docs

- [Data model](../reference/data-model.md)
- [Authentication and authorization](./auth-and-authorization.md)
- [Map and discovery](./map-and-discovery.md)
