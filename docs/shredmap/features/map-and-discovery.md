# Map and discovery

## User experience

- Public users can open `/` and browse bike parks without signing in.
- Optional query `?park=<bike-park-id>` opens that park’s detail panel on load (used when returning from the review editor).
- The homepage is a full-screen map (`100dvh`) with park markers from Postgres.
- Selecting a marker loads park details in a panel:
  - Mobile: full-screen panel.
  - Desktop: side panel with map still visible.

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
  3. default Google marker
- Marker fetches use abort signals so stale responses are ignored during quick navigation/remounts.

## UI surfaces

- `components/map/shred-map.tsx`: map state, selection, detail fetch lifecycle.
- `components/map/park-detail-panel.tsx`: park detail panel and role-based actions.
- `components/map/map-chrome.tsx`: top navigation/auth actions.
- `components/map/replace-bike-park-markers.ts`: marker replacement/diffing logic.

## Related docs

- [Bike park management API and staff UI](./bike-park-management.md)
- [Park reviews](./reviews.md)
- [Environment and operations](../reference/environment-and-operations.md)
