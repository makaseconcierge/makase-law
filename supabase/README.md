# Database schema

The core tables live in [`migrations/20260330235333_core_tables.sql`](./migrations/20260330235333_core_tables.sql). This document explains the conventions and non-obvious design decisions so you can navigate and extend the schema safely.

## Overview

All application tables live in the `app` schema, which is **not exposed** to the Supabase Data API — `anon` and `authenticated` have been revoked from everything in `app`, and default privileges keep any new objects locked down too. The API (Hono, using the service role) is the only thing that talks to `app`.

```
auth.users                -- Supabase-managed auth rows (login, sessions)
  └─ app.user_profiles    -- 1:1 mirror, owns user-editable display data
       └─ app._employees  -- firm-controlled identity for firm staff (per office)
```

Auditable tables FK-reference `user_profiles(user_id)` for `created_by` / `updated_by`; soft-deletable tables also use it for trigger-owned `deleted_by`. Office-scoped rows hang off `offices(office_id)` as the tenant boundary, and `audit_log.office_id` is the handle used for permissioned audit viewing.

## Conventions

### Soft delete is opt-in

Only tables that benefit from soft delete use the underscore/view pattern:

- `app._foo` — the underlying table, including nullable `deleted_at` / `deleted_by`.
- `app.foo` — a view over `app._foo` that filters `WHERE deleted_at IS NULL`.
- `app.foo_all` — a view over `app._foo` with no active-row filter, for ergonomic joins that need historical rows.

Tables that are not soft-deletable are created directly as `app.foo`. Application code should use the clean view/table names and reserve underscored tables for admin/debugging cases.

Soft deletes are performed as `UPDATE ... SET deleted_at = NOW()` through the active view. `deleted_by` is trigger-owned and is stamped from `app.acting_user_id`; inserted rows are always forced active.

A `CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))` enforces that the two columns move together — you can't have one set without the other.

Every view is created `WITH (security_invoker = true)` so it runs with the caller's privileges (defense in depth in case the `app` schema is ever exposed).

### Hard DELETE is blocked at the view

Every soft-delete view has an `INSTEAD OF DELETE` trigger that calls `app.prevent_delete()` and raises an exception. If an `UPDATE` path was intended, the error message makes that clear. Direct hard deletes on underlying `app._foo` tables are still possible for admin cleanup, but application code should not use them.

### Audit columns on auditable tables

Auditable tables get four columns from `app.setup_auditable_table()`:

```
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by  UUID NOT NULL DEFAULT app.acting_user_id() REFERENCES app.user_profiles(user_id)
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_by  UUID NOT NULL DEFAULT app.acting_user_id() REFERENCES app.user_profiles(user_id)
```

Soft-deletable tables get two additional columns from `app.setup_soft_delete()`:

```
deleted_at  TIMESTAMPTZ
deleted_by  UUID REFERENCES app.user_profiles(user_id)
```

These columns do not appear in CREATE TABLE statements. The helper functions add them, then attach the relevant triggers. The `app.acting_user_id()` DEFAULT makes the audit columns optional in TypeScript insert types (`Generated<>` in Kysely codegen / kanel); the BEFORE INSERT trigger still overwrites whatever value the DEFAULT produces, so the DEFAULT is purely for DX.

Application code must not set `created_by`, `updated_by`, `created_at`, `updated_at`, or `deleted_by` itself. See the **Attribution** section below for how attribution flows from the application into the triggers.

### Tenant safety via composite foreign keys

Anywhere a child row references another row "in the same office" (e.g., a matter's responsible attorney, a task's assignee, an entity role linking to a matter), the FK is a composite `(office_id, <child_id>)` pointing at a composite unique key on the parent. This makes it impossible for a matter in Office A to reference an attorney who is only an employee of Office B.

Each office-scoped table therefore carries a `<table>_office_uk UNIQUE (office_id, <id>)` constraint that exists solely so other tables can compose against it.

### Partial indexes for soft-deleted tables

For soft-deleted tables, partial indexes matching `WHERE deleted_at IS NULL` keep index scans tight and skip historical rows. Nullable FK indexes additionally include `... IS NOT NULL` in the predicate. Non-soft-deleted tables use ordinary indexes.

## Identity model

### `auth.users` → `user_profiles` → role-specific tables

