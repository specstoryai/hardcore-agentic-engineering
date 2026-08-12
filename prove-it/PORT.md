# Port the gate to your own repo

Everything you have drilled against the slugify fixture — the pinned contract, the
protected tests, the signed receipt, the refusals — works unchanged on a repo you
actually care about. You write one contract file, run three commands, and the gate
that refused your forged receipts in Session 1 now judges your code. Your repo is
read, hashed, and judged; it is never written to. Runs and receipts stay here, in
your prove-it clone, under `runs/` and `control/receipts/`.

## What you write

One Done Contract, either next to your repo or in `projects/` inside this clone.
It is the same eight-key contract from Session 1 plus two optional keys:

```yaml
# my-repo-contract.yaml — sits NEXT to the repo it gates.
outcome: myrepo/src/parse-duration.mjs parses ms/s/m/h durations and its own named test passes
candidate_dir: myrepo            # the tree the gate hashes as the candidate
protect:                         # files pinned at open, verified at check and verify
  - myrepo/test/parse-duration.test.mjs
checks:
  - command: node --test test/parse-duration.test.mjs
    expect_exit: 0
runtime_observation:
  - node -e "import('./src/parse-duration.mjs').then(m => console.log(m.parseDuration('1.5s')))" prints 1500
must_change:
  - myrepo/src/parse-duration.mjs
must_not_change:
  - myrepo/test/parse-duration.test.mjs
budgets:
  attempts: 3
  elapsed_minutes: 30
stop_and_ask:
  - the tests appear wrong or under-specified
release_owner: human
```

The path rules, exactly:

- `candidate_dir` and each `protect` entry may be absolute; a relative path
  resolves against the directory that holds the contract file. In the example
  above, the contract sits beside `myrepo/`, so `candidate_dir: myrepo` finds it.
- Each `checks[].command` runs with its working directory set to the resolved
  `candidate_dir` — your repo root. That is why the check above says
  `test/parse-duration.test.mjs`, not `myrepo/test/...`.
- Leave both keys out and nothing changes: the contract gates `working/` exactly
  as before.

Checks communicate through process exit status, not words in their output. The
status in `expect_exit` means the contract clause is satisfied. This can be `1`
for a check that proves a baseline is red. A check that cannot reach a verdict
must exit `2`; the harness records it as `inconclusive` and the gate refuses it.
Exit `2` is reserved, so do not use it as `expect_exit`. Any other unexpected
status is `failed`. Stdout and stderr are retained as evidence, but they do not
decide the result.

`protect` does for your repo what `control/checks/manifest.json` does for the
fixture: it pins the tests so the worker cannot pass by weakening them. Protect
your test files, not your source — the source is supposed to change.

Before you open your first ported run, replace the teaching key. The starter
ships `control/gate.key` so the fixture works on day one, and a shared key
signs receipts anyone could forge:

```sh
openssl rand -hex 64 > control/gate.key
```

Do this once, before the first ported run. The gate will not verify receipts
signed by the old key, so a late swap orphans every receipt you already earned.

## What counts as your code

The gate fingerprints your repository at `open` and again at `check`, so a
receipt can say *this* code passed rather than *something in that folder*
passed. It counts the files git knows about: everything tracked, plus new files
you have not committed yet. Anything `.gitignore` excludes does not count.

That matters because a repository holds more than your code, and the extra
files change on their own:

| Language | What else lives in the folder |
|---|---|
| Python | `__pycache__/`, `.pytest_cache/`, `.venv/` |
| R | `.Rproj.user/`, `.Rhistory`, `renv/library/` |
| JavaScript | `node_modules/`, `dist/` |

`.Rproj.user/` is the sharpest case: RStudio rewrites it as you move around the
editor, with no command run at all. Before this rule, having your editor open
was enough to stale a receipt while your code sat untouched.

**The thirty-second check, worth doing before your first ported run.** Run your
check command twice, then:

```sh
git status --porcelain --ignored
```

Anything listed is written by your own toolchain. Ignored entries are now
harmless. Anything *not* ignored is part of your candidate, so decide
deliberately whether it belongs there.

Two notes. If your candidate is not a git repository, the gate falls back to
hashing every file in the directory, and the thirty-second check above is the
only way to see what will move. And every receipt records which method produced
it, so receipts you earned before this rule existed keep verifying exactly as
they did, and a run you have already opened finishes the way it started.

## The three commands

Where each step runs, and where your agent runs:

```text
what runs                            where
──────────────────────────────────   ────────────────────────────
node src/loop.ts open …              the prove-it clone
  pins the contract sha, your
  candidate tree, and every
  protected test — before any work

your agent does the task             YOUR repository, your own
  Claude Code, Codex, whatever you   tools. The harness is not
  already run — exactly as in        in this loop. Your repo is
  weeks 1 and 2                      read, hashed, and judged —
                                     never written to.

node control/dr-gate.ts check …      the prove-it clone
  re-reads the pins, re-hashes
  your repo, runs the named check
  from your repo root → a signed
  receipt, or a truthful refusal

node src/loop.ts complete …          the prove-it clone
  verifies the receipt, and only
  then records the run completed
```

```
node src/loop.ts open --run-id port-1 --contract /path/to/my-repo-contract.yaml
```

Open fixes the identities before any work happens: the contract's sha256, the
hash of your whole candidate tree, and the hash of every protected file, all
recorded in `runs/port-1/run.json`. Now brief your own agent — Claude Code,
Codex, whatever you run — in your own repo, with this contract as the brief.
The harness is not in that loop and does not pretend to be.

```
node control/dr-gate.ts check port-1
```

When the agent claims done, the gate decides. It re-reads the contract against
the pinned sha, re-hashes the protected tests against the pins from open, hashes
your repo as the candidate, and runs the named checks from your repo root. If
everything holds, it writes a signed receipt to `control/receipts/port-1.json`
and the last check's output to `runs/port-1/check-output.txt` — both in the clone,
nothing in your repo.

```
node src/loop.ts complete port-1
```

Complete verifies the receipt's signature and every identity in it, then — and
only then — records the run as completed.

## What the gate refuses, and why that is the point

- Edit the contract after open: `contract hash mismatch` — no moved goalposts.
- Edit a protected test: `protected check target modified` — no weakened checks.
- `|| true` and friends in a check command: `suppressed check` — no muzzled checks.
- A check that cannot decide exits `2`: `check inconclusive` — no green receipt
  for an abstention.
- Edit the candidate after the receipt: `receipt stale: candidate tree mismatch` —
  rerun `check`; the new receipt binds the new tree.
- Write your own receipt: `not issued by this gate` — no signature, no completion.
- Reuse an old receipt on a new run: `receipt run mismatch` — no replays.

Every refusal is the same discipline you attacked in Session 4, now standing
between your agent's "done" and your repo's reality. A receipt on your own repo
means exactly what it meant on the fixture: this tree, under this contract, with
these tests intact, passed these checks.

## The honest limits

The gate is the harness's; the worker is yours. The smoke worker only knows the
slugify fixture, so `loop run --provider smoke` refuses a ported contract rather
than fake a session, and the ported lifecycle is open → check → complete, with
your own agent doing the work in between. The gate proves your named checks
passed against an untampered tree — it does not prove your checks are adequate.
Strengthening them when a fault survives is still your job, same as Session 4.
