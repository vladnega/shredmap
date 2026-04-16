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

## Schema and query locations

- Schema definitions: `lib/db/schema.ts`
- Query helpers and route-level data access: `lib/db/queries.ts`
- Migrations: `lib/db/migrations/`

## Related docs

- [Bike park management API and staff UI](../features/bike-park-management.md)
- [Park reviews](../features/reviews.md)
