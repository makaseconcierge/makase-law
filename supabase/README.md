# Database schema

The core tables live in [`migrations/20260330235333_core_tables.sql`](./migrations/20260330235333_core_tables.sql). This document explains the conventions and non-obvious design decisions so you can navigate and extend the schema safely.

## Overview

All application tables live in the `app` schema, which is **not exposed** to the Supabase Data API — `anon` and `authenticated` have been revoked from everything in `app`, and default privileges keep any new objects locked down too. The API (Hono, using the service role) is the only thing that talks to `app`.

```
auth.users                 -- Supabase-managed auth rows (login, sessions)
  └─ app._user_profiles    -- 1:1 mirror, owns user-editable display data
       ├─ app._employees   -- firm-controlled identity for firm staff (per office)
       └─ app._entities    -- firm-controlled registry of external people/orgs
```

Every business table FK-references `_user_profiles(user_id)` for `created_by`/`updated_by`/`deleted_by`. Matters, leads, tasks, invoices, expenses, time entries, and forms all hang off `_offices` as the tenant boundary.

## Conventions

### Soft delete via underscore-prefixed tables and active views

For every domain table there are two objects:

- `app._foo` — the underlying table, including a nullable `deleted_at` / `deleted_by` pair.
- `app.foo` — a view over `app._foo` that filters `WHERE deleted_at IS NULL`.

Application code reads and writes **the view**, never the underlying table. Soft deletes are performed as an `UPDATE ... SET deleted_at = NOW(), deleted_by = <user>` through the view.

A `CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))` enforces that the two columns move together — you can't have one set without the other.

Every view is created `WITH (security_invoker = true)` so it runs with the caller's privileges (defense in depth in case the `app` schema is ever exposed).

### Hard DELETE is blocked at the view

Every active view has an `INSTEAD OF DELETE` trigger that calls `app.prevent_delete()` and raises an exception. If an `UPDATE` path was intended, the error message makes that clear. Direct hard deletes on the underlying `app._foo` tables are still allowed at the database layer for admin cleanup, but no application code should go that route.

### Audit columns on every table

All business tables carry the same six columns:

```
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id)
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id)
deleted_at  TIMESTAMPTZ
deleted_by  UUID REFERENCES app._user_profiles(user_id)
```

All six of these columns are maintained automatically by the `app.set_audit_fields()` BEFORE INSERT OR UPDATE trigger on every table. Application code must not set `created_by`, `updated_by`, `created_at`, or `updated_at` itself — the trigger overwrites them. `deleted_by` is auto-filled on soft-delete transitions if the caller sets only `deleted_at`. See the **Attribution** section below for how attribution flows from the application into the trigger.

### Tenant safety via composite foreign keys

Anywhere a child row references another row "in the same office" (e.g., a matter's responsible attorney, a task's assignee, an entity role linking to a matter), the FK is a composite `(office_id, <child_id>)` pointing at a composite unique key on the parent. This makes it impossible for a matter in Office A to reference an attorney who is only an employee of Office B.

Each office-scoped table therefore carries a `<table>_office_uk UNIQUE (office_id, <id>)` constraint that exists solely so other tables can compose against it.

### Indexes are partial on `deleted_at IS NULL`

Because reads happen through the active view, partial indexes matching the view's predicate keep index scans tight and skip soft-deleted rows. FK columns that are also nullable additionally include `... IS NOT NULL` in the predicate.

## Identity model

### `auth.users` → `_user_profiles` → role-specific tables

- **`auth.users`** is Supabase-managed. It owns login, sessions, email verification, etc. You do not write to it directly.
- **`app._user_profiles`** is a 1:1 mirror keyed by `user_id = auth.users.id`. It owns user-editable display data (`display_name`, optional personal `phone`) and is the FK target for every `created_by` / `updated_by` / `deleted_by` across the schema. It persists even if a user ever leaves, so historical authorship always resolves.
- **`app._employees`** is `(office_id, user_id)`-keyed and owns **firm-controlled** identity data: `full_legal_name` (the name that appears on engagement letters and filings), `bar_numbers` (JSONB array of `{state, number}`), `dashboard_roles`. A user can be an employee at multiple offices by having multiple rows.
- **`app._entities`** is the registry of external people and organizations (clients, opposing parties, witnesses, experts, external attorneys). Each entity is scoped to one office.

The split between `_user_profiles.display_name` and `_employees.full_legal_name` is deliberate:

- `display_name` is user-editable — what appears next to an avatar, in mentions, etc. Purely cosmetic.
- `full_legal_name` is firm-controlled, set during onboarding, and used anywhere legal identity matters (signature blocks, bar filings, attorney of record, client-facing invoices).

### Auth triggers

Two triggers on `auth.users` keep `_user_profiles` in sync:

- `on_auth_user_created` (AFTER INSERT) calls `app.handle_new_auth_user()`, which sets `app.acting_user_id = NEW.id` and inserts a `_user_profiles` row with `display_name` seeded from `raw_user_meta_data->>'name'`, plus `email`/`phone` copied from `auth.users`. The `set_audit_fields` trigger self-attributes `created_by`/`updated_by` to the new user (FK satisfied at statement end).
- `on_auth_user_updated` (AFTER UPDATE, guarded by `WHEN OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone`) calls `app.handle_auth_user_updated()`, which sets `app.acting_user_id = NEW.id` and mirrors the email/phone changes.

