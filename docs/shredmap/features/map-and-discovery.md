# Map and discovery

## User experience

- Public users can open `/` and browse bike parks without signing in.
- Optional query `?park=<bike-park-id>` opens that park’s detail panel on load (used when returning from the review editor).
- The homepage is a full-screen map (`100dvh`) with park markers from Postgres. Native Google Maps UI (zoom/fullscreen controls) uses the **dark** color scheme. Built-in Google POI markers (shops, hospitals, etc.) are **not clickable** — only bike park markers open Shredmap detail UI.
- Signed-in users: pick a **calendar day** in the top chrome; **mates** who planned a ride at a park that day are reflected on markers (count label + emphasis). See [Mates, invites, and ride plans](./social-and-ride-plans.md).
- The top chrome includes a **Map | Mates** switch (`/` vs `/mates`). If you are not signed in, **Mates** still goes to `/mates`, which explains that you need to sign in or create an account before you can use mates.
- **Search:** below the day picker in the top-left chrome (magnifying glass) expands into a name filter. Matching parks appear in a list; choosing one pans/zooms the map to that park and highlights its marker (without opening the detail panel). When not signed in (no day picker), search sits below the Map | Mates switch.
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
- Search selection **highlights** the chosen marker (bounce + larger orange circle, or glow/scale on logo overlays) until the panel is closed or another park is selected.
- Marker fetches use abort signals so stale responses are ignored during quick navigation/remounts.

## UI surfaces

- `components/map/shred-map.tsx`: map state, selection, detail fetch lifecycle.
- `components/map/park-search/park-search.tsx`: expandable park name search (slotted into map chrome below the day picker).
- `components/map/park-detail-panel.tsx`: park detail panel and role-based actions.
- `components/map/map-chrome.tsx`: top navigation/auth actions.
- `components/map/replace-bike-park-markers.ts`: marker replacement/diffing logic.

## Related docs

- [Mates, invites, and ride plans](./social-and-ride-plans.md)
- [Bike park management API and staff UI](./bike-park-management.md)
- [Park reviews](./reviews.md)
- [Environment and operations](../reference/environment-and-operations.md)
