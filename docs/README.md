# New Me — Docs

Quick map of everything in this folder.

- [`vision/philosophy.md`](./vision/philosophy.md) — the product vision and philosophy. Read this first. Everything else should trace back to it.
- [`epics/phase-1-epics.md`](./epics/phase-1-epics.md) — pre-drafted epics ready to copy into GitHub Issues, plus placeholders for future phases.
- [`web/requirements.md`](./web/requirements.md) — current status and requirements for the React/Vite web app.
- [`mobile/requirements.md`](./mobile/requirements.md) — current status and requirements for the React Native mobile app, including the parity gap.
- [`backend/requirements.md`](./backend/requirements.md) — API surface and data model for the Node/Express backend.
- [`CHANGELOG.md`](./CHANGELOG.md) — what's shipped, in order.

## How this is organized

This repo is set up like a small Jira, but native to GitHub:

| Jira concept | GitHub equivalent |
|---|---|
| Epic | Issue with `epic` label, using the Epic template |
| Story | Issue with `story` label, using the Story template, linked to a parent epic |
| Bug | Issue with `bug` label |
| Backlog idea | Issue with `idea` label — for Phase 2-5 concepts not yet scoped |
| Sprint board | GitHub Projects board (Backlog → Ready → In Progress → Done) |
| Epic/Story link | Task list (`- [ ] #issue_number`) inside the epic issue body |

No date-based milestones — this project moves at a weekends-whenever pace, so the board is organized by status and phase, not deadlines.

## Current state of the app (as of this doc)

- **Web** (React + Vite): full habit CRUD + daily check-in grid. Working.
- **Mobile** (React Native): auth works, habits are read-only. This is the active gap.
- **Backend** (Node/Express): shared by both clients, single database. Auth + habit CRUD endpoints exist and are used by web.

Active priority: **Mobile Habit Parity** — bring mobile up to web's functionality.
