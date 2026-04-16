# Environment and operations

## Required environment variables

- `POSTGRES_URL` (or `DATABASE_URL`) for Postgres/Neon
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for the map
- `WORKOS_API_KEY`
- `WORKOS_CLIENT_ID`
- `WORKOS_COOKIE_PASSWORD`
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI`

Without required WorkOS values, startup fails because `assertWorkOsConfigured()` is executed in request bootstrap paths.

## Optional environment variables

- `BASE_URL` for canonical link/callback generation
- `OPENAI_API_KEY`, `OPENAI_MODEL` for chat features
- `ENABLE_E2E_TEST_AUTH`, `TEST_APP_USERNAME`, `TEST_APP_SECRET` for E2E auth bootstrap

## Common commands

- Dev server: `pnpm dev`
- Type check: `npx tsc --noEmit`
- Tests: `pnpm test`
- Build: `pnpm build`
- DB migrate: `pnpm db:migrate`
- DB seed: `pnpm db:seed`

## Vercel deployment notes

- Vercel "Development" env vars are for local syncing, not hosted deploy targets.
- Hosted deployments use `preview`, `production`, or explicit custom environment slugs.
- This repo supports a custom `dev` environment via `pnpm vercel:deploy:dev`.

## Data seeding

- Seed source: `data/bike-parks.seed.json`
- Seeding inserts rows via `lib/bike-parks/seed-from-json.ts` and `lib/db/seed.ts`
- Seed flow is not idempotent; duplicate-key failures after an initial run are expected.

## Related docs

- [Authentication and authorization](../features/auth-and-authorization.md)
- [Testing and E2E](./testing-and-e2e.md)
