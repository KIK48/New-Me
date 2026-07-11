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
