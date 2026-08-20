<h1 align="center">prove-it</h1>

<p align="center"><strong>The worker's "done" is an opinion; only the gate records completion.</strong></p>

<p align="center">
The practice harness for <a href="https://hardcoreagentic.com/course/slides/index.html">Hardcore Agentic Engineering</a>:
a small TypeScript agent loop with a gate at the exit.<br>
Zero dependencies, no API keys, no network. Node ≥ 22.18.
</p>

<p align="center"><sub>
New to the course? Read <a href="https://hardcoreagentic.com/course/reader/why-now.html">Why now</a>,
then <a href="https://hardcoreagentic.com/course/slides/start-here.html">Start here</a>.
</sub></p>

---

## Get started

```sh
git clone https://github.com/specstoryai/hardcore-agentic-engineering.git
cd hardcore-agentic-engineering/prove-it
```

Nothing installs and nothing is compiled: Node runs the `.ts` files directly.
macOS and Linux work as written; on Windows, use WSL2 —
[the Session 0 guide](sessions/s0-setup/README.md#windows-and-linux) has the
steps. The whole harness is 5 commands.

| Command | What it answers |
|---|---|
| `bash scripts/green-check.sh` | Does the harness work on this machine? |
| `node src/loop.ts run --provider smoke --run-id first` | What does a run look like? |
| `node control/dr-gate.ts check first` | Does the gate agree? It reruns the checks and signs a receipt, or refuses. |
| `node src/loop.ts complete first` | Can the run complete? Only with a verified receipt. |
| `bash scripts/probe.sh` | What is contained here? Real attempts, honest labels. |

Shorthands: `npm run green`, `npm run smoke`, `npm run tamper`, `npm run probe`,
`npm test`.

If the source feels larger than these five commands, open
[How the `prove-it` source works](SOURCE-GUIDE.md). It shows the eight files,
one complete run and the parts the starter does not supply yet.

The idea in one paragraph: a run completes only when `dr-gate` reruns the
agreed checks and signs a receipt. The gate refuses forged, replayed and stale
receipts. A receipt proves the checks ran — not that they were adequate. The
course lives in that difference.

`prove-it` teaches receipt binding. It does not contain an arbitrary local
process. An unconstrained process can read or replace files in `control/`,
including `gate.key`. [The containment explainer](CONTAINMENT.md) shows this
limit and the structural isolation that a production system adds.

DeadReckon also composes many verified child runs into one Job.
[The jobs, graphs and joins explainer](DEADRECKON-GRAPHS.md) follows a real
five-task execution from its dependency graph to its parent checks.

[The Session 0 guide](sessions/s0-setup/README.md) walks all 5 commands with
their real outputs. It is the only file Session 0 needs, and it is due before
Session 1 on Tuesday 4 August.

## How the live sessions use this repo

Every live session and every session page use the same 4 terms. They are
defined here, once.

**During the live session** — watch one comparison and predict the result.
The two lanes start from the same state. One control changes. There is nothing
to type during the demonstration.

**Your lab block** — the same comparison on your own clone, after watching,
never during. One command starts it:

```sh
bash scripts/demo-compare.sh sN --mock
```

`sN` names the session, such as `s2` or `s3`. `--mock` needs no provider or
network. tmux is not required. The lanes run in sequence without it.

The in-class path is the launcher plus one named student action. Each session
guide states that action directly. Longer fixture walkthroughs are optional
practice.

**Replay** — the same command and the full walkthrough, available after class
as a reference. Replay is not another assignment.

**Go deeper** — optional builds, attacks, and harness extensions. Nothing in
Go deeper blocks a Project, a later session, or Demo Day.

## The course, session by session

Each session is one file in this repository, with a reader chapter to read
before class and a live deck. The repository grows under you, and what you build
sits beside what was supplied. The two stay diffable.

The map has 5 outcomes: Define, Brief, Operate, Verify and Compound. One real
task from your own work matures across the
[3 weekly Maven Projects](https://hardcoreagentic.com/course/homework/README.html). Each week,
you fill the matching row of [PROOF.md](PROOF.md), your run card. Sessions 1 and
2 earn Define and Brief. Sessions 3 and 4 earn Operate and Verify. Sessions 5
and 6 earn Compound.

| Session · materials | Do in class | Finish for the Project | Optional engineering track |
|---|---|---|---|
| [**S0 — setup**](sessions/s0-setup/README.md)<br><sub>[reader ch. 0](https://hardcoreagentic.com/course/reader/00-field-map.html) · [deck](https://hardcoreagentic.com/course/slides/session-0.html)</sub> | No live session. Run readiness and the green check. | Create the real-task card and finish setup in Maven. | Run the gate and receipt walkthrough. |
| [**S1 — define done**](sessions/s1-define-done/README.md)<br><sub>[reader ch. 1](https://hardcoreagentic.com/course/reader/01-define-done.html) · [deck](https://hardcoreagentic.com/course/slides/session-1.html)</sub> | Run the compare and close one contract loophole. | Write, attack, and revise the contract for your real task. | Run the full fixture gate and bootstrap attacks. |
| [**S2 — brief and steer**](sessions/s2-brief-steer/README.md)<br><sub>[reader ch. 2](https://hardcoreagentic.com/course/reader/02-brief-steer.html) · [deck](https://hardcoreagentic.com/course/slides/session-2.html)</sub> | Run the compare, record an interrupt, and find the missing fact. | Write the goal and rider. Start a fresh agent and finish Project 1. | Extend the manifest, plan approval, and fact-carrying interrupt. |
| [**S3 — control plane**](sessions/s3-control-plane/README.md)<br><sub>[reader ch. 3](https://hardcoreagentic.com/course/reader/03-control-plane.html) · [deck](https://hardcoreagentic.com/course/slides/session-3.html)</sub> | Run the compare and write one stable request ID. | Record the uncertain moment, the evidence you read, and your control decision. | Extend recovery, budgets, tool results, and approvals. |
| [**S4 — attack and verify**](sessions/s4-attack-verify/README.md)<br><sub>[reader ch. 4](https://hardcoreagentic.com/course/reader/04-attack-verify.html) · [deck](https://hardcoreagentic.com/course/slides/session-4.html)</sub> | Run the compare and name one wrong result that the check must catch. | Make one real case wrong, save the check result, and name the remaining blind spot. | Run the full tamper table and build a versioned stronger check. |
| [**S5 — operate and improve**](sessions/s5-operate-improve/README.md)<br><sub>[reader ch. 5](https://hardcoreagentic.com/course/reader/05-operate-improve.html) · [deck](https://hardcoreagentic.com/course/slides/session-5.html)</sub> | Run the compare and write the Project 3 sentence. | Turn one failed run into a regression case and record one change before and after. | Build the full hand-off and larger evaluation pack. |
| [**S6 — compose and defend**](sessions/s6-compose-defend/README.md)<br><sub>[reader ch. 6](https://hardcoreagentic.com/course/reader/06-compose-defend.html) · [deck](https://hardcoreagentic.com/course/slides/session-6.html)</sub> | Run the compare and write the run-shape sentence. | Finish the receipt or refusal, release owner, remaining risk, run card, and Project 3. | Change the workflow, join rules, and promotion controls. |
| **Demo Day — Fri 21 Aug**<br><sub>[reader: You, after](https://hardcoreagentic.com/course/reader/you-after.html) · [deck](https://hardcoreagentic.com/course/slides/demo-day.html)</sub> | Defend the run-card evidence. | Nothing new. Read the card that you already filled. | Continue with the Challenge after the course. |

The harness has 2 authority areas. `control/` is host-owned: the gate, its key,
the contracts and the receipts. `working/` is the only directory where worker
tools can write. `scripts/probe.sh` proves the refusals from the context of the
worker, rather than asserting them.

3 modification rules hold throughout:

1. No worker edits `control/`. The tool layer refuses the write, and the probe
   proves the refusal. When a session gives you a host-side step, it says so.
   You then run that step as the host, outside a run.
2. The course scripted agent writes only in `working/`. Your own agent can
   work in your own repository when a Project asks it to.
3. You add, you do not replace. Your contracts, events, cases and attack rows
   sit beside the supplied spine. What you built stays diffable against what you
   were given.

[PROOF.md](PROOF.md) is the run card: 5 rows, one link each, written the week you
earn the row. [FIELD-NOTES.md](FIELD-NOTES.md) is your private working notes, and
nothing in it is submitted. [MILESTONES.md](MILESTONES.md) is the optional
M1–M12 engineering track. It is ungraded and has no deadline. The reader's
[source ledger](https://hardcoreagentic.com/course/reader/sources.html)
and [pattern map](https://hardcoreagentic.com/course/reader/book-pattern-map.html)
sit behind everything.

## Layout

```text
control/            the gate (163 lines), key, contracts, check fixtures, receipts
working/            slug-kit: the task fixture (starts red on purpose)
src/                loop.ts, provider.ts (smoke|claude-cli|codex-cli), tools.ts,
                    events.ts, runview.ts, probe.ts
done/contract.yaml  the operator contract (syllabus schema, exactly)
scripts/            green-check.sh, compare-check.sh, demo-compare.sh,
                    tamper-table.sh, probe.sh
live/               the compare runner, six lane scenarios (s1–s6), and the
                    provenance-labeled captures behind the fallback key
tests/              node:test suite (npm test)
fixtures/           steering event replay, fake credential, eval pack
prompts/            goal+rider worked pair, interrupt bank, attack briefs, drills
sessions/           s0–s6: one README.md per session, with worked solutions beside it
```

[PORT.md](PORT.md) is the own-repo recipe: two optional contract keys
(`candidate_dir`, `protect`) plus the same open → check → complete, and the
gate judges a repository you actually care about — read, hashed, never
written to.

## Further reading

- **[The course site](https://hardcoreagentic.com/course/slides/index.html)** — every deck, reader chapter and session guide, in reading editions
- **[25 Patterns in Agentic Engineering](https://specstory.com/books/25-patterns-in-agentic-engineering-book-2026.pdf)** — Greg's free field guide, mined from 1,310 captured agent sessions. The course's durable habits come from it
- **[deadreckon.sh](https://deadreckon.sh)** — run your coding agent unattended, and trust the result: the industrial-grade version of the gate you build here
- **[The challenge](CHALLENGE.md)** — the course's graduation track, never required, started any time: build your own harness up the DeadReckon ladder, one refusal at a time

## Next

Open [the Session 0 guide](sessions/s0-setup/README.md) and complete its four
setup tasks. The five-command tour above is an optional reference. Session 0
is due before Session 1 on Tuesday 4 August.
