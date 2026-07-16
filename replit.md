# PeopleHub — HR Management

A comprehensive HR Management web application with Role-Based Access Control (Admin/Employee), time tracking, announcements, requests, and analytics dashboards.

## Run & Operate

- `pnpm --filter @workspace/hr-management run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter, Tailwind CSS, shadcn/ui, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, announcements, requests, time_entries, shifts)
- `artifacts/api-server/src/routes/` — Express route handlers (users, announcements, requests, time-entries, shifts, dashboard)
- `artifacts/hr-management/src/` — React frontend
  - `contexts/UserContext.tsx` — mock auth context with Admin/Employee role switcher
  - `pages/dashboard/` — Admin and Employee dashboard views with Recharts
  - `pages/announcements/` — Announcement feed + creation modal (Admin)
  - `pages/requests/` — Request table + approve/deny (Admin), new request form (Employee)
  - `pages/clock/` — Time tracking controls, shift schedule, admin attendance overview

## Architecture decisions

- **Mock Auth**: No login page. A role switcher in the sidebar lets you toggle between Sarah Chen (Admin) and Marcus Webb (Employee) instantly.
- **OpenAPI-first**: All API types are generated from `lib/api-spec/openapi.yaml`. Run codegen after any spec change.
- **Role-based views**: All four pages render completely different UI depending on the active role — Admin sees org-wide data, Employee sees personal data.
- **Dashboard summaries**: `/api/dashboard/admin` and `/api/dashboard/employee` return aggregated stats server-side for clean, fast dashboard queries.
- **Time entry state machine**: ClockIn → PauseStart → PauseEnd → ClockOut. Hours are computed server-side from ordered entry sequences.

## Product

- **Dashboard** — Employee: weekly hours, avg daily hours, request pie chart. Admin: total/active employees, attendance donut, requests by type bar chart.
- **Announcements** — Rich HTML post feed. Admins can create new announcements via modal.
- **Requests** — Employees submit Time Off / Equipment / Remote Work / Other requests. Admins approve/deny with one click.
- **Clock In/Out** — Employees track their day with Start/Pause/Resume/End controls and see their weekly shift schedule. Admins see a real-time attendance board.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Import hooks from `@workspace/api-client-react` (not `/api` subpath — that doesn't exist).
- The `useToast` hook lives at `@/hooks/use-toast`, not `@/components/ui/toast`.
- Time entry hours are computed from ordered entry sequences; ordering by `timestamp` is critical.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
