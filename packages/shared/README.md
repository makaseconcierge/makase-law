# @makase-law/shared

The DB client, attribution helpers, request-context plumbing, and service layer that any server-side caller of the `app` schema must go through. Consumed today by `apps/api`; future cron jobs and admin scripts will use the same entry points.

## Exports

```
@makase-law/shared           → src/index.ts          (re-exports below)
@makase-law/shared/context   → src/context/index.ts  (only context+runAs helpers)
@makase-law/shared/schemas   → src/schemas/index.ts  (zod request validators)
```

From the root entry:

| Symbol | Where | Notes |
| --- | --- | --- |
| `_rootDb` | `db/_rootDb.ts` | Root Kysely client (`PostgresJSDialect`, `withSchema("app")`, `kysely-postgres-js`). **Only `runAs*` should call `.transaction()` on it** — every other consumer reads the pinned transaction from context. |
| `runAsUser(user_id, fn)` | `context/run-as.ts` | Opens a Kysely tx, sets `app.acting_user_id` GUC, stashes the tx in `AsyncLocalStorage`. One per request. |
| `runAsEmployee(employee, permissions, teamIds, fn)` | `context/run-as.ts` | Layers on top of `runAsUser`; sets `app.acting_office_id` GUC and provides the office-scoped `EmployeeContext`. |
| `runAsSystem(office_id, fn)` | `context/run-as.ts` | Bootstrap / cron path. Attributes to `SYSTEM_USER_ID`; `getScope` short-circuits to `"office"` so services bypass the permissions map. |
| `SYSTEM_USER_ID` | `context/run-as.ts` | `"00000000-0000-0000-0000-000000000001"` — seeded in the core migration. |
| `getUserContext()` / `getEmployeeContext()` | `context/logged-in-context.ts` | Read the active context inside services. Throw if not inside the matching `runAs*` scope. |
| `getScope(resource, action)` | `context/scope.ts` | Resolves caller's scope (`"office"` / `"team"` / `"self"`) from the merged permissions; throws 403-shaped error on miss. |
| `buildScopeFilter(...)` | `context/scope.ts` | Returns a Kysely query filter that respects scope (office-only, team + own, self only). |
| `matters`, `office`, `teams` | `services/office-scoped/*` | Office-scoped services. Require `runAsEmployee` (or `runAsSystem`). |
| `loggedInUserService` | `services/user-scoped/logged-in-user.service.ts` | User-scoped service. Requires `runAsUser` only. |
| `schemas` | `src/schemas/*` | Zod validators for request bodies (`OfficePatchSchema`, `MatterPatchSchema`, `JsonObjectSchema`). Pair with TS types via `satisfies` to catch DB drift. |

## Attribution model in one diagram

```
HTTP request
  └─ authenticateUser
       └─ runAsUser(user_id, next)
            ├─ BEGIN
            ├─ SELECT set_config('app.acting_user_id', user_id, true)
            ├─ AsyncLocalStorage.run({ db: trx, loggedInUserId: user_id }, next)
            │
            │   /office/:office_id/* paths only:
            │     authorizeEmployee
            │       └─ runAsEmployee(employee, permissions, teamIds, next)
            │            ├─ SELECT set_config('app.acting_office_id', office_id, true)
            │            ├─ AsyncLocalStorage.run({ ...userCtx, loggedInOfficeId, isAdmin,
            │            │                          isSystem: false, permissions, teamIds }, next)
            │            └─ services run with full EmployeeContext
            │
            └─ COMMIT (or ROLLBACK on throw — GUCs are LOCAL, cleared automatically)
```

The `app.set_audit_fields()` BEFORE-trigger raises if `app.acting_user_id` is unset, so you cannot silently write an unattributed row. The `app.acting_office_id` GUC drives RLS for office-scoped tables. All three `runAs*` helpers throw if you try to nest them (one actor per request).

## Service conventions

- Services live under `src/services/{office-scoped,user-scoped}/<resource>.service.ts` and are exported as namespaces (`export * as matters from ...`) so callers write `matters.list()`, `matters.get(id)`.
- Read operations call `getEmployeeContext()` / `getUserContext()` for `db` and apply `buildScopeFilter("resource", "action", { ... })` to limit rows by the caller's scope.
- Write operations skip explicit audit columns — let the trigger fill them. Throw if the caller lacks the relevant permission scope.
- Office-scoped services should never be called outside `runAsEmployee` or `runAsSystem` — `getEmployeeContext()` will throw a 500 if the context isn't there.
- Add a new service by mirroring an existing one (`matters.service.ts` is the most thorough example). Re-export it from `src/index.ts` as a namespace.

## Adding a Zod schema

```ts
// src/schemas/<resource>.schema.ts
import { z } from "zod";
import type { OfficePatch } from "@makase-law/types";

export const OfficePatchSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().nullable().optional(),
  // ...
}) satisfies z.ZodType<OfficePatch>;
```

The `satisfies z.ZodType<OfficePatch>` guard is the workspace pattern — if the DB column set drifts, TypeScript flags the schema. Re-export it from `src/schemas/index.ts`.

## Don't

- Don't import `_rootDb` outside `runAs*`. Reads through it skip the per-request transaction and side-step attribution.
- Don't pass `created_by`, `updated_by`, `created_at`, `updated_at`, or `deleted_by` in service payloads. Triggers own them.
- Don't open nested `runAs*` scopes — service composition (one service calling another inside the same scope) is fine; opening a new transaction is not.
