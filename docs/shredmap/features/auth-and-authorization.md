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

## App personas (current)

- **Anonymous user** (not signed in): can browse the map, park markers, and park details.
- **Member** (WorkOS role slug `member`): signed-in community user who can use mates/ride plans and author park reviews.
- **Admin** (WorkOS role slug `admin`): staff user with all member capabilities plus bike park management access.
- **Moderator** (WorkOS role slug `moderator`): staff user with all member capabilities plus bike park management access.

## Role-driven capabilities

- Public map and park discovery: anonymous, member, admin, moderator.
- Mates and ride plans: member, admin, moderator.
- Review authoring: `member`, `admin`, or `moderator`.
- Bike park staff actions: `admin` or `moderator`.
- Park Request submission: `member`, `admin`, or `moderator`.
- Park Request review/approval/rejection: `admin` or `moderator`.
- Missing session returns `401`; signed-in but unauthorized returns `403`.

## Persona-aware design requirements

- New user-facing features should explicitly state which of the four personas can: view, act, and manage.
- Preserve public read access for anonymous users unless a requirement explicitly says otherwise.
- Keep privileged write operations limited to `admin`/`moderator` checks in API handlers (never client-only gating).
- If a feature is signed-in only, document expected unauthenticated behavior (for example: redirect, sign-in CTA, `401`, or read-only fallback).

## Key implementation files

- `lib/auth/workos-env.ts`
- `lib/auth/sync-workos-user.ts`
- `lib/auth/bike-park-staff.ts`
- `lib/auth/bike-park-review-auth.ts`
- `lib/auth/bike-park-staff-roles.ts`
- `app/api/workos/roles/route.ts`

## Related docs

- [Bike park management API and staff UI](./bike-park-management.md)
- [Park Requests](./park-requests.md)
- [Park reviews](./reviews.md)
- [Environment and operations](../reference/environment-and-operations.md)
