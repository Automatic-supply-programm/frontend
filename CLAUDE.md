# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server on http://localhost:3000
npm run build     # tsc + vite build → dist/
npm run lint      # ESLint
npm run preview   # Serve dist/ locally
```

No test suite is configured.

Dev server proxies `/api/*` → `http://localhost:8080` (Spring Boot backend).

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (default: `/api`) |
| `VITE_MOCK=true` | Enable in-memory mock mode (no backend required) |

`.env.local` → local dev (port 8080). `.env.production` → Railway deployment URL.

## Architecture

### State Management

Redux Toolkit with a single `baseApi` (RTK Query) in `src/api/baseApi.ts`. All feature APIs inject endpoints into `baseApi` — they are not standalone slices. Cache tag types: `Material`, `Request`, `User`, `EventLog`, `Dashboard`.

Auth state lives in `src/features/auth/authSlice.ts` (token persisted to `localStorage` under key `wh_token`). On 401 response, `baseApi` auto-dispatches `logout()`.

### API Layer

`baseApi` unwraps the backend envelope `{ message, data: T }` → returns `T` directly. Authorization header uses non-standard format `Bearer_<token>` (underscore, not space).

**Mock mode** (`VITE_MOCK=true`): `mockBaseQuery` in `src/api/mockBaseQuery.ts` intercepts all RTK Query calls with a 150ms artificial delay. When mock is active, `authSlice` initializes with a pre-seeded `mockUser` (ADMIN role) so no login is needed.

### Routing & Access Control

`src/router/index.tsx` — `RequireAuth` checks token presence; `RoleGuard` wraps role-restricted routes.

`src/utils/roleAccess.ts` is the single source of truth for which roles can access which routes:

| Role | Routes |
|---|---|
| ADMIN | dashboard, warehouse, requests, users, event-logs |
| WORKER | dashboard, warehouse, requests |
| EMPLOYEE | dashboard, requests |
| MANAGER | dashboard, warehouse, requests, users, manager-logs |

### Feature APIs

Each domain has an API file in `src/features/<domain>/` that injects endpoints into `baseApi`:

- `authApi` — `/auth/login`, `/auth/logout`, `/user/me`
- `materialsApi` — `/materials/*`, supports filtering by archived/search/category/warehouseId/status
- `requestsApi` — three distinct query endpoints by role: `getMyRequests` (EMPLOYEE), `getAllRequests` (ADMIN), `getIncomingRequests` (WORKER/MANAGER)
- `usersApi` — `/admin/users/*` (ADMIN), `/manager/users` (MANAGER), `/user/list` (directory for all roles)
- `dashboardApi`, `eventLogsApi`

### UI

Ant Design 6 + React 19. All label/color mappings for enums live in `src/utils/statusLabels.ts` (request statuses, material statuses, categories, roles). Pages in `src/pages/` are thin orchestrators; business UI logic is in `src/components/<domain>/`.

### Backend Response Contract

Backend always returns `{ message: string | null, data: T }`. `baseApi` strips the wrapper. When adding new endpoints, expect `data` to already be unwrapped by the time RTK Query hooks return it.

### Deployment

Deployed to Vercel (SPA rewrite in `vercel.json`). Backend on Railway.
