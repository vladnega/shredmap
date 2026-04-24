# Shredmap wiki

This wiki is the canonical, feature-based documentation for Shredmap.

Start from this page, then drill into feature docs for behavior and implementation details.

Current app personas are documented in [Authentication and authorization](./features/auth-and-authorization.md): anonymous user, `member`, `admin`, and `moderator`.

## Feature docs

- [Map and discovery](./features/map-and-discovery.md)
- [Authentication and authorization](./features/auth-and-authorization.md)
- [Bike park management API and staff UI](./features/bike-park-management.md)
- [Park Requests](./features/park-requests.md)
- [Park reviews](./features/reviews.md)
- [Mates, invites, and ride plans](./features/social-and-ride-plans.md)

## Deep reference

- [Data model](./reference/data-model.md)
- [Environment and operations](./reference/environment-and-operations.md)
- [Testing and E2E](./reference/testing-and-e2e.md)

## Source map

- Map UI: `components/map/`
- Mates (signed-in): `app/(mates)/mates/`, `components/mates/`
- Mate invite landing (public): `app/(marketing)/mates/join/[token]/`
- Bike park API routes: `app/api/bike-parks/`
- Social APIs: `app/api/friends/`, `app/api/ride-plans/`
- Park review editor (signed-in): `app/(app)/bike-parks/[parkId]/review/`
- Staff bike park UI: `app/(app)/admin/bike-parks/`
- Staff Park Request review UI: `app/(app)/admin/park-requests/`
- Auth and role checks: `lib/auth/`
- Database schema and queries: `lib/db/schema.ts`, `lib/db/queries.ts`

## Related docs

- [Boilerplate guide](../boilerplate.md)
- [Agent guardrails](../../AGENTS.md)
