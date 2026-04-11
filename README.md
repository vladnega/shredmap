# Full-product Next.js boilerplate

A reusable [Next.js](https://nextjs.org/) starter derived from the Vercel SaaS template, generalized for **public marketing/catalog** surfaces plus an **authenticated app** (dashboard, account, admin, AI chat scaffold). Stack: **Next.js**, **React**, **Postgres**, **Drizzle ORM**, **Tailwind CSS**, **shadcn/ui**, **JWT session auth** (email/password), **Vercel AI SDK** + **OpenAI** (optional).

Detailed structure and customization notes: [`docs/boilerplate.md`](docs/boilerplate.md).

## Features

- Route groups: `(marketing)`, `(catalog)`, `(auth)`, `(app)`, and `api/*`
- Public homepage, About, Contact, sample catalog (`/items`, `/items/[slug]`)
- Sign-in / sign-up with server actions and secure cookies
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

Default seed user:

- Email: `test@test.com`
- Password: `admin123`

Create additional users via `/sign-up`.

## Environment

See [`.env.example`](.env.example). Required for real use:

- `POSTGRES_URL` — production database URL (if unset locally, the app falls back to the Docker URL from `db:setup` and logs a warning)
- `AUTH_SECRET` — secret for signing JWT session cookies
- `BASE_URL` — canonical site URL (e.g. `https://yourdomain.com`)

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

1. Connect the repo and set environment variables (`POSTGRES_URL`, `AUTH_SECRET`, `BASE_URL`, optional `OPENAI_*`).
2. Run migrations against production (`pnpm db:migrate` in CI or locally with prod `POSTGRES_URL`).

## License

Private / your project—follow the license of any upstream templates you depend on.
