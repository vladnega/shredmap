# Shredmap wiki

This wiki is the canonical, feature-based documentation for Shredmap.

Start from this page, then drill into feature docs for behavior and implementation details.

## Feature docs

- [Map and discovery](./features/map-and-discovery.md)
- [Authentication and authorization](./features/auth-and-authorization.md)
- [Bike park management API and staff UI](./features/bike-park-management.md)
- [Park reviews](./features/reviews.md)

## Deep reference

- [Data model](./reference/data-model.md)
- [Environment and operations](./reference/environment-and-operations.md)
- [Testing and E2E](./reference/testing-and-e2e.md)

## Source map

- Map UI: `components/map/`
- Bike park API routes: `app/api/bike-parks/`
- Staff bike park UI: `app/(app)/admin/bike-parks/`
- Auth and role checks: `lib/auth/`
- Database schema and queries: `lib/db/schema.ts`, `lib/db/queries.ts`

## Related docs

- [Boilerplate guide](../boilerplate.md)
- [Agent guardrails](../../AGENTS.md)
