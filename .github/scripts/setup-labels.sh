#!/usr/bin/env bash
# Creates all labels for KIK48/New-Me
# Requires: gh CLI (authenticated) — no jq needed
set -e

REPO="KIK48/New-Me"

create_or_update() {
  local name="$1" color="$2" desc="$3"
  if gh label list --repo "$REPO" --limit 100 | grep -q "^$name"; then
    gh label edit "$name" --repo "$REPO" --color "$color" --description "$desc" 2>/dev/null \
      && echo "  updated: $name" || echo "  skipped: $name"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" \
      && echo "  created: $name"
  fi
}

echo "Setting up labels for $REPO ..."

create_or_update "epic"            "7057ff" "Large body of work spanning multiple stories"
create_or_update "story"           "0075ca" "Single deliverable within an epic"
create_or_update "bug"             "d73a4a" "Something is broken"
create_or_update "idea"            "cfd3d7" "Future feature idea, not yet scoped"
create_or_update "phase-1"        "0e8a16" "Phase 1 — Core Tracker"
create_or_update "phase-2"        "a2eeef" "Phase 2 — Reflection"
create_or_update "phase-3"        "e4e669" "Phase 3 — Identity Mode"
create_or_update "phase-4"        "f9d0c4" "Phase 4 — Growth Analytics"
create_or_update "phase-5"        "fef2c0" "Phase 5 — Meet Past You"
create_or_update "web"             "bfd4f2" "React/Vite web app"
create_or_update "mobile"          "d4c5f9" "React Native mobile app"
create_or_update "backend"         "f9a825" "Node/Express API"
create_or_update "infra"           "b60205" "Infrastructure, DevOps, CI/CD"
create_or_update "blocked"         "e4e669" "Cannot progress until something else is resolved"
create_or_update "good first issue" "7fc97f" "Good for newcomers"

echo "Done."
