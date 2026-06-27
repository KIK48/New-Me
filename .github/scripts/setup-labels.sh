#!/usr/bin/env bash
# Creates all labels defined in .github/labels.json
# Requires: gh CLI (authenticated) and jq
set -e

REPO="KIK48/New-Me"
LABELS_FILE="$(dirname "$0")/../labels.json"

echo "Setting up labels for $REPO ..."

jq -c '.[]' "$LABELS_FILE" | while read -r label; do
  name=$(echo "$label" | jq -r '.name')
  color=$(echo "$label" | jq -r '.color')
  desc=$(echo "$label" | jq -r '.description')

  if gh label list --repo "$REPO" --limit 100 | grep -q "^$name"; then
    gh label edit "$name" --repo "$REPO" --color "$color" --description "$desc" 2>/dev/null && \
      echo "  updated: $name" || echo "  skipped: $name"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" && \
      echo "  created: $name"
  fi
done

echo "Done."
