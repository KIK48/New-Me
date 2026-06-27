# Epics — Ready to Create on GitHub

Copy each section below into a new GitHub Issue using the "Epic" template.
Labels suggested per epic are listed — add the `epic` label (auto-added by template) plus phase + area labels.

---

## 1. Authentication & Accounts

**Labels:** `epic`, `phase-1`, `web`, `mobile`, `backend`

**Phase:** Phase 1 - Core Tracker
**Area:** web, mobile, backend

### Summary
Current state: registration and login work end-to-end on both web and mobile, against the shared Node/Express backend.
Desired state: documented, audited for edge cases (validation, error states, token expiry), and stable as a foundation for everything else.

### Why does this matter?
Every other feature depends on auth working reliably. Low glamour, high importance.

### Stories (draft — create as separate issues once ready)
- [ ] Audit registration validation (empty fields, duplicate email, weak password, etc.)
- [ ] Audit login error states (wrong password, unknown user, etc.)
- [ ] Document token/session expiry behavior
- [ ] (Optional) Password reset flow

---

## 2. Habit Management (Web)

**Labels:** `epic`, `phase-1`, `web`

**Phase:** Phase 1 - Core Tracker
**Area:** web

### Summary
Current state: full CRUD on habits works on web.
Desired state: audited for edge cases, validated, and documented as the reference implementation mobile needs to match.

### Why does this matter?
Web is currently the source of truth for "what a habit even is" in this app. Documenting it properly makes the mobile parity work much easier.

### Stories (draft)
- [ ] Audit create habit form (validation, required fields)
- [ ] Audit edit habit flow
- [ ] Audit delete habit flow (what happens to historical check-in data?)
- [ ] Document the exact data shape of a "habit" as currently implemented

---

## 3. Daily Habit Tracking (Web)

**Labels:** `epic`, `phase-1`, `web`

**Phase:** Phase 1 - Core Tracker
**Area:** web

### Summary
Current state: the check-in grid (empty / checked / missed boxes per day) works on web.
Desired state: audited, documented, and confirmed as the pattern mobile should replicate.

### Why does this matter?
This is the core daily-use loop of the entire app. It needs to be rock solid before anything else (streaks, reflection, etc.) builds on top of it.

### Stories (draft)
- [ ] Document exact interaction model (click to cycle states? click + menu?)
- [ ] Confirm how "missed" gets set (automatic at day end vs. manual)
- [ ] Audit what happens at month/week boundaries in the grid UI

---

## 4. Mobile Habit Parity ⭐ (current priority)

**Labels:** `epic`, `phase-1`, `mobile`

**Phase:** Phase 1 - Core Tracker
**Area:** mobile

### Summary
Current state: mobile has auth and read-only habit list. No create, update, delete, or check-in capability.
Desired state: mobile has full CRUD + daily check-in, matching web's functionality using the same backend endpoints.

### Why does this matter?
This is the biggest functional gap in the app right now and the stated next priority. Closing it makes mobile a genuinely usable client instead of a read-only viewer.

### Stories (draft)
- [ ] Add "Create Habit" screen/flow on mobile
- [ ] Add "Edit Habit" screen/flow on mobile
- [ ] Add "Delete Habit" flow on mobile (with confirmation)
- [ ] Add daily check-in interaction on mobile (tap/swipe to set empty/checked/missed)
- [ ] Confirm mobile is calling the same backend endpoints as web (no duplicate logic/schema drift)

---

## 5. Backend & API

**Labels:** `epic`, `phase-1`, `backend`

**Phase:** Phase 1 - Core Tracker
**Area:** backend

### Summary
Current state: working Node/Express API serving both clients, but undocumented.
Desired state: documented API contract (routes, payloads, error shapes) so both clients can rely on stable behavior, and validation gaps are identified.

### Why does this matter?
Both web and mobile depend on this. Documenting it now (see `docs/backend/requirements.md`) makes the Mobile Habit Parity epic faster since the endpoints already exist — mobile just needs to call them correctly.

### Stories (draft)
- [ ] Document every existing route, method, and payload shape
- [ ] Confirm validation exists on write endpoints (habit create/update, check-in)
- [ ] Document error response shape/consistency
- [ ] Document database schema as it actually exists today

---

## 6. Infrastructure & DevOps

**Labels:** `epic`, `phase-1`, `infra`

**Phase:** Phase 1 - Core Tracker
**Area:** infra

### Summary
Current state: code exists but no formal project structure, docs, issue tracking, or changelog.
Desired state: this exact setup — labels, issue templates, project board, docs skeleton, changelog — in place and in use.

### Why does this matter?
Everything else is easier to manage once there's a system for tracking it. This epic is essentially "today's work."

### Stories (draft)
- [x] Set up GitHub labels
- [x] Set up issue templates (epic, story, bug, idea)
- [x] Set up docs folder structure
- [ ] Set up GitHub Projects board
- [ ] Start using CHANGELOG.md going forward

---

## Future Phase Placeholder Epics

These capture the vision doc's later phases. Create as `idea`-labeled issues (not full epics yet) until you're ready to scope them — use the "Idea / Future Feature" template.

### 7. Streaks, Reminders, Calendar, Progress (rest of Phase 1)
Per vision doc Phase 1 — streaks and reminders weren't called out as already built in our conversation, so these likely still need building even though they're "Phase 1" in the vision doc.

### 8. Reflection & Journaling (Phase 2)
Journaling, weekly/monthly review, mood tracking, reflection summaries.

### 9. Identity Mode (Phase 3)
Identity creation, purpose, requirements, systems, habit linking back to identity.

### 10. Growth Analytics (Phase 4)
Progress toward identity, requirement health, personal dashboards, reflection trends.

### 11. Meet Past You / Letters Across Time (Phase 5)
Time capsules, growth timeline, yearly comparisons, letters across time, shareable growth summaries.
