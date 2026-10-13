# Mobile App — Requirements & Status

Stack: React Native

## Current Status

| Feature | Status |
|---|---|
| Registration | ✅ Working |
| Login | ✅ Working |
| Read/list habits | ✅ Working |
| Create habit | ✅ Working (bottom-sheet modal, includes notes field) |
| Update habit | ✅ Working |
| Delete habit | ✅ Working |
| Daily check-in (today) | ✅ Working |
| Weekly check-in view | ✅ Working |
| Dark design system | ✅ Done (all screens) |
| Profile screen | ✅ Done (stats, dot bars, sign out) |
| Custom tab bar | ✅ Done (floating, Feather icons) |
| SVG check/X icons | ✅ Done (react-native-svg) |
| Loading states (login/register) | ❌ Not built |
| Real streaks | ✅ Working (frequency-aware, `utils/streak.ts`) |
| Reminders (local notifications) | ✅ Done (v1.3.0 — Notification Settings screen; remote push not built) |
| Delete account | ✅ Done (v1.4.0) |
| Progress analytics | ❌ Partial (Profile shows basic stats) |
| Habit rules / frequency | ✅ Working (DAILY/WEEKLY/MONTHLY/YEARLY + count) |
| Individual habit detail view | ✅ Done (HabitDetailScreen — 30-day dot grid, stats) |
| Multi-completion logging (e.g. "eat 2x/day", "workout 2x/month") | ✅ Done (`HabitLog`, any habit with a target above 1; counted across its whole period via `utils/periods.ts`) |
| Calendar screen (Day/Week/Month/Year, scoped by frequency) | ✅ Done |
| OTA auto-update + native update notifier | ✅ Done |
| Home screen redesign (swipe-to-delete, +/- modes) | ✅ Done |
| Home → Dashboard restructure | ❌ Not built |
| Profile → Account settings | ❌ Not built |
| Animations | 🟡 In progress (v1.4.0: progress bars, tab/view sliding highlights, habit card entrance) |
| Skeleton loading state | ❌ Planned (see below) |

## Planned

Features here are tagged with the version tier they belong to. The app will eventually ship three tiers — **Simple**, **Normal** and **Pay** — that users can switch between; the next release after 1.4.0 introduces the split. Until then everything is available to everyone.

### Calendar: view a habit at a larger scale
A habit can be viewed at its own scale or any **larger** one, never a smaller one (a "daily" habit makes sense as a week or month summary; a "yearly" habit makes no sense as a day).

| Habit scope | Can be viewed as |
|---|---|
| Day | Day, Week, Month, Year |
| Week | Week, Month, Year |
| Month | Month, Year *(later version)* |
| Year | Year *(later version)* |

Proposed UI: a second row of small pills under the Day / Week / Month / Year switcher, labeled "View as", listing only the allowed scales. Day and Week habits come first; Month and Year follow in a later version.

### Streaks page
A dedicated view of habits over time — likely line or bar graphs per habit, current streaks, best and worst habit, and streak history. **Needs more thought before building** (graph style, what "worst" means: lowest completion rate vs. shortest best streak). Streaks are currently computed on the phone from habit days (`utils/streak.ts`), so this can ship without a backend change.

### Carry credit — *Normal version*
Extra completions aren't wasted; they can cover other days. Example: "apply to 1 job per day" — log 3 jobs on Monday and the 2 extras cover Tuesday and Wednesday. Or "gym 5x/week": miss Monday–Friday, do it 5× on Saturday, and it covers Monday–Friday.

- Works **both directions** (backward and forward) from the day the habit was created.
- Every habit must allow several completions per day (already true for habits with a target above 1; a target of 1 would need it too).
- A new **carry** state, shown as the same checkmark in **blue**. The user **picks** which credit covers which day (and which time slot only where the Day view needs it).
- The user chooses when credit **expires**.
- Will change how streaks are calculated — design them together.

### Skeleton loading state
When a user logs in (or opens the app) and data takes a moment to arrive, show a **skeleton of the screen's layout** instead of an empty screen: greyed placeholder shapes where the progress card, habit cards, and (on Calendar) the date/view cards will be, replaced by the real content once the fetch finishes.

- **Why:** today Home, Calendar and Profile render empty until the three parallel fetches (`/habits`, `/habit-days`, `/habit-logs`) return. On a slow connection or a cold Render start (free tier can take up to a minute to wake) the app looks broken rather than loading.
- **Scope:** only shown when loading takes noticeable time, so a fast response doesn't flash a skeleton. Applies to Home, Calendar (all four views) and Profile.
- **Shape:** placeholders mirror the real cards (same size, radius, border) with a subtle pulse, using the existing design-system colors.

## Endpoint Verification Audit (Story #28)

Completed as part of Mobile Habit Parity epic. All mobile API calls map to existing backend routes with correct payload shapes.

| Operation | Endpoint | Mobile payload | Status |
|---|---|---|---|
| List habits | `GET /habits` | — | ✅ |
| Create habit | `POST /habits` | `{ name }` | ✅ |
| Update habit | `PUT /habits/:id` | `{ name }` | ✅ |
| Delete habit | `DELETE /habits/:id` | — | ✅ |
| Get habit days | `GET /habit-days` | — | ✅ |
| Save check-in | `PUT /habit-days` | `{ habitId, date, status }` | ✅ |
| Get habit logs | `GET /habit-logs` | — | ✅ |
| Log a completion | `POST /habit-logs` | `{ habitId, loggedAt? }` | ✅ |
| Undo a completion | `DELETE /habit-logs/:id` | — | ✅ |
| App version check | `GET /app-version` | — | ✅ |

**No duplicated validation logic on mobile.** The only client-side guard is blocking Save when the name field is empty — this is a UX guard, not business logic. All real validation (ownership, empty name, status enum) lives on the backend.

### Accepted discrepancy

The backend accepts a `notes` field on `POST /habits` and `PUT /habits/:id`. Mobile does not expose this field. This is **explicitly accepted** — neither the web create form nor the mobile form expose notes yet. Tracked as a future story.

## Open Questions (resolved)

- ~~Check-in interaction~~ — resolved: tap-to-cycle on both Home (today) and Week views.
- ~~Shared API logic~~ — resolved: both clients call the same endpoints with the same payloads. No shared SDK; each client has its own fetch calls, which is acceptable at this scale.
