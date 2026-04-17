# Data model

## Core tables

### `bike_parks`

Stores park identity, location, presentation data, and business metadata.

- Identity/location: `id`, `name`, `latitude`, `longitude`
- Description/media: `description`, `logoUrl`, `pinLogoUrl`, `galleryImageUrls`
- Trail stats: `trailDifficultyCounts`
- Facilities: `amenities` (controlled feature slugs)
- Links and commerce: `primaryCtaUrl`, `buyTicketUrl`, `primaryCtaType`, `payment`, `status`
- Hours: `openingHours`
- Timestamps: `createdAt`, `updatedAt`

`ratingScore` and `ratingVoteCount` are legacy seed-era fields; review summaries should come from live `park_reviews` aggregates.

### `park_reviews`

Links users to parks and stores review content.

- `bikeParkId`, `userId`
- `rating` (1-5), review text
- `createdAt`
- Unique `(bike_park_id, user_id)` constraint for one review per user per park

### `users`

Local profile mirror for WorkOS-authenticated users.

- Includes `workOsUserId` for identity mapping
- Provides display data used in review responses (for example reviewer name formatting)

### `friend_invitations`

Mate requests (not the same table as org `invitations` / teams).

- `inviterUserId`, `inviteeUserId`, `status` (`pending` | `accepted` | `rejected` | `cancelled`)
- `createdAt`, `respondedAt`
- Check constraint: inviter ≠ invitee
- Partial unique index: at most one **pending** row per `(inviter, invitee)` pair

### `friendships`

Undirected mate edges, stored canonically with `userLowId` &lt; `userHighId` as composite primary key.

### `mate_invite_links`

Shareable invite URLs (e.g. WhatsApp). At most **one active row per inviter** (primary key `inviter_user_id`); refreshing rotates `token` and `expires_at`.

- `token` (unique), `expiresAt`, `createdAt`, `updatedAt`

### `ride_plans`

Per-user calendar-day riding intent.

- `userId`, `rideOn` (`date`), `bikeParkId`
- Composite primary key `(user_id, ride_on)` — one park per user per day
- `createdAt`, `updatedAt`

## Schema and query locations

- Schema definitions: `lib/db/schema.ts`
- Query helpers and route-level data access: `lib/db/queries.ts`, mate/ride-plan helpers in `lib/social/queries.ts`
- Migrations: `lib/db/migrations/`

## Related docs

- [Mates, invites, and ride plans](../features/social-and-ride-plans.md)
- [Bike park management API and staff UI](../features/bike-park-management.md)
- [Park reviews](../features/reviews.md)
