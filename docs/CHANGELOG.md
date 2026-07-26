# Changelog

All notable changes to New Me will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## How to use this file

Add entries under `[Unreleased]` as you ship things, grouped by:
- **Added** — new features
- **Changed** — changes to existing functionality
- **Fixed** — bug fixes
- **Removed** — removed features

When cutting a release, move `[Unreleased]` items into a new dated version section and bump `apps/mobile/app.json` to match. See the Release Process section in `CLAUDE.md`.

---

## [Unreleased]

## [1.3.0] — 2026-07-26

### Mobile

#### Added
- **Local habit reminders** — new Notification Settings screen (off Profile): master on/off toggle, add/edit/delete reminders scoped to a specific habit or general, cadence reuses the DAILY/WEEKLY/MONTHLY/YEARLY vocabulary habits already use. Delivered entirely on-device via `expo-notifications` — daily/weekly use native repeating triggers, monthly/yearly ("end of month"/"end of year") recompute the real end-of-period date and reschedule on each app open
- One-time notification permission prompt on first app launch after login (custom prompt before the OS dialog)

#### Fixed
- **Expired sessions no longer show blank screens.** No screen previously checked for a 401, so an expired 1h access token meant every fetch silently failed while the user still looked logged in. Rotating refresh tokens (30-day sliding expiry — active use never requires re-login, 30 days of inactivity does) now refresh access tokens transparently; if the refresh token itself is dead, the app logs out and redirects to Login instead of showing nothing

### Backend

#### Added
- `NotificationRule` model + `/notifications` routes (master toggle, rule CRUD)
- Rotating refresh tokens: `POST /auth/refresh` (validates + rotates), `POST /auth/logout` (revokes) — refresh tokens are stored only as a SHA-256 hash, never in plaintext

## [1.2.0] — 2026-07-12

### Mobile

#### Added
- **Calendar screen** (formerly "Weekly") — 4 scoped views (Day / Week / Month / Year), each showing only habits whose `frequencyType` matches that scope, so a "gym 5x/week" habit lives in the Week view and a "vacation 2x/year" habit lives in the Year view, not every view
- **Multi-completion habit logging** — DAILY habits with `frequencyCount > 1` (e.g. "eat 2x/day") can log multiple timestamped completions per day via the new `HabitLog` data; Daily view shows a progress bar, each logged time, and a way to undo a specific entry
- **OTA auto-update** — checks for a JS-only update on every launch and applies it immediately instead of waiting for the next cold start
- **Native update notifier** — modal (matching the delete-habit confirmation style) prompts the user to update via TestFlight when a new native build exists, since Apple never allows silent native updates
- **Dark keyboard** — `keyboardAppearance="dark"` on every text input (Login, Register, Create/Edit Habit)

#### Changed
- "Weekly" tab renamed to "Calendar"
- Week view now shows a `count/target` badge per habit row (e.g. "3/5") instead of just cell icons

#### Fixed
- `useFocusEffect` → `useIsFocused` on Week and Profile screens — data no longer stays blank when the token loads from SecureStore after an app restart

### Backend

#### Added
- `HabitLog` model + `GET/POST /habit-logs`, `DELETE /habit-logs/:id` — supports multi-completion habits
- `GET /app-version` — lets the mobile app tell OTA-updatable JS changes apart from native rebuilds

---

## [1.1.0] — 2026-07-04

### Mobile

#### Added
- **Profile screen** — avatar (first letter of email decoded from JWT), stat grid (this week completion %, habit count, today done, streak), per-habit 7-dot completion bars for the current week, sign out button
- **Modal Add Habit** — slides up as a dark bottom sheet over the habit list instead of navigating to a full screen; notes field included; tapping the backdrop dismisses it
- **SVG check/X icons** — `react-native-svg` icons from the web app's design assets replace plain-text ✓/✗ characters in both the habit list and the weekly grid

#### Changed
- **Login / Register** — full dark redesign: glowing "New Me" title, cyan-bordered inputs, green primary button, text-link secondary, logo, no white header bar
- **Home screen** — dark card list, progress bar, color-coded habit names by status (green done / red missed / cyan unset)
- **Weekly screen** — dark week grid, date navigation arrows, today column highlight, SVG cell icons
- **Tab bar** — custom floating dark bar with Feather icons (Home / Weekly / Profile), green border, drop shadow
- Sign out moved from Home screen to Profile

#### Fixed
- **Timezone bug** — dates near midnight would flip to the next day for US timezones because `toISOString()` returns UTC. All date helpers now use local time methods.

---

## [1.0.0] — 2026-06-27

### Project

#### Added
- GitHub labels, issue templates (epic / story / bug / idea), docs folder structure
- `docs/` with vision, web, mobile, and backend requirements docs
- GitHub Projects board for tracking epics and stories

### Mobile

#### Added
- Bottom tab navigation (Home, Weekly)
- Week view screen with 7-day grid and date navigation
- Daily check-in interaction (null → done → missed → null cycle) with optimistic UI updates and rollback on failure
- Create Habit screen
- Edit Habit screen
- Delete Habit with confirmation dialog
- Auth flow (Login, Register screens)
- JWT token storage with `expo-secure-store`

---

## [0.1.0] — 2026-01-22

### Web

#### Added
- Weekly habit grid with day-of-week columns
- Three-state day toggle (not set / done / missed)
- Add, edit, and delete habits
- JWT authentication (login, register)
- REST API with Express + Prisma + SQLite
