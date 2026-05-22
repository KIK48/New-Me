# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

New-Me is a monorepo habit tracking app with a weekly-view UI. Three workspaces:
- `apps/web` — React 19 + Vite frontend (main feature area)
- `apps/api` — Express 5 REST API (port 4000)
- `packages/db` — Prisma + SQLite (better-sqlite3 adapter)

## Commands

Run these from the relevant workspace directory (e.g. `cd apps/web`):

```bash
# Frontend
npm run dev        # Vite dev server (port 5173)
npm run build      # tsc -b && vite build
npm run lint       # ESLint (flat config, ESLint 9+)
npm run preview    # Preview production build

# Backend
npm run dev        # ts-node-dev --respawn --transpile-only src/index.ts

# Database (from packages/db)
npx prisma migrate dev   # Apply migrations
npx prisma studio        # Open Prisma GUI
```

There are no tests configured yet.

## Architecture

### Frontend (`apps/web/src/`)

**Routing** — React Router v7, defined in `App.tsx`. Two routes: `/` (Home) and `/weekly` (the main feature). `MainLayout.tsx` wraps both with the Navbar via `<Outlet>`.

**Mode system** — `hooks/ModeContext.tsx` provides a React Context scoped to the Weekly page. Four modes: `"A"` (Add), `"M"` (Modify), `"D"` (Delete), `"S"` (Save). Clicking an active mode button toggles it off; only one mode is active at a time.

**API layer** — `api/` uses a `HabitsRepo` interface (`api/getHabits.ts`). `api/index.ts` currently exports a mock implementation (`mockHabitsRepo.ts`) that operates on in-memory arrays. Real API integration is not yet wired up.

**Types and utilities** — `Temps/types.ts` defines `Habit`, `Week`, and `HabitWeekStatus`. `Temps/week.ts` has date helpers (`getMondayISO`, `buildWeek`, `addDays`, `toISODate`). These live in `Temps/` pending a future refactor.

**Modals** — `modals/addHabit.tsx` and `modals/modifyHabit.tsx` use `ReactDOM.createPortal`. They lock body scroll on open.

### Backend (`apps/api/src/`)

Express REST API with CORS. Endpoints:
- `GET /health`
- `POST /habits` — `{ name, notes? }`
- `GET /habits` — ordered newest first
- `PUT /habits/:id` — `{ name?, notes?, isActive? }`
- `DELETE /habits/:id`

Imports `prisma` from `packages/db`.

### Database (`packages/db/`)

Single `Habit` model (id: cuid, name, notes?, isActive, createdAt, updatedAt). SQLite file at `packages/db/dev.db`. Prisma v7 requires the `better-sqlite3` adapter — it is wired in `src/prisma.ts`.

## Key Conventions

- **Three-state day toggles:** `null` (not set) → `true` (done) → `false` (skipped) → `null`
- **Week identity:** a week is keyed by its Monday's ISO date (`weekID`)
- **CSS:** Component-level CSS files in `src/styles/` mirror the component folder structure. Tailwind CSS v4 is used via Vite plugin (`@tailwindcss/vite`).
- **TypeScript:** Strict mode, no unused locals/params enforced. `apps/web/tsconfig.app.json` includes `packages/db/src` so Prisma types are available in the frontend.
