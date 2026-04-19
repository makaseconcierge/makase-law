## Learned User Preferences

- Uses Bun exclusively — not npm, pnpm, or Node; workspace rule enforces this
- Wants a concise plan presented before logic/schema changes (interaction standards rule)
- Still in planning/prototyping stage — ok to rewrite migrations wholesale instead of adding new ones
- v0 scope is task management + time tracking (Asana + BigTime replacement); matter_team is v1
- API connects directly to Postgres via Kysely, not via supabase-js
- Invoice payment allocation modeled as multiple payment rows linked by external_payment_id, not a junction table
- Time entries without a task_id are non-billable, reporting-only (billable/no_charge flags live on tasks, not time_entries)
- Multi-tenant product: firm-specific config (e.g. late_fee_rate) must not have defaults — each firm sets its own values
- Pushes back on premature optimization; prefers query simplicity until scale pain is measured
- Values concise DX — prefers schema-level solutions (views, triggers) over app-level wrappers that require type hacks
- Bun type deps only: `@types/bun` with tsconfig `"types": ["bun"]`; never add `@types/node` even when `Buffer` is needed
- Audit trail is a hard requirement — store JSONB diffs only (not full row snapshots); `changed_by` derived from `updated_by`, not session vars

## Learned Workspace Facts

- Bun monorepo: `apps/*` (`client-portal-web-app`, `law-office-web-app` — both Vite+React; `api` — Bun runtime) plus `packages/*` (`@makase-law/types`); root scripts `dev:api`/`dev:client`/`dev:office` (no combined "run all" — three terminals)
- All DB tables live in `app` schema, prefixed `_` (e.g. `app._user_profiles`); exposed via `security_invoker = true` views with clean names (`app.user_profiles`) that filter `WHERE deleted_at IS NULL`; Kysely queries the view names unchanged
- `INSTEAD OF DELETE` triggers (`app.prevent_delete`) attached to every view to block hard deletes through views; all `app.*` functions pin `SET search_path = ''`
- `anon`/`authenticated` roles fully revoked from `app`; public schema reserved for views (with `security_invoker = true`) when frontend/realtime access is needed
- Kysely query builder with `.withSchema("app")` over Bun's built-in SQL driver; `kysely-codegen --dialect postgres --default-schema app --singularize` generates the `DB` export (not `Database`) into `packages/types/src/dbTypes.ts`; `pg` is a devDep only for the codegen CLI
- Shared types at `packages/types` exporting `@makase-law/types`; all apps and the api depend on it via `workspace:*`; `db:types` script in `apps/api` proxies to `packages/types`
- Named `{table}_id` PK convention (user_id, office_id, matter_id, entity_id, task_id, invoice_id, etc.) — no generic `id`; identity rows live in `_user_profiles` (not `users`), kept as a mirror of `auth.users` because `raw_user_meta_data` is user-editable
- Matters use `stage` (allowed: consultation, setup, active, closed, archived — not `open`); other entities use `status` (tasks, invoices, forms, leads)
- Multi-tenant integrity via composite FKs: child `(fk, office_id)` → parent `(pk, office_id)`; tenant-scoped parents carry `UNIQUE (pk, office_id)` (`*_office_uk`); entities are NOT office-scoped — office scoping lives on `entity_roles`, which links entities to matters per office
- Soft-delete via `deleted_at`/`deleted_by` on core tables; audit trail via `app.audit_log` + trigger that stores JSONB diffs only, with `changed_by = OLD/NEW.updated_by`
- Law firm case management product domain: _user_profiles, offices, employees, entities, entity_roles, matters, leads intake pipeline, tasks, time tracking, expenses, invoices, audit_log
- Hono API: use `MiddlewareHandler<AppEnv>` for middleware (`createMiddleware<AppEnv>` doesn't propagate env types to `c.set`/`c.get`); `authenticate` is applied globally in `main.ts` — don't re-apply in sub-routers; `created_by`/`updated_by` sourced from `c.get("authUser").id`, never from request body; chain route definitions (`.get().post()`) for RPC-ready type inference; SELECT row types are `Selectable<T>` (not the raw table type `T`); call `.selectAll()` so Kysely infers the row shape; tsconfig `compilerOptions.types` must be `["bun"]`, not `"bun-types"`
