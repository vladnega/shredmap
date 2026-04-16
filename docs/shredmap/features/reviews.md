# Park reviews

## Capability

Signed-in users with WorkOS role slug `member`, `admin`, or `moderator` can submit one review per bike park.

## API endpoints

- `GET /api/bike-parks/[id]/reviews`
  - Public.
  - Returns `summary`, paginated `items`, `nextCursor`, and optional `viewerReview`.
  - Supports `limit` (max 25), optional `cursor`, optional `rating`.
- `POST /api/bike-parks/[id]/reviews`
  - Auth required.
  - Upserts one review per `(user, park)`.
  - Validates rating `1-5` plus review body/description.

## Authorization behavior

- Missing session: `401`.
- Signed-in user without author role: `403`.
- Enforcement is centralized in `requireBikeParkReviewAuthor()`.

## Data behavior

- Reviews are stored in `park_reviews`.
- A unique `(bike_park_id, user_id)` constraint guarantees one active review per user/park.
- Repeat submissions update the existing row.
- Park summary values are derived from live review aggregates.

## UI surfaces

- `components/reviews/park-reviews-section.tsx`
- `components/reviews/review-card.tsx`
- Park detail panel review integration in `components/map/park-detail-panel.tsx`

## Related docs

- [Authentication and authorization](./auth-and-authorization.md)
- [Data model](../reference/data-model.md)
