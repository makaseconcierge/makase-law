# makase-law

Monorepo for the Makase law practice management app.

## Layout

- `apps/api` — Hono API server (service-role access to Supabase).
- `apps/law-office-web-app` — web client.
- `packages/shared` — the DB client, attribution plumbing (`runAs`, `runAsSystem`, `getDb`), and all service functions. Every writer to the DB (API, future cron jobs, scripts) should go through this package so audit attribution is enforced uniformly.
- `packages/types` — shared types, including Kysely-generated DB types.
- `supabase/` — database migrations and schema documentation. See [`supabase/README.md`](./supabase/README.md) for schema conventions, the soft-delete pattern, identity model, attribution model, and how to add new tables.
