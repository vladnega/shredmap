# Testing and E2E

## Automated test commands

- Unit/integration tests: `pnpm test` (Vitest)
- E2E tests: `pnpm test:e2e` (Playwright)
- Type checks: `npx tsc --noEmit`

## E2E auth bootstrap flow

When password test auth is enabled, Playwright can mint an AuthKit session for test users.

Required env vars:

- `ENABLE_E2E_TEST_AUTH=1`
- `TEST_APP_USERNAME`
- `TEST_APP_SECRET`

Flow summary:

1. App boots with test auth enabled.
2. Test setup calls `POST /api/e2e/session`.
3. Route authenticates via password and sets auth cookie for browser tests.

## Artifacts and debugging

- Playwright output is stored under `test-results/`.
- Video recording is enabled for easier failure debugging.

## Related docs

- [Bike park management API and staff UI](../features/bike-park-management.md)
- [Environment and operations](./environment-and-operations.md)
