#!/usr/bin/env bash
# Ship a change to the demo in ONE command. Run from anywhere:
#
#   ./ship.sh "what changed"        (or: npm run ship -- "what changed")
#
# 1) commits + pushes THIS repo (the demo)
# 2) if the agentic-engineering course repo is on this machine, bumps its
#    submodule pointer to the new commit (commits it locally; does NOT push it,
#    so you stay in control of when the course repo goes up)
#
# Foolproof: handles "nothing to commit", a missing course repo (e.g. a fork),
# and a missing git identity.

set -euo pipefail

MSG="${*:-update dod-demo}"
HERE="$(cd "$(dirname "$0")" && pwd)"
COURSE="/Users/gdc/extract-agentic-engineering"
SUBPATH="marketing/maven-lessons/dod-demo"

ident() {
  git config user.name  >/dev/null 2>&1 || git config user.name  "Greg Ceccarelli"
  git config user.email >/dev/null 2>&1 || git config user.email "greg@specstory.com"
}

# 1) the demo repo
cd "$HERE"; ident
if [ -n "$(git status --porcelain)" ]; then
  git add -A && git commit -q -m "$MSG" && echo "✓ committed: $MSG"
else
  echo "• no changes to commit"
fi
git push -q && echo "✓ pushed $(basename "$HERE") -> origin"

# 2) the course repo's submodule pointer
if [ -d "$COURSE/.git" ] && [ -e "$COURSE/$SUBPATH" ]; then
  cd "$COURSE"; ident
  git submodule update --remote -q "$SUBPATH"
  if [ -n "$(git status --porcelain -- "$SUBPATH")" ]; then
    git add "$SUBPATH" && git commit -q -m "Bump dod-demo: $MSG"
    echo "✓ course pointer bumped (local commit — push agentic-engineering when ready)"
  else
    echo "• course pointer already current"
  fi
else
  echo "• course repo not on this machine — skipped pointer bump (fine for a fork)"
fi
echo "✔ done."