Both trigger functions are `SECURITY DEFINER` with `search_path = ''` because the auth service role doesn't have privileges on the `app` schema.

## Attribution

Every write to an `app._*` table must be attributed to a user. This is enforced by the `app.set_audit_fields()` BEFORE INSERT OR UPDATE trigger, which reads the per-transaction GUC `app.acting_user_id` and uses it to populate `created_by` / `updated_by` (and `deleted_by` on soft-delete transitions). If the GUC is unset, the trigger raises — you cannot silently write an unattributed row.

The GUC is set by the shared `runAs(user_id, fn)` helper in `@makase-law/shared`, which opens a Kysely transaction, calls `set_config('app.acting_user_id', user_id, true)` on that connection, stashes the transaction handle in `AsyncLocalStorage`, then runs `fn`. Every Kysely query inside `fn` that goes through `getDb()` runs on that same pinned connection, so writes land in the attributed transaction. On commit or rollback, the GUC is automatically cleared (`is_local = true`).

The Hono API wires this into a `withTx` middleware that wraps mutating requests in `runAs(c.get("user_id"), next)`. GET requests skip the wrapper because they issue no writes. Cron jobs, admin scripts, and migrations call `runAsSystem(fn)` (or `runAs(SYSTEM_USER_ID, fn)`), which attributes to the seeded SYSTEM user. See the API's `apps/api/src/middleware/withTx.ts` and the shared package's `src/runAs.ts` for the implementation.

**Consequences for application code:**

- Never pass `created_by`, `updated_by`, `created_at`, `updated_at` in a service's `insert`/`update` payload — the trigger overwrites them.
- To soft-delete, set `deleted_at = NOW()`. The trigger fills `deleted_by` from `app.acting_user_id`. If your caller already knows the actor (rare), they can set `deleted_by` explicitly.
- Any code path that writes — including migrations with backfills, seed scripts, and one-off psql sessions — must first set `app.acting_user_id`, typically via `SELECT set_config('app.acting_user_id', '<uuid>', true)` inside a transaction.

### SYSTEM user

`SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'` is seeded by the core migration:

- A row in `auth.users` with `email = 'system@makase.internal'`, `banned_until = 'infinity'`, no password. It cannot log in.
- A row in `app._user_profiles` with `display_name = 'SYSTEM'`, created automatically by the `on_auth_user_created` trigger.

Use `runAsSystem(fn)` from `@makase-law/shared` for unattended writes. Audit rows authored by automated processes will show up with `created_by`/`updated_by` pointing at the SYSTEM row, making them easy to filter from human-authored activity.

## Matter staffing

Two separate mechanisms attach people to matters, and the distinction is intentional:

- **`_matter_staff`** attaches **firm employees** to matters with a staffing role (`responsible`, `supervising`, `lead`, `counsel`, `support`). A partial unique index enforces exactly one `responsible` per active matter. This is the mechanism for "who at our firm is working this case."
- **`_entity_roles`** attaches **external entities** to matters with a role (`client`, `prospective_client`, `opposing_party`, `witness`, `expert`, `attorney`, `other`). The `'attorney'` role here refers to external counsel — opposing, co-counsel from another firm, etc.

The `role` column on `_matter_staff` describes position on the matter team, not job title. Derive "Lead Paralegal" in the UI from `(_matter_staff.role = 'lead', _employees.<title>)`.

## Extending the schema

When you add a new table to `app`, follow the template:

```sql
CREATE TABLE app._foo (
    foo_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    -- domain columns here
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),
    CONSTRAINT foo_office_uk UNIQUE (office_id, foo_id)
);

CREATE VIEW app.foo WITH (security_invoker = true)
AS SELECT * FROM app._foo WHERE deleted_at IS NULL;

CREATE INDEX ON app._foo(office_id) WHERE deleted_at IS NULL;

CREATE TRIGGER foo_audit BEFORE INSERT OR UPDATE ON app._foo
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.foo
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();
```

If the new table needs tenant-safe FK references from other tables, the composite `(office_id, foo_id)` unique constraint above is what enables them.

## Bootstrap / seed flow

Because every `created_by` is FK-enforced and the audit trigger demands `app.acting_user_id`, first-row ordering matters:

1. The core migration seeds the SYSTEM user (both `auth.users` and via the auth trigger, `app._user_profiles`). SYSTEM's `_user_profiles` row self-attributes through the trigger's self-referential FK.
2. A human signs up via Supabase auth → `on_auth_user_created` fires under `app.acting_user_id = NEW.id` → their `_user_profiles` row is created with self-attribution.
3. That user (inside a `runAs(user_id, fn)` scope — typically the API's `withTx` middleware) creates the first `_offices` row and their own `_employees` row.

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
- **RLS policies on `app`** — not added. Currently unnecessary because the schema is not exposed via PostgREST. Revisit if/when direct `supabase-js` client access is introduced.
- **`app._audit_log` with JSONB diffs** — planned. `changed_by` will derive from the row's `updated_by` (not directly from `app.acting_user_id`), so nothing about that design changes with the attribution trigger in place.
