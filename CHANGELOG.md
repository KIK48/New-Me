# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Mobile

#### Added
- **Profile screen** — avatar (first letter of email), stat grid (this week completion %, habit count, today done, streak), per-habit dot bars for the current week, sign out button
- **Modal create habit** — Add Habit slides up as a dark bottom sheet over the habit list instead of navigating to a new screen; notes field included
- **SVG check/X icons** — `react-native-svg` icons from the web app's design replace plain-text ✓/✗ characters in the habit list and weekly grid

#### Changed
- **Login / Register screens** — full dark redesign: glowing "New Me" title, cyan-bordered inputs, green primary button, text-link secondary, logo, no white header bar
- **Home screen (HabitsScreen)** — dark card list, progress bar, color-coded habit names by status
- **Weekly screen (WeekScreen)** — dark week grid, date navigation, today column highlight, 7-day cell grid with SVG icons
- **Tab bar** — custom floating dark bar with Feather icons (Home / Weekly / Profile), green border, drop shadow
- Logout moved from Home screen to Profile screen

#### Fixed
- **Timezone bug** — dates near midnight would show the next day for US timezones because `toISOString()` returns UTC. All date helpers in `utils/dates.ts` now use local time methods.

---

## [0.4.0] — 2026-06-27

### Mobile

#### Added
- Bottom tab navigation (Home, Weekly)
- Week view screen with 7-day grid and date navigation
- Daily check-in interaction (null → done → missed → null cycle)
- Optimistic UI updates with rollback on failure

---

## [0.3.0] — 2026-06-20

### Mobile

#### Added
- Create Habit screen
- Edit Habit screen
- Delete Habit with confirmation dialog

---

## [0.2.0] — 2026-06-13

### Mobile

#### Added
- Auth flow (Login, Register screens)
- JWT token storage with `expo-secure-store`
- Read-only habit list

---

## [0.1.0] — 2026-01-22

### Web

#### Added
- Weekly habit grid with day-of-week columns
- Three-state day toggle (not set / done / missed)
- Add, edit, and delete habits
- JWT authentication (login, register)
- REST API with Express + Prisma + SQLite
