# Map and discovery

## User experience

- Public users can open `/` and browse bike parks without signing in.
- Optional query `?park=<bike-park-id>` opens that park’s detail panel on load (used when returning from the review editor).
- The homepage is a full-screen map (`100dvh`) with park markers from Postgres.
- Signed-in users: pick a **calendar day** in the top chrome; **mates** who planned a ride at a park that day are reflected on markers (count label + emphasis). See [Mates, invites, and ride plans](./social-and-ride-plans.md).
- The top chrome includes a **Map | Mates** switch (`/` vs `/mates`). If you are not signed in, **Mates** still goes to `/mates`, which explains that you need to sign in or create an account before you can use mates.
- Selecting a marker loads park details in a panel:
  - Mobile: full-screen panel.
  - Desktop: side panel with map still visible.
  - Signed-in: the **Mates riding here** card lists **you** and **mates** with **upcoming** plans at that park (name + date per row; **You** can remove your plan for a day). **I’m riding here** opens a date picker to save your own plan (today or a future day). Map **day** in the chrome still drives **marker** mate counts for that calendar day.

## Main flow

1. `app/(marketing)/page.tsx` renders `HomeMapLoader`.
2. `HomeMapLoader` dynamically imports the client map to keep Google Maps browser-only.
3. The map fetches marker data from `GET /api/bike-parks`.
4. Marker rendering is handled by `replaceBikeParkMarkersOnMap`.
5. Selecting a park fetches full details from `GET /api/bike-parks/[id]`.

## Marker behavior

- Marker icon priority:
  1. `pinLogoUrl`
  2. `logoUrl`
  3. orange circle (when mate count applies but no logo)
- Logo images are **round** markers: a DOM overlay (`OverlayView`) clips each logo with CSS (`border-radius` + `object-fit: cover`) and a light ring, so cross-origin logos stay circular even when canvas export would fail (e.g. CORS).
- When the mate overlay applies, the marker shows a **label** with the number of mates riding there that day and a higher z-index.
- Marker fetches use abort signals so stale responses are ignored during quick navigation/remounts.

## UI surfaces

- `components/map/shred-map.tsx`: map state, selection, detail fetch lifecycle.
- `components/map/park-detail-panel.tsx`: park detail panel and role-based actions.
- `components/map/map-chrome.tsx`: top navigation/auth actions.
- `components/map/replace-bike-park-markers.ts`: marker replacement/diffing logic.

## Related docs

- [Mates, invites, and ride plans](./social-and-ride-plans.md)
- [Bike park management API and staff UI](./bike-park-management.md)
- [Park reviews](./reviews.md)
- [Environment and operations](../reference/environment-and-operations.md)
