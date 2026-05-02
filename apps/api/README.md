# @makase-law/api

Hono API server (Bun runtime) sitting between the office-web client and Supabase Postgres. The schema lives in the locked-down `app` schema; this is the **only** thing that talks to it directly (PostgREST is disabled for `app`).

## Running

```bash
bun run dev      # bun --hot run main.ts, port 8000
bun run start    # production-mode start
```

## Environment

Loaded from `apps/api/.env`:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Used to fetch JWKS at `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` for JWT verification. Required at boot. |
| `DATABASE_URL` | Postgres connection string for the Kysely pool. Local default: `postgresql://api:api_local_dev_password@127.0.0.1:54322/postgres` (the `api` role is set up by `supabase/local_setup.sql` during `bun db:reset`). |
| `LOG_LEVEL` | Optional, defaults to `info`. `trace` / `debug` for verbose dev output. |

## Layout

```
apps/api/
  main.ts                          Hono app factory, CORS, global error handler, port 8000
  src/
    honoEnv.ts                     AppEnv type (c.get/c.set keys: user_id, employee)
    logger.ts                      @logtape/logtape sink config
    middleware/
      authenticateUser.ts          Verifies Supabase JWT + opens runAsUser(user_id, next)
      authorizeEmployee.ts         Resolves office employment + opens runAsEmployee(...)
    routes/
      user/index.ts                /my/profile, /my/offices (user-scoped)
      office/
        index.ts                   Mounts authorizeEmployee then sub-routers
        myRoutes.ts                /office/:id/my/employment, /my/teams, /my/roles
        officeInfoRoutes.ts        /office/:id/info  (GET, PATCH)
        matterRoutes.ts            /office/:id/matters, /matters/:matterId
```

Routes are chained (`.get().post().route()`) so the typed router is exported as `OfficeApi` / `UserApi` for RPC-style consumption later.

## Request lifecycle

```
Hono request
  └─ cors                           allows GET/POST/PATCH/OPTIONS, * origin
  └─ authenticateUser               401 if no JWT; sets c.get("user_id"); runAsUser(user_id, next)
       │
       │   ┌─ /my/*                 user routes — no office context
       │   └─ /office/:office_id/*
       │        └─ authorizeEmployee  403 if no employment in :office_id; sets c.get("employee");
       │                              runAsEmployee({ employee, permissions, teamIds, blockMatterIds, addMatterIds }, next)
       │             ├─ /info       OfficePatchSchema validation, office.* services
       │             ├─ /matters    matters.* services (scope-filtered)
       │             └─ /my/*       loggedInUserService.* (employment, teams, roles)
       │
       └─ onError                   logs and returns { error } JSON 500
```

The two `runAs*` calls together pin a Kysely transaction and set the per-tx GUCs (`app.acting_user_id`, `app.acting_office_id`) the audit triggers and RLS policies read. **Every** mutating endpoint inherits this for free — handlers should not call `_rootDb` directly or open their own transactions.

## Adding a route

1. Drop a file under `src/routes/office/` (or `user/`) that exports a chained `Hono<AppEnv>()` instance.
2. Mount it from the parent router (`office/index.ts` or `user/index.ts`).
3. Validate request bodies with `@hono/zod-validator` against schemas from `@makase-law/shared/schemas`.
4. Read user / office context via the service layer in `@makase-law/shared` — never reach into `_rootDb`.
5. Never set `created_by` / `updated_by` / timestamps in payloads; the trigger owns them.

## Error shape

- **401 `{ error: "unauthenticated", message }`** — JWT missing/invalid.
- **403 `{ code: "unauthorized", message }`** — authenticated user is not an employee of the URL office.
- **400** — Zod validator failure, returns the validator's error envelope.
- **500 `{ error }`** — anything thrown out of a handler; logged via `console.error` in `main.ts`.

Service-layer permission failures throw thrown errors, which surface as 500. If you need a typed 403 from a service, throw a structured error and translate it in the route handler.
