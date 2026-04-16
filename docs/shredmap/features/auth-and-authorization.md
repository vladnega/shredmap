# Authentication and authorization

## Authentication stack

- WorkOS AuthKit is the only sign-in path.
- Required env vars are validated with `assertWorkOsConfigured()` in `lib/auth/workos-env.ts`.
- Callback route: `app/callback/route.ts`.
- Request proxy integration: `proxy.ts` using `authkitProxy`.

## Session and user sync

- The callback syncs each WorkOS user into Postgres via `syncWorkOsUserToDatabase`.
- App data links to local `users` rows using `workOsUserId`.

## Authorization model

- WorkOS is the source of truth for roles and permissions.
- Do not store authorization roles in Postgres.
- Runtime role checks read WorkOS session and/or organization memberships.

## Role-driven capabilities

- Review authoring: `member`, `admin`, or `moderator`.
- Bike park staff actions: `admin` or `moderator`.
- Missing session returns `401`; signed-in but unauthorized returns `403`.

## Key implementation files

- `lib/auth/workos-env.ts`
- `lib/auth/sync-workos-user.ts`
- `lib/auth/bike-park-staff.ts`
- `lib/auth/bike-park-review-auth.ts`
- `lib/auth/bike-park-staff-roles.ts`
- `app/api/workos/roles/route.ts`

## Related docs

- [Bike park management API and staff UI](./bike-park-management.md)
- [Park reviews](./reviews.md)
- [Environment and operations](../reference/environment-and-operations.md)
