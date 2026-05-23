---
name: project-auth
description: JWT auth system added — architecture, env vars, and deployment notes
metadata:
  type: project
---

Auth added with email/password + JWT (1-hour expiry). Stack: bcryptjs (hashing), jsonwebtoken, dotenv.

**Backend (apps/api):**
- `src/routes/auth.routes.ts` — POST /auth/register, POST /auth/login
- `src/middleware/requireAuth.ts` — JWT validation middleware
- Applied to /habits and /habit-days in index.ts
- Env vars: JWT_SECRET, CORS_ORIGIN, PORT

**Frontend (apps/web):**
- `src/hooks/AuthContext.tsx` — token in localStorage, login/logout helpers
- `src/components/ProtectedRoute.tsx` — redirects to /login if no token
- `src/pages/login.tsx` — login + register on same page (toggle)
- `src/api/helpers/habits.ts` — all fetch helpers send Authorization header, handle 401 by clearing token and redirecting
- `App.tsx` wraps all routes except /login in ProtectedRoute
- `main.tsx` wraps everything in AuthProvider

**Why:** No public pages — all routes require login.

**How to apply:** When adding new API routes, add requireAuth as middleware. When adding new frontend routes, wrap them in ProtectedRoute in App.tsx.

**Deployment note:** SQLite won't work on Render/Vercel (ephemeral filesystem). Need to switch to Postgres (Neon/Supabase/Railway) and update DATABASE_URL. Prisma schema is already DB-agnostic.
