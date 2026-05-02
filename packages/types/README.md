# @makase-law/types

Generated Kysely types plus hand-written write-shape helpers. Codegen runs against the local Supabase Postgres via [Kanel](https://kristiandupont.github.io/kanel/) + `kanel-kysely`.

## Generating types

```bash
bun run db:types        # from any workspace — runs kanel against local Postgres
```

`bun db:reset` from the repo root regenerates types as its last step. Run `bun db:types` on its own when you've edited a migration but don't want to wipe data.

Kanel reads from `postgresql://postgres:postgres@localhost:54322/postgres` per [`kanel.config.cjs`](./kanel.config.cjs); `supabase start` must be running.

## Layout

```
packages/types/
  kanel.config.cjs              codegen config (schemas, type overrides, naming hooks)
  src/
    index.ts                    public surface — re-exports DB + makase-types
    json-types.ts               recursive JsonValue helper
    custom/
      Permissions.ts            Permissions type used by roles.permissions JSONB column
    makase-types.ts             hand-written write shapes (NewOffice, OfficePatch, ...)
    generated/                  ⛔ regenerated on every `db:types` — do not edit
      Database.d.ts             Kysely DB type
      app/*.d.ts                one per `app.*` table
      auth/Users.d.ts           the slice of auth.users we read for typing
```

## Public types

From [`src/index.ts`](src/index.ts) (which re-exports [`makase-types.ts`](src/makase-types.ts)):

- **`DB`** — Kysely database type. Use as `Kysely<DB>`.
- **Row types** — `Office`, `Employee`, `Matter`, `Team`, `Role`, `Entity`, `EntityRoleLink`, `TimeEntry`, `Lead`, `Task`, `Invoice`, `Expense`, `InvoicePayment`, `UserProfile`, `User`. These wrap the generated table types in `DatesToStrings<T>` so JSON round-trips don't break consumers.
- **`New<Resource>`** — insert shape, with audit columns stripped. Most also strip `office_id` since it's pinned by `runAsEmployee` context.
- **`<Resource>Patch`** — partial update shape, strips audit columns and the table's PK and `office_id`.
- **`Permissions`** — `{ [resource]: { [action]: "self" | "team" | "office" } }` — type of `roles.permissions` JSONB column.
- **`JsonValue`** — recursive type for arbitrary JSONB columns.

`AuditColumns` (the type aliased internally) is `created_at | created_by | updated_at | updated_by. Stripping these from write shapes is the boundary that prevents callers from accidentally setting trigger-owned columns. is_deleted is also stripped from write shapes as this field will be exclusivly controlled by a dedicated delete function

## When to regenerate

Any of:
- adding/removing/renaming columns in `supabase/migrations/`
- changing JSONB column shapes (need a `Permissions`-style override?)
- adding a new table or view to the `app` schema
- adding/changing functions that should be callable from Kysely (functions are mostly filtered out today — flip the config if you need them)

If you add a new table, also add a corresponding hand-written block to [`makase-types.ts`](src/makase-types.ts):

```ts
export type Foo = DatesToStrings<Foos>;
export type NewFoo = Omit<NewFoos, AuditColumns | "office_id">;
export type FooPatch = Partial<Omit<Foo, AuditColumns | "foo_id" | "office_id">>;
```

## kanel.config.cjs notes

- Schemas scanned: `app`, `auth` (auth filtered down to `users` only since we only need a row type for FK resolution).
- The `app.*` underscore/view soft-delete pattern: views (`app.foo` over `app._foo`) are exposed in the Kysely DB type so app code can `.selectFrom("foo")` against the active view.
- JSONB columns default to `JsonValue`; `roles.permissions` is overridden to `Permissions`.
- All UUID columns become `string` rather than a branded `UUID` type — keeps service code ergonomic.

## Don't

- Don't hand-edit anything under `src/generated/` — it's wiped on every `db:types`.
- Don't import generated types directly (`./generated/app/Foo.js`) from outside this package — go through `makase-types.ts` so consumers get the `DatesToStrings`-wrapped row type and the right write shapes.
