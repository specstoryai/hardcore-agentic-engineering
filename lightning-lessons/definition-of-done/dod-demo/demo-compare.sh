#!/usr/bin/env bash
# Same prompt, side by side:
#   LEFT  = Claude alone        (says done, stops, ships the bug)
#   RIGHT = Claude + the harness (says done, gate fails, loops, fixes, gate passes)
#
#   ./demo-compare.sh          real Claude in both panes
#   ./demo-compare.sh --mock   deterministic fake agent (clean recording takes)

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
MODE="${1:-}"

command -v tmux >/dev/null || {
  echo "needs tmux. Run separately:  node vanilla.mjs ${MODE}   and   node harness.mjs ${MODE}"
  exit 1
}

tmux kill-session -t dod 2>/dev/null || true
tmux new-session -d -s dod -x 240 -y 56

# left pane: Claude alone
tmux send-keys -t dod "cd '$DIR'; clear; printf '\n  ▌ CLAUDE ALONE — says done, stops\n'; WORKDIR=/tmp/dod-vanilla node vanilla.mjs ${MODE}" Enter

# right pane: Claude + the harness + the gate
tmux split-window -h -p 50 -t dod
tmux send-keys -t dod "cd '$DIR'; clear; printf '\n  ▌ CLAUDE + HARNESS — gated on a real check\n'; WORKDIR=/tmp/dod-harness node harness.mjs ${MODE}" Enter

tmux select-pane -t dod -L
tmux attach -t dod
