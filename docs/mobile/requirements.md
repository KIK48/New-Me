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
| Real streaks | ❌ Not built (mock on Profile) |
| Reminders / push notifications | ❌ Not built |
| Progress analytics | ❌ Partial (Profile shows basic stats) |
| Habit rules / frequency | ❌ Not built |
| Individual habit detail view | ❌ Not built |
| Home → Dashboard restructure | ❌ Not built |
| Profile → Account settings | ❌ Not built |
| Animations | ❌ Not built |

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

**No duplicated validation logic on mobile.** The only client-side guard is blocking Save when the name field is empty — this is a UX guard, not business logic. All real validation (ownership, empty name, status enum) lives on the backend.

### Accepted discrepancy

The backend accepts a `notes` field on `POST /habits` and `PUT /habits/:id`. Mobile does not expose this field. This is **explicitly accepted** — neither the web create form nor the mobile form expose notes yet. Tracked as a future story.

## Open Questions (resolved)

- ~~Check-in interaction~~ — resolved: tap-to-cycle on both Home (today) and Week views.
- ~~Shared API logic~~ — resolved: both clients call the same endpoints with the same payloads. No shared SDK; each client has its own fetch calls, which is acceptable at this scale.
