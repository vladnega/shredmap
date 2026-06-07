# Park Requests

Park Requests (PRs) let community members propose bike park data changes while keeping live edits moderated by staff.

## Who can do what

- **Anonymous user**: can view parks and details, but cannot submit Park Requests.
- **Member** (`member`): can submit Park Requests for:
  - amendments to an existing park
  - a brand-new park proposal
- **Admin / moderator**: can review all Park Requests, edit proposed payloads, and approve/reject.

## Member submission flow

- Submit amendment: `/(app)/bike-parks/[parkId]/park-request`.
- Submit new park: `/(marketing)/bike-parks/park-request/new`.
- Both flows use a two-column layout on large screens: a **reference column** mirrors the public park detail panel (amendments show the live listing plus review summary, map embed, trail pills with icons, facilities, and links; new-park proposals show a **live preview** from the form). The location block uses the shared `BikeParkLocationPicker` (about **60% viewport height**; tap/click map or drag the pin) when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set, and falls back to an embedded map preview otherwise.
- **Logo fields** (`Logo`, `Pin logo`): default to **Upload** (JPEG/PNG/WebP, resized client-side then on the server to WebP). Toggle **URL** to paste an external `https://` link instead. Uploads go to **Vercel Blob** via `POST /api/uploads/park-image`; the returned public URL is stored in `proposedPatch` like any other logo URL. Requires Vercel Blob env vars (OIDC: `BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`, or legacy `BLOB_READ_WRITE_TOKEN`; 503 if missing).
- Staff review uses the same `BikeParkFields` component as the park editor, with an optional **review** mode: status dots per section and “Show previous” vs the live park (amendments) or empty baseline (new parks).
- New-park `proposedPatch` includes `payment` (`paid` \| `free`); approving a new park persists it to `bike_parks.payment`.
- API write endpoint: `POST /api/park-requests`.
- Optional member history endpoint: `GET /api/park-requests/mine`.

All submissions require signed-in role slugs that can author park reviews (`member`, `admin`, `moderator`) via `requireBikeParkReviewAuthor()`.
When signed out, the new-park page shows an explanation card and a sign-in CTA instead of redirecting immediately.

## Staff review flow

- Queue route: `/(app)/admin/park-requests`.
- Detail route: `/(app)/admin/park-requests/[requestId]` — same wide two-column layout as member submission (listing preview or current listing in the sidebar, editable fields and approve/reject actions in the main column; no card wrapper).
- Queue/list API: `GET /api/admin/park-requests`.
- Detail/edit API: `GET/PATCH /api/admin/park-requests/:id`.
- Resolve API:
  - `POST /api/admin/park-requests/:id/approve`
  - `POST /api/admin/park-requests/:id/reject`

Only staff role slugs (`admin`, `moderator`) can review or resolve.

## Approval semantics

- **Approve** auto-applies to live `bike_parks` data:
  - amendment PR -> applies patch to target park
  - new-park PR -> inserts a new park
- Staff can edit the proposed payload first (`PATCH /api/admin/park-requests/:id`) before approving.
- **Reject** closes the PR without mutating live park data.

## Data model

`bike_park_requests` stores:

- request type (`amendment` | `new_park`)
- status (`pending` | `approved` | `rejected`)
- requester, optional target park, proposed payload JSON, reviewer metadata
- timestamps for created/updated/reviewed

See `lib/db/schema.ts` and migration `lib/db/migrations/0011_park_requests.sql`.
