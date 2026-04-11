# Full-product boilerplate guide

> **Shredmap:** the live product doc is [`shredmap.md`](./shredmap.md). This file describes the **inherited Next.js starter** layers (route groups, catalog demo, generic auth notes). The Shredmap homepage is the **map**, not only the generic marketing layout described below.

## 1. What this starter is

A **generic Next.js App Router** foundation for products that need:

- A **public** website (marketing, listings, content)
- An **authenticated** area (dashboard, account, admin, AI tools)

It is **not** tied to subscriptions or Stripe. **Shredmap** overrides auth: **WorkOS AuthKit only** (see [`shredmap.md`](./shredmap.md)). The inherited starter assumed email/password + JWT; this repo no longer uses that path for login.

## 2. How it is structured

| Area | Route group | URLs (examples) | Purpose |
|------|-------------|-----------------|--------|
| Public marketing | `(marketing)` | `/`, `/about`, `/contact` | Landing and static-style pages |
| Catalog demo | `(catalog)` | `/items`, `/items/[slug]` | List + detail backed by `catalog_items` |
| Auth | `(auth)` | `/sign-in`, `/sign-up` | Immediate WorkOS AuthKit redirects (`lib/auth/workos-redirect.ts`); account actions in `app/(auth)/actions.ts` |
| App | `(app)` | `/dashboard`, `/account`, `/admin`, `/chat` | `withAuth({ ensureSignedIn: true })` in `(app)/layout.tsx` |
| API | `app/api/*` | `/api/user`, `/api/organization`, `/api/items`, `/api/ai/chat`, `/api/webhooks` | JSON and AI endpoints |

**Components**

- `components/ui/` — shadcn primitives (keep as-is for upgrades)
- `components/marketing/` — public shell (`SiteHeader`, `HeroTerminal`)
- `components/app/` — app chrome (`AppHeader`, `DashboardSidebar`, `AccountSubnav`)
- `components/auth/` — `public-auth-actions.tsx` (links to `/sign-in` / `/sign-up`)

**Libraries**

- `lib/auth/` — `assertWorkOsConfigured`, password hashing for account actions, validation helpers (`validatedActionWithUser`, `withOrganization`)
- `lib/db/` — Drizzle schema, queries, migrations, seed
- `lib/ai/` — OpenAI provider helper for AI routes

Physical DB table names **`teams`** and **`team_members`** are kept for migration compatibility; TypeScript uses **`organizations`** and **`organizationMembers`**.

## 3. Public vs authenticated

| Public (no login) | Authenticated (`(app)` layout + WorkOS session) |
|-------------------|----------------------------------------------------------------|
| `/`, `/about`, `/contact`, `/items`, `/items/[slug]` | `/dashboard`, `/dashboard/activity`, `/account`, `/account/security`, `/admin`, `/chat` |

API routes are **not** listed in the proxy `config.matcher`; protect them inside each route (e.g. check `getUser()` or role) as your product requires.

## 4. Optional modules

- **AI** — omit `OPENAI_API_KEY`; `/chat` and `/api/ai/chat` return a clear error until configured.
- **Admin** — `/admin` and `POST /api/admin/items` are stubs; add real authorization (e.g. `user.role` or org role).
- **Webhooks** — `POST /api/webhooks` accepts JSON and returns `{ received: true }`; add signature verification per provider.
- **Catalog** — `catalog_items` is an example; replace or extend for real listings.

## 5. Adapting to a new project

1. Rename the product in `app/layout.tsx` metadata, `SiteHeader` / `AppHeader` branding, and copy.
2. Replace or extend `lib/db/schema.ts` for your domain (keep `users` / session-related tables stable until auth is migrated).
3. Adjust route groups: add pages under `(marketing)` or `(catalog)`, or add new groups (e.g. `(docs)`).
4. Tighten `proxy.ts` if you add more protected prefixes.
5. Remove demo catalog seed data in `lib/db/seed.ts` when you own the schema.

## 6. Files an LLM agent should touch first

Priority order for a greenfield product:

1. `lib/db/schema.ts` — domain tables and relations  
2. `lib/db/queries.ts` — data access patterns  
3. `app/(marketing)/page.tsx` and `(marketing)/about`, `contact` — positioning  
4. `app/(catalog)/**` or new routes — listings/content model  
5. `app/(auth)/actions.ts` — only if auth rules change  
6. `proxy.ts` — protected paths (Next.js request proxy; WorkOS `authkitProxy`)  
7. `app/api/**` — external integrations  

Keep `components/ui/` aligned with shadcn conventions when possible.

## 7. Adding a new catalog or listing type

1. Add a table in `schema.ts` (e.g. `bike_trails` with `slug`, geo, etc.).
2. Run `pnpm db:generate` and `pnpm db:migrate`.
3. Add query helpers in `lib/db/queries.ts`.
4. Add routes under `(catalog)` or `(marketing)` and optional `app/api/...` routes.
5. Seed sample rows in `seed.ts` for local development.

You can keep multiple listing types in one app by repeating the pattern (table + queries + routes).

## 8. Adding a new AI-powered page

1. Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in `.env`.
2. Reuse `lib/ai/openai.ts` or add a dedicated client in `lib/ai/`.
3. Add a route handler under `app/api/...` using `generateText` or `streamText` from the `ai` package.
4. Add a client page under `(app)` that calls your API (see `app/(app)/chat/page.tsx`).

Avoid pulling large agent frameworks until your product needs tool-calling or multi-step flows.

## 9. Database migrations

- **Single baseline migration:** `lib/db/migrations/0000_initial.sql` — creates `users`, `teams`, `team_members`, `activity_logs`, `invitations`, and `catalog_items` with no legacy Stripe columns.
- After editing `schema.ts`, run `pnpm db:generate` (or `drizzle-kit generate`) and commit the new SQL plus updated `meta/` snapshots.

## 10. Auth and security notes

- **Shredmap:** WorkOS session via `authkitProxy` in `proxy.ts` and encrypted cookie — see [`shredmap.md`](./shredmap.md).
- Cookies use `secure` in production; align `BASE_URL` with your deployment.
- For production webhooks, verify signatures and use HTTPS only.
