# Mobile App — Requirements & Status

Stack: React Native

## Current Status

| Feature | Status |
|---|---|
| Registration | ✅ Working |
| Login | ✅ Working |
| Read/list habits | ✅ Working (read-only) |
| Create habit | ❌ Not built |
| Update habit | ❌ Not built |
| Delete habit | ❌ Not built |
| Daily check-in | ❌ Not built |

## The Gap

Mobile currently has **zero write capability** for habits. This is the active epic: **Mobile Habit Parity**.

## Requirements (Mobile Habit Parity epic)

To reach parity with web, mobile needs:

- [ ] Create habit screen/flow (mirrors web's create form)
- [ ] Edit habit screen/flow
- [ ] Delete habit (with confirmation)
- [ ] Daily check-in interaction — tap to cycle empty → checked → missed (or however web's grid logic works)
- [ ] Same validation rules as web (keep them in sync, ideally enforced by the shared backend, not duplicated client-side logic)

## Open Questions

- Should the check-in interaction on mobile be a tap-to-cycle, swipe, or long-press? Web uses a grid of boxes — what's the equivalent mobile-native gesture?
- Is the mobile app using the same API client/SDK code as web, or duplicated fetch logic? (Worth checking — shared API logic reduces the parity gap permanently.)