- **`auth.users`** is Supabase-managed. It owns login, sessions, email verification, etc. You do not write to it directly.
- **`app.user_profiles`** is a 1:1 mirror keyed by `user_id = auth.users.id`. It owns user-editable display data (`display_name`, `email`, optional personal `phone`) and is the FK target for audit attribution across the schema. It persists even if a user ever leaves, so historical authorship always resolves.
- **`app._employees`** is `(office_id, user_id)`-keyed and owns **firm-controlled** identity data: `full_legal_name` (the name that appears on engagement letters and filings), `bar_numbers` (JSONB array of `{state, number}`), `functional_roles`. A user can be an employee at multiple offices by having multiple rows.
- **`app.entities`** is the registry of external people and organizations (clients, opposing parties, witnesses, experts, external attorneys). Each entity is scoped to one office.

The split between `user_profiles.display_name` and `_employees.full_legal_name` is deliberate:

- `display_name` is user-editable — what appears next to an avatar, in mentions, etc. Purely cosmetic.
- `full_legal_name` is firm-controlled, set during onboarding, and used anywhere legal identity matters (signature blocks, bar filings, attorney of record, client-facing invoices).

### Auth triggers

Two triggers on `auth.users` keep `user_profiles` in sync:

- `on_auth_user_created` (AFTER INSERT) calls `app.handle_new_auth_user()`, which sets `app.acting_user_id = NEW.id` and inserts a `user_profiles` row with `display_name` seeded from `raw_user_meta_data->>'name'`, plus `email`/`phone` copied from `auth.users`.
- `on_auth_user_updated` (AFTER UPDATE, guarded by `WHEN OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone`) calls `app.handle_auth_user_updated()`, which sets `app.acting_user_id = NEW.id` and mirrors the email/phone changes.

Both trigger functions are `SECURITY DEFINER` with `search_path = ''` because the auth service role doesn't have privileges on the `app` schema.

## Attribution

Every write to an auditable table must be attributed to a user. This is enforced by the `app.set_audit_fields()` BEFORE INSERT OR UPDATE trigger, which reads the per-transaction GUC `app.acting_user_id` and uses it to populate `created_by` / `updated_by`. Soft-deletable tables also run `app.set_soft_delete_fields()`, which stamps `deleted_by` on delete/restore transitions and prevents caller-controlled `deleted_by`. If the GUC is unset, the triggers raise — you cannot silently write an unattributed row.

The GUC is set by the shared `runAs(user_id, fn)` helper in `@makase-law/shared`, which opens a Kysely transaction, calls `set_config('app.acting_user_id', user_id, true)` on that connection, stashes the transaction handle in `AsyncLocalStorage`, then runs `fn`. Every Kysely query inside `fn` that goes through `getDb()` runs on that same pinned connection, so writes land in the attributed transaction. On commit or rollback, the GUC is automatically cleared (`is_local = true`).

`runAs` enforces a single-actor invariant: nested calls with the same user are a no-op (service composition is fine), but nested calls with a *different* user throw. A request must attribute all its writes to exactly one user — swapping actor mid-transaction would make the audit trail lie.

The Hono API wires this into a `withTx` middleware that wraps mutating requests in `runAs(c.get("user_id"), next)`. GET requests skip the wrapper because they issue no writes. Cron jobs, admin scripts, and migrations call `runAsSystem(fn)` (or `runAs(SYSTEM_USER_ID, fn)`), which attributes to the seeded SYSTEM user. See the API's `apps/api/src/middleware/withTx.ts` and the shared package's `src/runAs.ts` for the implementation.

**Consequences for application code:**

- Never pass `created_by`, `updated_by`, `created_at`, `updated_at` in a service's `insert`/`update` payload — the trigger overwrites them.
- To soft-delete, set `deleted_at = NOW()`. To restore, set `deleted_at = NULL`. Never set `deleted_by`; the trigger owns it.
- Any code path that writes — including migrations with backfills, seed scripts, and one-off psql sessions — must first set `app.acting_user_id`, typically via `SELECT set_config('app.acting_user_id', '<uuid>', true)` inside a transaction.

### SYSTEM user

`SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'` is seeded by the core migration:

- A row in `auth.users` with `email = 'system@makase.internal'`, `banned_until = 'infinity'`, no password. It cannot log in.
- A row in `app.user_profiles` with `display_name = 'SYSTEM'`, created automatically by the `on_auth_user_created` trigger.

Use `runAsSystem(fn)` from `@makase-law/shared` for unattended writes. Audit rows authored by automated processes will show up with `created_by`/`updated_by` pointing at the SYSTEM row, making them easy to filter from human-authored activity.

## Matter staffing

