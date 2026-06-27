# Web App — Requirements & Status

Stack: React + Vite

## Current Status

| Feature | Status |
|---|---|
| Registration | ✅ Working |
| Login | ✅ Working |
| Create habit | ✅ Working |
| Read/list habits | ✅ Working |
| Update habit | ✅ Working |
| Delete habit | ✅ Working |
| Daily check-in (empty / checked / missed grid) | ✅ Working |
| Streaks | ❌ Not built |
| Reminders | ❌ Not built |
| Stats / insights | ❌ Not built |

## Known Gaps / To Audit

- [ ] Form validation on habit create/edit — what happens on empty/invalid input?
- [ ] What happens if you delete a habit that has historical check-in data?
- [ ] Is there a limit on how many habits a user can create?
- [ ] Mobile-responsive? (separate from the React Native app — does the web app work on a phone browser?)

## Requirements (Phase 1 scope)

- A user can register and log in.
- A user can create a habit with at least a name.
- A user can see all their habits in a list/grid.
- For each habit, a user can mark each day as: not yet logged (empty), completed (checked), or missed (X).
- A user can edit a habit's name/details.
- A user can delete a habit.

## Open Questions

- Does "missed" get set automatically at end of day, or only manually by the user?
- Can habits have a custom frequency (daily vs. specific days of week), or are they all daily right now?
