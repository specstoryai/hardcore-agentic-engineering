# Session 6: Compose verified runs

*Join runs with evidence.*

A workflow can release after its receipts agree and a person approves it.

**Course outcomes:** Define, Brief, Operate, Verify, and Compound

> [!IMPORTANT]
> Project 3 needs your run shape, receipt or truthful refusal, release owner, remaining risk, and completed run card. The fixture workflow is practice.

**Do before class:** Read Chapter 6 and bring `PROOF.md`.

**Do in class:** Predict the join refusal, run the compare, and make one supervisor decision.

**Finish for Project 3:** Complete `PROOF.md` and submit its link through Maven.

**Save:** `PROOF.md` and the contract plus gate evidence that it links.

**Submit:** Maven Student Home → Project 3, before Demo Day on Friday 21 August

**Help:** Maven Student Home → `#questions`

## On this page

- [Before](#before)
- [During the live session](#during-the-live-session)
- [Apply](#apply)
- [Replay](#replay)
- [Go deeper](#go-deeper)

## Before

A **node** is one bounded agent run in a workflow.

A **receipt** is the gate's signed record of the run, contract, check, and checked code snapshot.

A **join** reads the node receipts and decides whether their results are eligible to count together.

A **composition method** turns eligible results into one parent candidate. Use synthesis, union, ordered integration, or repair or refusal.

A **parent gate** checks the new composed candidate. Child receipts do not cover this new state.

A **supervisor** owns the parent goal, total budget, worker boundaries, join, and release path.

A **shared budget** is one attempt limit that all nodes and retries use together.

A **write set** lists the files that one node can change.

A **run shape** states how many agents work and how they connect.

The supplied workflow has four nodes:

```text
inspect ──> implement ──> verify ─────> join ──> (human promote, OUTSIDE)
                 └──────> independent review ──┘
```

The join asks five questions:

1. Are all required receipts present?
2. Does each receipt belong to its node and pass the gate check?
3. Did each node start from the checked snapshot of its dependency?
4. Did each node stay inside its write set?
5. Did every attempt stay inside the shared budget?

Before class:

1. Read [Chapter 6](https://hardcoreagentic.com/course/reader/06-compose-defend.html). Allow about 10 minutes.
2. Bring `PROOF.md` before 5pm Thursday 20 August.

The live session runs Thursday 20 August, from 5pm to 7pm ET. Open the Zoom link from Maven Student Home. The course commands need Node 22.18 or newer — check with `node --version`.

## During the live session

The session has four moves: predict, compare, supervise, and defend. During the instructor demo, watch and predict. Run the launcher during the lab block.

### 1. Predict

Four worker summaries say `complete`. The room selects one broken seam:

- `write-set-overlap`
- `swapped-receipt-identity`
- `stale-candidate`
- `blown-shared-budget`

Write the expected refusal in plain language before the join runs.

### 2. Compare

Both lanes use the same four node results and the same broken seam.

The left lane reads node summaries. Every summary says complete, so it supports release.

The right lane reads receipts and recalculates the shared-budget rule. It refuses and names the broken seam.

In the live run, one coordinator drives the four nodes once. Both lanes read the same node evidence.

The nodes stay deterministic. Your `--mock` copy uses a scripted demo agent in place of the coordinator. The room's seam choice changes both lanes.

This comparison tests one claim: the evidence-bound join can detect the broken seam. It does not compare model quality, model speed, or workflow value.

Run this command from the `prove-it` root:

```sh
bash scripts/demo-compare.sh s6 --mock
```

Look for three results:

- The summary-only lane supports release.
- The evidence-bound join refuses the broken invariant.
- The runner saves the refusal reason in `join-result.json`.

### 3. Supervise

For your Project 3 task, make a small supervisor packet:

1. **Shape:** Select one worker, a specialist, a sequence, parallel workers, or a dependency workflow.
2. **Ownership:** Name the parent goal and each worker's write set.
3. **Composition method:** Select synthesis, union, ordered integration, or repair or refusal. Name the artifacts and evidence that must return.
4. **Next action:** Select accept, retry, rebrief, sequence, repair, or refuse.

Do not add a worker as a recovery action unless you can name its new boundary.

### 4. Defend

Write one run-shape sentence for your Project 3 task. Use this form:

> I will use **[shape]** because **[task property]**. I will change this shape if **[evidence]**.

One worker is a complete answer when the task needs shared context or overlapping changes.

### Save

Save your run-shape sentence in `PROOF.md`. Keep the supervisor packet in your notes for the class discussion.

The compare artifact is useful class evidence. It is not required for Project 3.

### Optional guided practice

This practice runs the complete fixture workflow. Its rollback path is useful evidence, but Project 3 does not grade that extra field.

If you want to drive the fixture, use the fast guided version under [Replay](#fast-guided-version). It saves the join, attacks, and promotion record.

## Apply

### Use this in your project

Project 3 uses your real repository and your completed run card.

1. Add your final claim to `PROOF.md`. Use the same result stated by your Done Contract.
2. Link that Done Contract from the card.
3. If the gate accepted the run, link `control/receipts/<run-id>.json`.
4. If the gate refused, save the command and privacy-safe output as `projects/project-3-evidence/gate-refusal.txt` and link that file instead.
5. Link the Session 5 before-and-after file from the Compound row. That file must link the regression case.
6. Add your run-shape sentence.
7. Name the person who made the release decision.
8. Name the remaining risk in one sentence.
9. Answer “What does this evidence still not prove?” in three sentences or fewer.
10. Open every link as a reader who has no access to your local files.

The receipt binds the run ID, contract hash, checked-code hash, check version, and signature. It does not sign the prose in `PROOF.md`. A refusal does not bind those values; it records why the gate did not issue a receipt.

If you still need gate evidence for your own repository, use [PORT.md](../../PORT.md). The gate can also produce a truthful refusal.

### Save and submit

- Save the completed run card at `PROOF.md`.
- Save each linked artifact in its stated repository path.
- Push the card on a branch named `project-3`.
- Submit the card link through Maven Student Home → Project 3.
- Submit before Demo Day on Friday 21 August.

The Maven Project 3 page owns the grading contract. There is no separate Session 6 submission.

### This session is complete when

- [ ] You ran the S6 compare.
- [ ] You saved one run-shape sentence in `PROOF.md`.

### Project 3 is complete when

- [ ] The final claim matches the result in the linked Done Contract.
- [ ] `PROOF.md` links the receipt or truthful refusal for that contract and checked code.
- [ ] The Compound row links one retained change and its before-and-after evidence.
- [ ] The run-shape field names the shape and the problem that requires it.
- [ ] The release-owner field names one person.
- [ ] The remaining-risk field is one sentence: what can still be wrong.
- [ ] Every run-card row links a file that opens for the reviewer.
- [ ] The card answers what the evidence does not prove.
- [ ] You submitted the card through Maven Student Home → Project 3.

A rollback path remains valuable operating evidence. It is not an additional Project 3 grading item.

### If you miss class

Watch the recording on Maven Student Home. Then read `PROOF.md` against the five course outcomes.

Fix the weakest row. Rehearse your evidence once against a clock.

You do not need to complete Replay. The Project 3 deadline does not move.

### If something fails

If the compare fails, run it once more from the `prove-it` root.

If a Project link fails, correct the link before you submit the card.

Post unresolved errors in Maven `#questions`. Include the command, expected result, actual result, and privacy-safe evidence.

## Replay

Replay is a reference. It is not another assignment.

Run the compare again from the `prove-it` root:

```sh
bash scripts/demo-compare.sh s6 --mock
```

The walkthrough below exposes the complete deterministic workflow.

### Fast guided version

This optional version matches the live guided block. From the `prove-it` root, stage the workflow:

```sh
eval "$(bash sessions/s6-compose-defend/fixtures/stage-workflow.sh --exports --owner you@example.com)"
```

Replace `you@example.com` with your address. The command exports `$T` and `$S6_LAB`.

Create the evidence directory:

```sh
mkdir -p runs/s6-compose
```

Run and save the attacks:

```sh
{ bash sessions/s6-compose-defend/fixtures/join-attacks.sh; echo "exit $?"; } | tee runs/s6-compose/join-attacks.txt
```

Save the join transcript:

```sh
node \
  sessions/s6-compose-defend/fixtures/runner.ts join --wf-id live \
  > runs/s6-compose/join.txt 2>&1
```

Copy the JSON records:

```sh
cp "$T/runs/live/join-result.json" "$T/runs/live/promotion.json" \
  runs/s6-compose/
```

Delete the temporary copy:

```sh
bash sessions/s6-compose-defend/fixtures/stage-workflow.sh --cleanup "$S6_LAB"; unset PROVE_IT_ROOT T S6_LAB
```

Look for `exit 0` in `join-attacks.txt` and `join: invariant` in `join.txt`.

If staging fails, run the cleanup command. Then repeat the staging command from the `prove-it` root.

### 1. Create a temporary copy

From the `prove-it` root, create the temporary directory:

```sh
T="$(mktemp -d /tmp/wf-live.XXXXXX)"
```

Copy the workflow files:

```sh
cp -R control working done fixtures sessions "$T/"
```

Create the run directory:

```sh
mkdir -p "$T/runs"
```

Point the harness at the temporary copy:

```sh
export PROVE_IT_ROOT="$T"
```

Start the temporary checked files in the required failing state:

```sh
# the inspect node's contract expects a red candidate, so start the copy red
# whatever state your own working/ is in:
cp "$T/control/checks/fixtures/solution-stub.mjs" "$T/working/src/slugify.mjs"
```

All later workflow state stays under `$T`.

### 2. Read the workflow limits

Read the shared budget, retry owner, and terminal nodes:

```sh
grep -n 'attempts:\|retry_owner:\|terminal:' \
  sessions/s6-compose-defend/fixtures/workflow.yaml
```

```text
15:  attempts: 6
16:retry_owner: runner
43:  terminal: verify review
```

The workflow has six shared attempts. Only the runner can spend a retry.

### 3. Run the four nodes

Run the workflow:

```sh
node \
  sessions/s6-compose-defend/fixtures/runner.ts run --wf-id live
```

The runner spends four attempts and creates four receipts. Each receipt records the run, contract hash, check version, and checked snapshot.

### 4. Join the receipts

Run the join:

```sh
node \
  sessions/s6-compose-defend/fixtures/runner.ts join --wf-id live
```

The decisive output ends with:

```text
join: invariant — attempts spent 4 (runner 0 + inspect:1 implement:1 verify:1 review:1) <= budget 6 — PASS
join: PASSED — all required receipts verified (runs/live/join-result.json).
Promotion is a human decision, outside this workflow:
  bash sessions/s6-compose-defend/fixtures/promote.sh live --owner "<name>" --rollback "<path>"
```

The join reads identities, checks terminal receipts, checks dependency snapshots, checks write sets, and recalculates the budget.

The join also checks that `workflow.yaml` did not change after the workflow started.

### 5. Keep promotion outside the workflow

Try self-promotion:

```sh
PROVE_IT_WORKFLOW=1 bash sessions/s6-compose-defend/fixtures/promote.sh live \
  --owner "the runner" --rollback "n/a"
```

Try the missing runner command:

```sh
node \
  sessions/s6-compose-defend/fixtures/runner.ts promote
```

Try promotion without an owner:

```sh
bash sessions/s6-compose-defend/fixtures/promote.sh live \
  --rollback "git checkout -- working/"
```

Try promotion without a rollback path:

```sh
bash sessions/s6-compose-defend/fixtures/promote.sh live \
  --owner "you@example.com"
```

Run the complete human path:

```sh
bash sessions/s6-compose-defend/fixtures/promote.sh live \
  --owner "you@example.com" --rollback "git checkout -- working/"
```

The decisive output is:

```text
promote: REFUSED — promotion is a human decision outside the workflow.
         A runner (or any process it spawned) may not promote its own output.
runner: REFUSED — promotion is not a runner command. A workflow may not promote
its own output. A human runs sessions/s6-compose-defend/fixtures/promote.sh.
promote: REFUSED — no named owner. 'Human approved' needs a human name.
promote: REFUSED — no rollback path. Name it before the irreversible step, not after.
promote: re-running the join — promotion consumes fresh evidence, not a cached verdict.
... the whole join from step 4 runs again, line for line ...
promote: recorded at runs/live/promotion.json
  owner=you@example.com
  rollback=git checkout -- working/
```

Read the promotion record:

```sh
cat "$T/runs/live/promotion.json"
```

The fixture requires a rollback path because the promotion can be irreversible. The Project 3 grading contract does not add that field.

### 6. Run the join attacks

Run the five attacks:

```sh
bash sessions/s6-compose-defend/fixtures/join-attacks.sh
```

Read the exit status:

```sh
echo "exit $?"
```

The script checks an old receipt, a stale snapshot, a summary in place of a receipt, an overspent budget, and attacker-controlled output.

The final lines are:

```text
join attacks: all rows behaved as the syllabus requires.
exit 0
```

### 7. Save the optional fixture evidence

Create the evidence directory in your real checkout:

```sh
mkdir -p runs/s6-compose
```

Save the join transcript:

```sh
node \
  sessions/s6-compose-defend/fixtures/runner.ts join --wf-id live \
  > runs/s6-compose/join.txt 2>&1
```

Save the attack transcript:

```sh
{ bash sessions/s6-compose-defend/fixtures/join-attacks.sh; echo "exit $?"; } \
  > runs/s6-compose/join-attacks.txt 2>&1
```

Copy the JSON records:

```sh
cp "$T/runs/live/join-result.json" "$T/runs/live/promotion.json" \
  runs/s6-compose/
```

Delete the temporary copy:

```sh
rm -rf "$T"
```

Clear the temporary path:

```sh
unset PROVE_IT_ROOT
```

The four optional fixture files remain in `runs/s6-compose/`.

If the workflow state is confusing, delete the temporary copy and start at Replay step 1.

If a full fallback is useful, run:

```sh
bash sessions/s6-compose-defend/fixtures/wf-demo.sh
```

Look for exit status 0.

## Go deeper

Go deeper is optional. It never blocks a Project, a later session, or Demo Day.

The optional engineering track uses two milestones here:

- **M11** extends the workflow, budget, and join refusals.
- **M12** enforces the release record and rollback path in a custom workflow.

Read [MILESTONES.md](../../MILESTONES.md) before you claim either milestone. Running the supplied demo does not complete a milestone.

### Write a run-shape memo

Use `FIELD-NOTES.md` for this optional memo.

1. Pick one important task in your repository.
2. Choose one agent, a specialist agent, sequential runs, or a workflow.
3. State the problem that requires this shape.
4. Name the evidence that can change your decision.
5. Run one bounded part with one agent.
6. Run the same part with a read-only review branch.
7. Compare time, interventions, collisions, and evidence quality.

One agent remains a valid result.

### Audit the join

Give your agent this read-only brief:

> Repo: this prove-it checkout. Read-only diagnosis task. The S6 join
> (`sessions/s6-compose-defend/fixtures/runner.ts`, `cmdJoin`) refuses for
> several distinct reasons. Find every one of them by reading the code: name
> each class, quote the exact message it prints, and cite the line that
> enforces it. Do not assume a count — I want yours. Do not run anything
> destructive and do not edit files.
>
> Deliver a report of at most 15 lines:
> 1. For each refusal class: the exact code path (file:line), or
>    "NOT ENFORCED" if you cannot find it.
> 2. One evidence the join accepts on trust that a future attacker should
>    target (hint: what does it NOT recompute?).
> 3. Confidence per finding: read-verified / inferred.
>
> Do not edit files. Do not propose fixes. Evidence over narrative.

Make sure that the agent did not edit tracked files:

```sh
git status
```

Record one trust gap in `FIELD-NOTES.md`.

### Break one seam

Stage a temporary workflow:

```sh
eval "$(bash sessions/s6-compose-defend/fixtures/stage-workflow.sh --exports)"
```

Choose one join check. Predict its exact refusal before you change the temporary workflow.

Ask your agent to change only `$T/sessions/s6-compose-defend/fixtures/workflow.yaml`. Then run:

```sh
node \
  sessions/s6-compose-defend/fixtures/runner.ts join --wf-id live
```

Make sure that the original fixture still passes:

```sh
bash sessions/s6-compose-defend/fixtures/wf-demo.sh > /dev/null; echo "wf-demo exit $?"
```

Look for `wf-demo exit 0`.

Remove the temporary workflow:

```sh
bash sessions/s6-compose-defend/fixtures/stage-workflow.sh --cleanup "$S6_LAB"; unset PROVE_IT_ROOT T S6_LAB
```

### Add a fifth node

Create the directory and copy the workflow:

```sh
mkdir -p sessions/s6-compose-defend/my
cp sessions/s6-compose-defend/fixtures/workflow.yaml sessions/s6-compose-defend/my/workflow.yaml
```

Then:

1. Add an `evals` node that depends on `verify`.
2. Give the node an empty write set.
3. Make its contract check your S5 evaluation pack.
4. Decide whether the shared budget must change.
5. Record the budget reason in one comment.
6. Before each run, start the candidate red: `cp control/checks/fixtures/solution-stub.mjs working/src/slugify.mjs`. The inspect node expects the failing start, and a green leftover burns the shared budget on refusals.
7. Run the workflow with `--wf sessions/s6-compose-defend/my/workflow.yaml`.
8. Run the join.
9. Add one deterministic refusal row that the supplied attack script lacks.
10. Run the new refusal three times.
11. Use `promote.sh` with a named owner and a real rollback path.
12. Save the five receipts, join transcript, refusal, and promotion record.

### Short attacks

**Refusal order:** Run the summary attack, then change `working/src/slugify.mjs`. Predict which refusal occurs first.

**Forged write:** Add a false `tool.result` event to the review run. Claim that it changed `working/src/slugify.mjs`, then predict the refusal.

**Trust audit:** Identify which non-terminal receipt facts the join accepts without another gate check. Record the cost and a possible defense.

### Optional completion check

- [ ] The read-only agent left tracked files unchanged.
- [ ] You mapped each join refusal to its code path.
- [ ] One predicted refusal matched the actual refusal.
- [ ] Your workflow contains five nodes.
- [ ] The five-node join passes.
- [ ] You justified the shared budget.
- [ ] You added one deterministic refusal.
- [ ] The refusal text stayed the same across three runs.
- [ ] The release record names an owner and rollback path.

If you want to build your own harness, continue with [the Challenge](../../CHALLENGE.md) after Demo Day.