Two separate mechanisms attach people to matters, and the distinction is intentional:

- **`matter_staff`** attaches **firm employees** to matters with a staffing role (`responsible_attorney_id`, `supervising_attorney`, `counsel`, `paralegal`, `clerk`, `support`). A unique index enforces exactly one responsible attorney per matter. This is the mechanism for "who at our firm is working this case."
- **`entity_roles`** attaches **external entities** to matters with a role (`client`, `prospective_client`, `opposing_party`, `witness`, `expert`, `attorney`, `other`). The `'attorney'` role here refers to external counsel — opposing, co-counsel from another firm, etc.

The `matter_role` column on `matter_staff` describes position on the matter team, not job title.

## Extending the schema

When you add a new table to `app`, follow the template:

```sql
CREATE TABLE app._foo (
    foo_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app.offices(office_id),
    -- domain columns here
    CONSTRAINT foo_office_uk UNIQUE (office_id, foo_id)
);
SELECT app.setup_auditable_table('_foo');
SELECT app.setup_soft_delete('_foo'); -- only if this table should be soft-deleted
CREATE INDEX ON app._foo(office_id) WHERE deleted_at IS NULL;
```

`app.setup_auditable_table('_foo')` adds audit columns and attaches audit attribution/log triggers. `app.setup_soft_delete('_foo')` adds soft-delete columns, creates `app.foo` / `app.foo_all`, and blocks hard deletes through those views. Indexes that reference `deleted_at` must come after `setup_soft_delete()` because the column does not exist until then.

If the new table needs tenant-safe FK references from other tables, the composite `(office_id, foo_id)` unique constraint above is what enables them.

## Audit log

`app.audit_log` is an append-only, immutable ledger of every row change in the `app` schema. It has no underscore prefix because it doesn't follow the `_table`/view soft-delete pattern. DML is revoked from all roles; only the `SECURITY DEFINER` trigger function can INSERT. The `app.write_audit_log` AFTER INSERT OR UPDATE OR DELETE trigger writes one row per change with:

- `table_schema` / `table_name` / `record_pk` — `record_pk` is a JSONB object keyed by the table's actual primary-key column name(s), so composite keys work generically.
- `op` — `'INSERT' | 'UPDATE' | 'DELETE'`.
- `diff` — full row as JSONB for INSERT/DELETE; for UPDATE, `{col: {from, to}}` for changed columns only, with `updated_at` / `updated_by` stripped (they'd appear on every row otherwise and are already implied by `changed_at` / `changed_by`).
- `changed_by` — prefers the per-transaction GUC (`app.acting_user_id`), falls back to the row's `updated_by` so direct SQL writes without `runAs` still log.
- `office_id` — tenant boundary for permissioned audit viewing.
- `changed_at` — server time of the change.

No-op UPDATEs do not produce a log row (the BEFORE trigger `set_audit_fields` returns `NULL`, so `write_audit_log` never fires).

## Bootstrap / seed flow

Because every `created_by` is FK-enforced and the audit trigger demands `app.acting_user_id`, first-row ordering matters:

1. The core migration seeds the SYSTEM user in `auth.users`; the auth trigger creates the matching `app.user_profiles` row.
2. A human signs up via Supabase auth → `on_auth_user_created` fires under `app.acting_user_id = NEW.id` → their `user_profiles` row is created.
3. A setup flow inside `runAsSystem(fn)` or `runAs(user_id, fn)` creates the first `offices` row and employee rows.

From there, every subsequent row is attributed automatically by the trigger. Seed scripts and E2E tests should always go through either `runAs(<some user>, fn)` or `runAsSystem(fn)` — never bare Kysely calls to `rootDb`.

## Running and reviewing

```bash
# Apply migrations against a fresh local database
supabase db reset

# Run the Supabase advisors (function search paths, RLS, extension locations, etc.)
supabase db advisors

# Regenerate kysely types after schema changes
# (whatever command your workspace uses to invoke kysely-codegen)
```

After editing the migration, run all three before committing.

## Known deferred items

- **Syncing `auth.users` email/phone on UPDATE** — done.
- **DB-level enforcement of `updated_by` / `created_by`** — done (`set_audit_fields` trigger + `app.acting_user_id` GUC + `runAs` in `@makase-law/shared`).
- **`app.audit_log` with JSONB diffs** — done (see Audit log section above).
- **RLS policies on `app`** — not added. Currently unnecessary because the schema is not exposed via PostgREST. Revisit if/when direct `supabase-js` client access is introduced.
