# Backend — Requirements & API

Stack: Node / Express, custom backend, shared database for web + mobile

## Current Status

- ✅ Auth (registration, login) — working, used by both clients
- ✅ Habit CRUD endpoints — used by web today
- ✅ Daily check-in data model — supports empty/checked/missed state per habit per day
- ⚠️ Mobile currently only calls read endpoints — write endpoints exist (web uses them) but aren't yet called from mobile

## API Surface (fill in as you confirm exact routes)

> Note: fill in real endpoint paths/methods here as you document them — this is a placeholder structure.

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Habits
- `GET /api/habits` — list habits for the authenticated user
- `POST /api/habits` — create a habit
- `PUT /api/habits/:id` — update a habit
- `DELETE /api/habits/:id` — delete a habit

### Check-ins
- `POST /api/habits/:id/checkin` — set status for a given date (empty/checked/missed)
- `GET /api/habits/:id/checkins` — get check-in history for a habit

## Data Model (sketch — confirm against actual schema)

**User**
- id, email, password (hashed), created_at

**Habit**
- id, user_id, name, created_at

**Checkin**
- id, habit_id, date, status (`empty` | `checked` | `missed`)

## Open Questions

- Is there request validation (e.g. via a schema library) or manual checks?
- Error handling convention — consistent error shape across endpoints?
- Any rate limiting / auth token expiry behavior to document?
- Database used — Postgres/Mongo/etc, and is there a migrations setup?
