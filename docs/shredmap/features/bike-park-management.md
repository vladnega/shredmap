# Bike park management API and staff UI

## Public read endpoints

- `GET /api/bike-parks`: returns marker-focused park data.
- `GET /api/bike-parks/[id]`: returns full park data for detail views.

## Staff write endpoints

- `POST /api/bike-parks`: create a park (staff only).
- `PATCH /api/bike-parks/[id]`: partial update (staff only).
- `DELETE /api/bike-parks/[id]`: delete park and cascade reviews (staff only).

`requireBikeParkStaff()` enforces staff access using WorkOS role slugs `admin`/`moderator`.

## Validation and payload shape

- Request payloads are validated with Zod schemas in `lib/bike-parks/api-schemas.ts`.
- Facilities are controlled slugs and persisted as `amenities`.
- Create payloads include `payment` (`paid` \| `free`, default `free`) alongside coordinates and optional URLs.
- Patch requests must include at least one mutable field.

Shared bike-park field UI (staff editor, park requests, and staff request review) lives in `components/bike-parks/fields/bike-park-fields.tsx` so section order and controls stay aligned.

## Staff UI routes

- `/admin/bike-parks`: searchable staff directory with infinite scrolling.
- `/admin/bike-parks/[parkId]`: per-park editor for update/delete workflows.
- Staff users also get map-side deep links to edit the selected park.

## Core files

- API handlers: `app/api/bike-parks/`
- Staff auth: `lib/auth/bike-park-staff.ts`
- Queries: `lib/db/queries.ts`
- Admin UI: `app/(app)/admin/bike-parks/`, `components/admin/`

## Related docs

- [Map and discovery](./map-and-discovery.md)
- [Authentication and authorization](./auth-and-authorization.md)
- [Data model](../reference/data-model.md)
