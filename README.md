# makase-law

Monorepo for the Makase law practice management app.

## Layout

- `apps/api` — Hono API server (service-role access to Supabase).
- `apps/office-web` — web client.
- `packages/shared` — the DB client, attribution plumbing (`runAs`, `runAsSystem`, `getDb`), and all service functions. Every writer to the DB (API, future cron jobs, scripts) should go through this package so audit attribution is enforced uniformly.
- `packages/types` — shared types, including Kysely-generated DB types.
- `supabase/` — database migrations and schema documentation. See [`supabase/README.md`](./supabase/README.md) for schema conventions, the soft-delete pattern, identity model, attribution model, and how to add new tables.


## Prerequisites

- [Bun](https://bun.sh)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local Postgres and `supabase db reset`)

## Database and generated types

From the repo root:

| Command | What it does |
| --- | --- |
| `bun db:reset` | Runs `supabase db reset` (applies migrations), then applies `supabase/local_setup.sql` via `psql` against local Supabase Postgres (`postgresql://postgres:postgres@localhost:54322/postgres`), then runs `bun db:types`. Use for a clean local DB and regenerated Kysely types. |
| `bun db:types` | Regenerates `packages/types` only (Kanel). Use after migration changes if you did not run a full reset. |

Start local Supabase when needed (`supabase start`) before `db:reset`.

## Running the apps

There is no combined “run all” script; use one terminal per app from the repo root:

```bash
bun run dev:api     # Hono API — apps/api
bun run dev:office  # Office web — apps/office-web
```

## Logging in locally

`bun db:reset` seeds two users into a single office (`Test Law Firm`):

| Email | Role | Teams |
| --- | --- | --- |
| `dev@makase.dev` | Partner (admin) | Litigation, Transactional |
| `jane@makase.dev` | Associate | Litigation |

Login flow:

1. Open the office-web app (`bun run dev:office`, default http://127.0.0.1:5173).
2. Enter one of the seeded emails — magic-link only, no password.
3. Open the local fake inbox at **http://127.0.0.1:54324** (Mailpit, shipped with the Supabase CLI stack) and click the magic link in the most recent email. You'll be redirected back to the app, signed in.

Signups are invite-only (`[auth].enable_signup = false` in [`supabase/config.toml`](./supabase/config.toml)) — only emails that already exist in `auth.users` can request a magic link. Use `bun db:reset` to wipe and reseed; any account you signed up with manually will be lost. Add stable test users to [`supabase/seed.sql`](./supabase/seed.sql) instead.

To invite a new user from the API (once an admin invite flow exists):

```ts
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
await supabaseAdmin.auth.admin.inviteUserByEmail("new-hire@firm.com");
```

## Other local services

| Service | URL |
| --- | --- |
| Office web app | http://127.0.0.1:5173 |
| Hono API | http://127.0.0.1:8000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (fake inbox) | http://127.0.0.1:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |