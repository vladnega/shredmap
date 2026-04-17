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

- `components/reviews/park-reviews-section.tsx` — summary, compact star-emoji filters, review list, and a link to the editor (all inside one card).
- `components/reviews/review-card.tsx` — ratings shown as star emoji (count matches score), not numeric “N / 5” labels.
- `components/reviews/star-rating-input.tsx` — five star emojis for picking a score (used on the editor page).
- Park detail panel review integration in `components/map/park-detail-panel.tsx`.
- Park detail panel header shows average rating and review count (`components/reviews/park-review-summary-header.tsx`), kept in sync when reviews change via SWR revalidation.

## Review editor route

- Authenticated route: `/bike-parks/[parkId]/review` (`app/(app)/bike-parks/[parkId]/review/page.tsx`, client UI in `components/reviews/bike-park-review-editor.tsx`).
- Uses the signed-in `(app)` layout. After a successful save, the client navigates to `/?park=[parkId]` so the homepage map re-opens that park’s detail panel.

## Related docs

- [Authentication and authorization](./auth-and-authorization.md)
- [Data model](../reference/data-model.md)
