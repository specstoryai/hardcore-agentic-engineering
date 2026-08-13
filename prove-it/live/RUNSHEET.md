# Live comparison run sheet

For the person driving the screen. Students never read this and never need
anything in it — the keyless path is unchanged and still needs no install, key,
provider, or network.

## Before the room

```sh
cd course/prove-it
node --version                     # must be 22.18 or newer
bash scripts/live-qa.sh mock       # the keyless battery, ~1 minute
claude --version                   # the provider must be on PATH
```

Rehearse the session you are about to run:

```sh
bash scripts/demo-compare.sh s3 --seq --ci
```

`--seq` runs both lanes in one terminal. Drop it for the two-pane tmux layout
you will actually project.

## On the night

```sh
bash scripts/demo-compare.sh s3            # tmux, two panes, live
bash scripts/demo-compare.sh s3 --details  # same run, more of it on screen
bash scripts/demo-compare.sh s3 --mock     # keyless, no provider
bash scripts/demo-compare.sh s3 --capture  # the recorded worker, explicitly
```

`--details` changes what reaches the screen and never what the artifact holds.

If a live step fails, it says so and names `--capture`. Nothing falls back to a
recording on its own: a rehearsal on screen under the same labels as a real run
is the one thing the artifact could not tell the room about afterwards.

## The values this runs with

The brief asks for these to be recorded rather than left to whoever runs it.

| Setting | Value | Where |
|---|---|---|
| provider | `claude-cli` | default; `PROVE_IT_LIVE_PROVIDER` or `--provider` overrides |
| model | `sonnet` | named in each scenario's real command |
| S1 prefix model | `haiku` | in s1's real command — a cheap worker coding blind misses the check's house rule (sonnet guesses it); its fix rounds keep the same model |
| effort | provider default | `--effort` exists and no scenario sets it |
| turn budget | 40 turns | `live/runtime/cli.ts`, per lane |
| lane duration | 240–280s | per scenario, in its real command |
| S1 right lane | up to 3 gate rounds, 300s each | the worker codes blind; each gate refusal starts a real fix round (`resume --rounds 3`) |
| cost ceiling | **not enforced** | see below |
| instructor setup | install Claude Code, sign in | nothing else |

There is no spend cap. The turn and duration budgets bound a lane in practice —
a full six-scenario rehearsal has been costing well under a dollar — but nothing
stops a run that goes wrong from costing more than expected. If that matters for
your cohort, cap it upstream at the provider.

## Which provider to run

`claude-cli`, in front of people.

`codex-cli` works and is not contained: it has a shell that no flag removes,
and the harness cannot take away a capability a provider will not surrender. It
exists to prove the runtime is provider-neutral. `live/providers/CONFINEMENT.md`
records what each lane actually reached, measured rather than assumed.

## What the audience is looking at

Each scenario stops at four named frames — START, SURPRISE, CONTROL, VERDICT —
and in tmux neither pane passes one until the other has arrived. A lane that
dies releases its peer with the reason rather than leaving it waiting.

The room answers one question per scenario, once, and the answer becomes a real
input to the run rather than a note beside it.

## Afterwards

Each run writes to `live/artifacts/<scenario>-<timestamp>/`: the complete
provider stream, every tool call's arguments and result, the durable event log,
the frames, and a manifest naming the model and the contract hash. Home paths
and anything key-shaped are scrubbed on the way in.

That directory is git-ignored, excluded from the course site build, and excluded
from the public mirror. It is local evidence, and it is the answer to any
"what actually happened" the room asks.

For Session 3, inspect the artifact in this order:

```sh
node scripts/s3-evidence.mjs
node scripts/s3-evidence.mjs live/artifacts/<s3-directory>
```

The first command finds the newest Session 3 artifact. The viewer produces one
projector-friendly after-action screen. Use the second command to show a
specific run.

1. `frames.txt` — the four claims each lane put on screen.
2. `right.log` — the visible sequence: unknown state, refused resume, world
   observation, room decision, reconciliation, verdict.
3. `operator/world-observation.json` in mock mode, or
   `right/operator/world-observation.json` in live mode — what the ledger
   actually returned before the decision.
4. `decision.txt` — what the room classified that evidence as.
5. `operator/reconciliation-events.jsonl` in mock mode, or
   `right/shared/events.jsonl` in live mode — where the operator decision
   entered durable run history. For a live run, render the full history with
   `node scripts/timeline.mjs live/artifacts/<s3-directory>`.

The important seam is between steps 3 and 4. The read reports what the world
contains. The operator decides what that evidence permits the run to record.

For Session 4, render the controlled comparison and the check-authoring loop:

```sh
node scripts/s4-evidence.mjs
node scripts/s4-evidence.mjs live/artifacts/<s4-directory>
```

The first command finds the newest Session 4 artifact. It shows the matching
product hashes, the valid weak-check receipt, each retained adequacy attempt,
and the final fault-red/correct-green result. It reads artifacts only; it does
not rerun the worker or any check.
