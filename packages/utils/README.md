# @makase-law/utils

Tiny, dependency-free helpers usable on either side of the API boundary. Lives here (and not in `@makase-law/shared`) so the frontend can import from it without pulling Kysely or Postgres in.

## Exports

From [`src/permissions.ts`](src/permissions.ts):

- **`mergeRolePermissions(roles)`** — collapses an array of `{ permissions: Permissions }` into a single map. When the same `(resource, action)` appears in multiple roles, the broader scope wins (`office` > `team` > `self`). Used by:
  - `apps/api` in [`authorizeEmployee`](../../apps/api/src/middleware/authorizeEmployee.ts) middleware to build the per-request permissions map passed into `runAsEmployee`.
  - `apps/office-web` in [`office-context-provider.tsx`](../../apps/office-web/src/contexts/office-context-provider.tsx) to compute permissions for scope-aware UI rendering.

## Adding a helper

Add small, pure, framework-free utilities here. Anything that needs Kysely, Hono, or environment access goes in `@makase-law/shared` instead. Re-export new helpers from [`index.ts`](index.ts).
