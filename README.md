# makase-law

Monorepo for the Makase law practice management app.

## Layout

```
apps/
  api/          Hono API server, port 8000 (Bun runtime, Kysely + Supabase Postgres)
  office-web/   Vite + React web client, port 5173 (firm-facing UI)
packages/
  shared/       @makase-law/shared — Kysely client, runAs* attribution helpers, services
  types/        @makase-law/types  — Kanel-generated DB types + write-shape helpers
  utils/        @makase-law/utils  — small cross-stack helpers (e.g. mergeRolePermissions)
supabase/       migrations, seed data, schema docs
```

Per-area docs:
- [`apps/api/README.md`](./apps/api/README.md) — routes, middleware, env vars
- [`apps/office-web/README.md`](./apps/office-web/README.md) — auth/office context flow, data fetching
- [`packages/shared/README.md`](./packages/shared/README.md) — `runAsUser` / `runAsEmployee` / `runAsSystem`, service layer
- [`packages/types/README.md`](./packages/types/README.md) — codegen, `New*` / `*Patch` shapes
- [`supabase/README.md`](./supabase/README.md) — schema conventions, soft-delete, attribution model
- [`AGENTS.md`](./AGENTS.md) — accumulated workspace facts and product preferences for AI assistants

## Prerequisites

- [Bun](https://bun.sh) — package manager and API runtime; **do not use npm/pnpm/Node**
- [Supabase CLI](https://supabase.com/docs/guides/cli) — runs local Postgres + auth + Mailpit

## First-time setup

```bash
bun install               # installs every workspace
supabase start            # boots local Postgres (54322), Studio (54323), Mailpit (54324), auth (54321)
bun db:reset              # applies migrations, seeds users, regenerates types
```

`.env` files live in each app:
- `apps/api/.env` — `SUPABASE_URL`, `DATABASE_URL`, optional `LOG_LEVEL`
- `apps/office-web/.env` — `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLIC_KEY`

## Running the apps

There is no combined "run all" script — use one terminal per app:

```bash
bun run dev:api      # Hono API on :8000 (hot reload)
bun run dev:office   # Office web on :5173
```

## Database

| Command | What it does |
| --- | --- |
| `bun db:reset` | `supabase db reset` (applies migrations) → applies `supabase/local_setup.sql` (sets the `api` role password) → regenerates Kysely types. Use for a clean DB. |
| `bun db:types` | Regenerates `packages/types` only (Kanel). Use after migration tweaks if you don't want to wipe data. |

`supabase start` must be running before either command.

## Logging in locally

`bun db:reset` seeds two users into a single office (`Test Law Firm`):

| Email | Role | Teams |
| --- | --- | --- |
| `dev@makase.dev` | Partner (admin) | Litigation, Transactional |
| `jane@makase.dev` | Associate | Litigation |

1. Open the office-web app at http://127.0.0.1:5173.
2. Enter one of the seeded emails — magic-link only, no password.
3. Open the local fake inbox at http://127.0.0.1:54324 (Mailpit, shipped with the Supabase CLI) and click the link in the latest email. You'll be redirected back signed in.

Signups are invite-only (`[auth].enable_signup = false` in [`supabase/config.toml`](./supabase/config.toml)) — only emails already present in `auth.users` can request a magic link. Add stable test users to [`supabase/seed.sql`](./supabase/seed.sql); accounts you sign up manually will be wiped by `bun db:reset`.

To invite a new user from server code:

```ts
import { createClient } from "@supabase/supabase-js";
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
await supabaseAdmin.auth.admin.inviteUserByEmail("new-hire@firm.com");
```

## Local services

| Service | URL |
| --- | --- |
| Office web app | http://127.0.0.1:5173 |
| Hono API | http://127.0.0.1:8000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (fake inbox) | http://127.0.0.1:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## Workspace conventions

- **Bun only** — runtime, package manager, scripts. Catalog deps (`hono`, `zod`, `@logtape/logtape`) are pinned in the root `package.json` and referenced as `"hono": "catalog:"` in workspace packages.
- **Single migration file** today (`supabase/migrations/20260330235333_core_tables.sql`); the project is still in pre-launch and we rewrite this file rather than stacking new migrations until v1.
- **All DB writes** must run through `runAsUser` / `runAsEmployee` / `runAsSystem` from `@makase-law/shared` — the `set_audit_fields` trigger raises if `app.acting_user_id` is unset.
