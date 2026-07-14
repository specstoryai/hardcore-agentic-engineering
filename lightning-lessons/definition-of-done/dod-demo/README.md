# dod-demo — a tiny harness of harnesses

The same idea as [deadreckon](https://github.com/), stripped to the bone: **the agent doesn't decide when it's done. A check does.**

The agent works in an isolated workspace (a temp dir) that holds only the file to edit and a brief. The real definition of done lives in `gate/`, which the agent **never sees**. After the agent says "done," the harness runs the gate; if it fails, the agent is pushed back. The loop ends only when the gate passes. Zero dependencies, plain Node.

## The demo: same prompt, two Claudes side by side

```zsh
./demo-compare.sh          # real Claude in both panes
./demo-compare.sh --mock   # deterministic fake agent (clean recording takes)
```

- **LEFT — Claude alone:** says "done," stops, and the gate it never ran shows it shipped a bug.
- **RIGHT — Claude + the harness:** says "done," the gate fails, it loops, fixes it, the gate passes.

Single runs:

```zsh
npm run harness        # the gated loop, real Claude (streams every tool call)
npm run vanilla        # regular Claude, real
npm run harness:mock   # deterministic versions for rehearsal / recording
npm run vanilla:mock
```

## Why the agent can't shortcut the demo

The brief omits one rule (`"Salt & Pepper"` must become `"salt-and-pepper"`). Because the agent is isolated and can't read `gate/`, it can't learn that rule until the gate fails and hands back the failing test. So vanilla **reliably** ships the bug, and the harness **reliably** loops to fix it. That gap — the brief vs. the gate — is the whole lesson.

## Files

- `BRIEF.md` — what the agent is told (the happy path)
- `gate/slugify.test.mjs` — the definition of done (the agent never sees it)
- `harness.mjs` — the gated loop
- `vanilla.mjs` — regular Claude, for the comparison
- `lib.mjs` — workspace isolation, the gate, the Claude stream printer
- `demo-compare.sh` — the tmux side-by-side

## Driving real Claude Code

The harness runs `claude -p "<brief>" --output-format stream-json --verbose --dangerously-skip-permissions`, parses the event stream, and prints each tool call live (`🔧 Edit slugify.mjs`, `🔧 Bash …`, `💬 …`). It re-invokes with `--continue` each turn so Claude remembers the gate's feedback. Flags may vary by version; adjust `runClaude()` in `lib.mjs`.

## Shipping a change

This repo is a submodule of the course repo, so a change normally needs two steps (push here, then bump the pointer there). `ship.sh` does both in one command:

```zsh
./ship.sh "what changed"        # or: npm run ship -- "what changed"
```

It commits + pushes this repo, then bumps the course repo's submodule pointer (as a local commit). It no-ops cleanly if there's nothing to commit or if the course repo isn't on this machine.

## What this is NOT (what deadreckon adds)

This gate is honest but naive. A clever agent could still cheat in *code* — delete a covered test, suppress the exit code, edit the criteria. deadreckon closes those: the gate is a separate signed binary, the pass marker is signed with a per-run secret the agent never sees (a forged "done" is rejected as "forged self-attestation"), and a tamper pass catches the suppression tricks. That's the difference between an agent that can't lie in *sentences* and one that can't cheat in *code*.
