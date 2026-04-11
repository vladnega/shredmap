# Shredmap

**Shredmap** is a [Next.js](https://nextjs.org/) app for discovering **UK mountain bike parks** on an interactive **Google Map** (database-backed markers, detail panel, mobile-first layout). It builds on a full-product starter: **marketing/catalog** surfaces plus an **authenticated app** (dashboard, account, admin, AI chat scaffold). Stack: **Next.js**, **React**, **Postgres**, **Drizzle ORM**, **Tailwind CSS**, **shadcn/ui**, **WorkOS AuthKit** (required), optional **Vercel AI SDK** + **OpenAI**.

- **Product and architecture:** [`docs/shredmap.md`](docs/shredmap.md) — features, APIs, env, data model (keep this updated when behavior changes; see `.cursor/rules/`).
- **Inherited starter layout:** [`docs/boilerplate.md`](docs/boilerplate.md)
- **Agent brief (vision + guardrails):** [`AGENTS.md`](AGENTS.md)

## Features

- **Homepage map** — full-viewport map, `GET /api/bike-parks` markers, park detail from `GET /api/bike-parks/[id]`
- Route groups: `(marketing)`, `(catalog)`, `(auth)`, `(app)`, and `api/*`
- About, Contact, sample catalog (`/items`, `/items/[slug]`)
- Sign-in: **WorkOS AuthKit** (`/sign-in`, `/sign-up`, `/callback`); app fails fast if WorkOS env vars are missing
- Organization workspace with members and invitations (multi-tenant friendly)
- Account profile and security (password, delete account)
- Activity log for the signed-in user
- Admin placeholder page and stub `POST /api/admin/items`
- AI: `lib/ai`, `/chat`, `POST /api/ai/chat` (requires `OPENAI_API_KEY`)
- Generic webhook placeholder: `POST /api/webhooks`

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (recommended) or npm
- Postgres (local Docker via `pnpm db:setup`, or a hosted URL)

## Setup

```bash
pnpm install
pnpm db:setup          # interactive: local Docker Postgres or remote URL, writes .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Choosing **local Postgres** in `db:setup` writes a `docker-compose.yml` at the repo root (gitignored). Start the database with `docker compose up -d`, then run migrate/seed.

Default seed user (for local demo data; sign-in is via WorkOS only):

- Email: `test@test.com`
- Password: `admin123` (stored hash in DB — not a JWT login path)

## Environment

See [`.env.example`](.env.example). Required for real use:

- `POSTGRES_URL` — production database URL (if unset locally, the app falls back to the Docker URL from `db:setup` and logs a warning)
- `BASE_URL` — canonical site URL (e.g. `https://yourdomain.com`)
- WorkOS: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI` — must match the [WorkOS dashboard](https://dashboard.workos.com) and your deployed `/callback` route

Optional:

- `OPENAI_API_KEY`, `OPENAI_MODEL` — for `/chat` and `/api/ai/chat`

## Scripts

| Script        | Description                |
| ------------- | -------------------------- |
| `pnpm dev`    | Next.js dev server         |
| `pnpm build`  | Production build           |
| `pnpm db:setup` | Interactive `.env` + Docker |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:seed`  | Seed user, org, catalog    |
| `pnpm db:studio`| Drizzle Studio             |

## Deploy (e.g. Vercel)

1. Connect the repo and set environment variables (`POSTGRES_URL`, `BASE_URL`, WorkOS vars, optional `OPENAI_*`).
2. Run migrations against production (`pnpm db:migrate` in CI or locally with prod `POSTGRES_URL`).

## License

Private / your project—follow the license of any upstream templates you depend on.
