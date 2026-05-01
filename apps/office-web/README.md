# office-web

Vite + React 19 firm-facing client. Talks to the Hono API at `VITE_API_URL`; uses Supabase JS only for auth (magic-link / OTP).

## Running

```bash
bun run dev         # vite, port 5173
bun run build       # tsc -b && vite build
bun run typecheck   # tsc --noEmit
bun run lint        # eslint .
```

## Environment

`apps/office-web/.env`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Hono API base URL (e.g. `http://localhost:8000`). |
| `VITE_SUPABASE_URL` | Supabase URL (local: `http://localhost:54321`). |
| `VITE_SUPABASE_PUBLIC_KEY` | Supabase anon/publishable key. |

## Stack

- **Routing** — [`wouter`](https://github.com/molefrog/wouter), declared in [`src/components/dashboard/routes.tsx`](src/components/dashboard/routes.tsx).
- **Data fetching** — [`swr`](https://swr.vercel.app/), wrapped in [`src/apis/use-simple-swr.ts`](src/apis/use-simple-swr.ts) which composes with the auth-aware `useApi` / `useOfficeApi` from [`src/apis/use-api.ts`](src/apis/use-api.ts).
- **Auth** — Supabase JS, see [`src/apis/supabase.ts`](src/apis/supabase.ts) and [`src/contexts/auth-context-provider.tsx`](src/contexts/auth-context-provider.tsx).
- **UI** — shadcn-style primitives (in [`src/components/ui/`](src/components/ui/)) on top of [`@base-ui/react`](https://base-ui.com/) — **not Radix**. Use Base UI's `render` prop instead of Radix's `asChild`. CSS anchor vars are `--anchor-width` / `--available-height`, not `--radix-*`.
- **Styling** — Tailwind v4 via `@tailwindcss/vite`, theme variables in [`src/index.css`](src/index.css), light/dark theme handled by [`src/components/theme-provider.tsx`](src/components/theme-provider.tsx) (press `D` to toggle when not in a text field).
- **Toasts** — `sonner`, wired in [`src/components/ui/sonner.tsx`](src/components/ui/sonner.tsx).
- **Icons** — `lucide-react`.

## Layout

```
src/
  main.tsx                  ThemeProvider → App
  App.tsx                   AuthContextProvider → OfficeContextProvider → Dashboard, plus Toaster
  apis/
    supabase.ts             Supabase JS client (auth only)
    use-api.ts              useApi(basePath) + useOfficeApi() — adds Bearer JWT, prepends VITE_API_URL
    use-simple-swr.ts       useSimpleSWR / useSimpleOfficeSWR — SWR + useApi
  contexts/
    auth-context-provider.tsx     Owns Supabase session; renders LoginPage when signed out;
                                  fetches /my/profile + /my/offices and provides UserContext
    access-token-context.ts       JWT for downstream API calls
    user-context.ts               Profile + offices the user belongs to
    office-context-provider.tsx   Lets the user pick an office; fetches /office/:id/info,
                                  /my/teams, /my/roles, /my/employment in parallel; merges
                                  permissions via mergeRolePermissions
    office-context.ts             OfficeContext (officeInfo, teams, permissions, isAdmin, roles)
    selected-office-id-context.ts persists selectedOfficeId in localStorage
  components/
    dashboard/                    Sidebar, breadcrumbs, office switcher, nav user, routes
    ui/                           shadcn-style primitives (Base UI under the hood)
    theme-provider.tsx            Light/dark/system theme + 'D' hotkey
  hooks/                          use-breadcrumbs, use-is-mobile
  lib/utils.ts                    cn() (clsx + tailwind-merge)
  pages/
    login/login-page.tsx          Magic-link / OTP login
    leads/, matters/, tasks/,
    billing/                      placeholder pages — WIP
```

## Boot flow

```
main.tsx
  └─ ThemeProvider
       └─ App
            └─ AuthContextProvider
                 ├─ supabase.auth.getSession() → loading? <LoadingDashboard />
                 ├─ no session?               → <LoginPage />
                 └─ session
                      └─ AccessTokenContext.Provider
                           └─ UserContextProvider  (SWR /my/profile + /my/offices)
                                └─ OfficeContextProvider
                                     ├─ pick office (localStorage default)
                                     ├─ SelectedOfficeIdContext.Provider
                                     └─ OfficeContextFetcher
                                          (parallel SWR for /office/:id/info, /my/teams,
                                           /my/roles, /my/employment) → mergeRolePermissions
                                          └─ <Dashboard />
                                               ├─ <AppSidebar />     (OfficeSwitcher, nav, NavUser)
                                               └─ <Routes />          (wouter Switch)
```

Any required-data fetch returning `undefined` causes the wrapper to render `<LoadingDashboard />` so consumers below can assume data is present.

## API calls

Use `useOfficeApi()` for office-scoped endpoints — it auto-prefixes `/office/{selectedOfficeId}` and attaches the Supabase JWT:

```tsx
const api = useOfficeApi()
const { data } = useSWR("/matters", api)
```

Or `useSimpleOfficeSWR("/matters")` which composes the two and integrates with the loading-dashboard pattern.

## Auth flow notes

- Login is magic-link only by default; users can switch to a 6-digit OTP from the same screen.
- Signups are invite-only — the email must already exist in `auth.users`. See the root README for how to invite.
- After clicking a magic link, the user lands back on `window.location.origin`; the previous href is stashed in `localStorage["makase.com:loggedInHref"]` and restored after session load.
