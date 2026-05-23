---
name: user-prefs
description: Code style preferences — comments policy
metadata:
  type: feedback
---

Never remove existing comments from files being edited.

**Why:** User explicitly said "don't remove any of my comments."

**How to apply:** When rewriting a file (Write tool), preserve all existing comment blocks verbatim. When editing with Edit tool, be careful not to accidentally drop comment lines above or below the changed region.

Add comments to new code written for this project.

**Why:** User asked to "add comments" to new files being created.

**How to apply:** Add short, purposeful comments explaining WHY (non-obvious constraints, redirect logic, env var behavior) — not WHAT.
