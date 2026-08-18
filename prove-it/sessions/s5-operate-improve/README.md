# Session 5: Preserve understanding and improve from traces

*Turn a failed run into a test.*

Keep the failed run. Turn it into a case. Use that case to check one change.

**Course outcome:** Compound

> [!IMPORTANT]
> Project 3 uses a real failed run from your repository. The supplied fixture pack, case 06, signed fixture table, and copy-back steps are optional practice.

**Do before class:** Read Chapter 5 and bring one failed or disappointing run.

**Do in class:** Run the compare and write your Project 3 sentence.

**Finish for Project 3:** Turn one real failed run into a regression case. Record the result before and after one change.

**Save:** `projects/project-3-evidence/regression-case.md`, `projects/project-3-evidence/before-after.md`, and `PROOF.md`

**Submit:** Maven Student Home → Project 3, before Demo Day on Friday 21 August

**Help:** Maven Student Home → `#questions`

## On this page

- [Before](#before)
- [During the live session](#during-the-live-session)
- [Apply](#apply)
- [Replay](#replay)
- [Go deeper](#go-deeper)

## Before

A **regression case** is a saved input and expected result that can expose the same failure again.

A **holdout** is a second case that you did not use to design the change. It helps you find changes that fix one case and damage another.

1. Read [Chapter 5](https://hardcoreagentic.com/course/reader/05-operate-improve.html). Allow about 8 minutes.
2. Find one run that failed, disappointed you, or remains hard to explain.
3. Bring that run before 5pm Tuesday 18 August.

The live session runs Tuesday 18 August, from 5pm to 7pm ET. Open the Zoom link from Maven Student Home. The course commands need Node 22.18 or newer — check with `node --version`.

## During the live session

During the instructor demo, watch and predict. There is nothing to type. Run the launcher once when the lab block starts.

### Watch

The left lane keeps readable history but has no runnable crash target. Its holdout passes, but that holdout never enters the changed crash path. The evidence is incomplete.

The right lane retains the crash boundary as a regression case. The case catches a false operator event that the passing holdout misses.

In live mode a real Claude first reads a completed run trace cold. This prelude shows what a trace can and cannot explain; it is not the crash test. A real evaluator then reviews each lane's pack and recommends a decision. The recommendation can vary. The staging, the change, the target, and the holdout are deterministic fixtures in both modes; your `--mock` copy replays a sanitized recording of the reader.

### Decide

Before the result appears, choose `promote`, `reject`, or `revise`.

Use two facts: the target case fails and the holdout passes.

### Try it

After the demo, run this command from the `prove-it` root:

```sh
bash scripts/demo-compare.sh s5 --mock
```

Look for the target case failure, the passing holdout, and the room decision. The runner prints the path of the saved compare artifact.

To explain the retained evidence after the run, use:

```sh
node scripts/s5-evidence.mjs
```

The viewer does not rerun anything. The default view answers four questions:
What changed? What differed between the lanes? What happened? What does the
evidence prove? Use `node scripts/s5-evidence.mjs --details` to inspect the
exact code, case output, and model advice.

If `tmux` is not installed, the lanes run one after the other. The evidence is the same. If `tmux` opens but cannot attach, run the same command with `--seq`.

### Your task

Write this sentence in the Compound row of `PROOF.md`:

> From my own history I am retaining ___ as a case. The change it must catch
> is ___, and I will compare the result before and after ___.

Use your own failed run. Do not use the supplied answer.

The class sentence is a draft. Before you submit, replace it with the final Compound evidence — the before-and-after link that [the week 3 page](https://hardcoreagentic.com/course/homework/week-3.html) asks for.

### Save

Save the completed sentence in the Compound row of `PROOF.md`.

The compare artifact is useful class evidence. It is not required for Project 3.

### Optional guided practice

This practice uses the supplied fixture pack. It is not required for this session or Project 3.

If you want to drive the fixture, use [Replay](#replay). Its full walkthrough is self-contained.

## Apply

### Use this in your project

Create the evidence directory from the `prove-it` root:

```sh
mkdir -p projects/project-3-evidence
```

Then:

1. Name one failure from your real run.
2. Reduce it to the smallest input or situation that can expose the same failure.
3. Save the case as `projects/project-3-evidence/regression-case.md`.
4. Record the result before you change anything.
5. Change one instruction, tool, policy, or check.
6. Run the case again in a later run.
7. Save both results as `projects/project-3-evidence/before-after.md`.
8. Keep the change only if the later result improved.

Use this short shape for `regression-case.md`:

```markdown
# Regression case
Source run:
Failure to catch:
Smallest input or situation:
Expected result:
Privacy-safe evidence link:
```

Use this short shape for `before-after.md`:

```markdown
# Before and after
Case: projects/project-3-evidence/regression-case.md
Before:
One change:
Later run:
After:
Decision: keep | reject | revise
```

These files record the Project evidence. They do not need the optional YAML case, signed table, checker, or holdout from Replay.

> [!WARNING]
> Keep the original failed trace unchanged. A polished history hides the wrong guesses that the next person needs.

### Save and submit

- Save the case at `projects/project-3-evidence/regression-case.md`.
- Save the comparison at `projects/project-3-evidence/before-after.md`.
- Link `before-after.md` from the Compound row of `PROOF.md`. That file links back to the case.
- Submit the completed `PROOF.md` link in Maven Student Home → Project 3.

The Maven Project 3 page owns the grading contract. `FIELD-NOTES.md` contains private notes and is never submitted.

### This session is complete when

- [ ] You ran the S5 compare.
- [ ] You wrote the Project 3 sentence with all three blanks complete in `PROOF.md`.

### Project 3 preparation is complete for S5 when

- [ ] One real failed run became a regression case.
- [ ] The case names privacy-safe evidence from that run.
- [ ] You recorded a before-and-after result for one change.
- [ ] The Compound row links the comparison, which links the case.

You finish the run shape, release owner, remaining blind spot, and final run card after Session 6.

### If you miss class

Watch the recording on Maven Student Home. Then name one change that you will keep and the later run that it must improve.

You do not need to complete Replay. The Project 3 deadline does not move.

### If something fails

If the compare fails, run it once more from the `prove-it` root.

If a project check fails, save the command and its output. Post both in Maven `#questions`.

State the step, the expected result, the actual result, and a privacy-safe part of the evidence.

## Replay

Replay is a reference. It is not another assignment.

Run the compare again from the `prove-it` root:

```sh
bash scripts/demo-compare.sh s5 --mock
```

The walkthrough below exposes each part of the optional fixture practice. It includes the structured YAML case, holdout, signed table, and copy-back path.

### 1. Create a temporary copy

From the `prove-it` root, run these commands:

```sh
PIT="$(pwd)"                                   # your real checkout; step 12 comes back here
```

```sh
T="$(mktemp -d)"; echo "temp copy: $T"; cp -R "$PIT" "$T/prove-it" && cd "$T/prove-it" || exit 1
```

```sh
rm -rf runs && mkdir runs
```

```sh
find control/receipts -name '*.json' -delete
```

The commands do not print output. All later fixture changes stay in this copy.

### 2. Produce a run

Run the scripted demo agent:

```sh
node src/loop.ts run --provider smoke --run-id demo
```

Ask the gate to check the run:

```sh
node control/dr-gate.ts check demo
```

Complete the run:

```sh
node src/loop.ts complete demo
```

Count the run events:

```sh
wc -l runs/demo/events.jsonl
```

The decisive output is:

```text
dr-gate: ACCEPTED — receipt at control/receipts/demo.json
  run=demo contract=sha256:ceaaf355388b… check=check-v1 candidate=tree:a71862e1d0e8…
dr-gate: VERIFIED — run=demo contract=sha256:ceaaf355388b… check=check-v1 candidate=tree:a71862e1d0e8…
run=demo status=completed (receipt verified by dr-gate)
      24 runs/demo/events.jsonl
```

On Linux, `wc` prints the `24` without the leading spaces.

The `complete` command checks the receipt before it records `completed`.

### 3. Read the run

View the short run record:

```sh
node src/loop.ts view demo
```

The record identifies the run and its receipt. It does not explain the requested outcome, chosen design, failed ideas, or remaining uncertainty.

These missing facts justify a **hand-off pack**. It is a small group of files that helps a new reader continue the work.

### 4. Build the hand-off pack

Create the hand-off directory:

```sh
mkdir -p runs/demo/handoff
```

Copy the hand-off template:

```sh
cp sessions/s5-operate-improve/fixtures/templates/handoff.md   runs/demo/handoff/
```

Copy the system map template:

```sh
cp sessions/s5-operate-improve/fixtures/templates/AS-BUILT.md  runs/demo/handoff/
```

Copy the incident template:

```sh
cp sessions/s5-operate-improve/fixtures/templates/incident.md  runs/demo/handoff/
```

Read the full run record:

```sh
node src/loop.ts view demo --full
```

Use the output, `runs/demo/run.json`, and `control/receipts/demo.json` to fill the templates.

If the smoke run has no source evidence, use these values:

- Set `goal_ref` and `rider_ref` to `none`.
- Set `harness_version` to `unknown`.
- Use the candidate tree for the `Stamp:` line.
- Leave `human_decision` and `decided_by` as `PENDING`.
- Record the tool failure from turn 2 in `incident.md`.
- Name one rejected idea in `incident.md`.

Check the pack:

```sh
bash sessions/s5-operate-improve/fixtures/checks/handoff-check.sh runs/demo/handoff
```

```text
handoff-check: PASS (43 checks). Structure only — semantic accuracy
requires the fresh-reader test (a human traces one path and reruns one check).
```

The script checks structure. It does not check whether the pack tells the truth.

### 5. Remove the rejected idea

Save a backup:

```sh
cp runs/demo/handoff/incident.md runs/demo/incident.bak
```

Delete the rejected idea:

```sh
perl -0pi -e 's/(## Rejected hypothesis\n).*?(\n## Cause)/$1$2/s' runs/demo/handoff/incident.md
```

Check the damaged pack:

```sh
bash sessions/s5-operate-improve/fixtures/checks/handoff-check.sh runs/demo/handoff
```

Restore the incident:

```sh
mv runs/demo/incident.bak runs/demo/handoff/incident.md      # restore before step 6
```

The decisive refusal is:

```text
  FAIL incident.md 'Rejected hypothesis' is empty — keep the dead end; it is the most valuable line

handoff-check: FAILED (1 of 43 checks).
```

### 6. Label a crashed trace

Read `sessions/s5-operate-improve/fixtures/labeling-trace/events.jsonl` without other context.

Answer the four questions in `sessions/s5-operate-improve/fixtures/labeling-trace/worksheet.md` before you watch the recorded discussion.

### 7. Add the supplied case

Read `sessions/s5-operate-improve/fixtures/failed-trace/NOTE.md`.

Then read its neighboring `events.jsonl`.

The gate refused this failed run:

```text
dr-gate: REFUSED — check failed: 'node --test working/test/slugify.test.mjs' exited 1, expected 0 (output in runs/fallback/check-output.txt)
```

Check the five-case pack:

```sh
bash sessions/s5-operate-improve/fixtures/checks/eval-case-check.sh fixtures/eval/cases
```

```text
  FAIL pack has 5 cases; optional M10 target is >= 6
  ok   case ids are unique

eval-case-check: FAILED (1 of 32 checks).
```

This quoted checker output uses an engineering-track code. The fixture exercise remains optional.

Create `fixtures/eval/cases/06-red-candidate-gated.yaml` from `sessions/s5-operate-improve/fixtures/templates/eval-case.template.yaml`.

The case must contain:

- `id: 06-red-candidate-gated`
- a reproducible `situation`
- `source_trace: sessions/s5-operate-improve/fixtures/failed-trace/events.jsonl`
- an `expected_outcome` that names the refusal
- one `trajectory_constraint` that names the gate check
- a `grader` that names a deterministic exit code or output match

Check the pack again:

```sh
bash sessions/s5-operate-improve/fixtures/checks/eval-case-check.sh fixtures/eval/cases
```

```text
  ok   06-red-candidate-gated: source_trace exists (sessions/s5-operate-improve/fixtures/failed-trace/events.jsonl)
  ok   pack has 6 cases (optional M10 target: >= 6)
  ok   case ids are unique

eval-case-check: PASS (39 checks). Shape only — whether a grader is
HONEST is the grader-health drill, not this script.
```

### 8. Record the baseline

Read the crash-boundary case:

```sh
cat fixtures/eval/cases/03-crash-boundary.yaml
```

Run the crash fixture:

```sh
PROVE_IT_CRASH_AT_TOOL=3 node src/loop.ts run --provider smoke --run-id c03
```

Resume the run without a reconciliation decision:

```sh
node src/loop.ts resume c03 ; echo "exit=$?"
```

The decisive output is:

```text
run=c03 has a PENDING action dispatched but never recorded:
  tool=run_check args={}
The side effect may or may not have happened. Decide, then resume:
  loop resume c03 --reconcile ok|failed|in_doubt
  loop cancel c03 --reason "..."
exit=1
```

Save this output before you change the harness.

### 9. Apply the change

Change the default reconciliation:

```sh
sed -i.bak "s/const rec = opt('--reconcile');/const rec = opt('--reconcile') ?? 'ok';/" src/loop.ts && rm -f src/loop.ts.bak
# Or edit the `const rec` line (~172) by hand instead.
grep -n "reconcile') ??" src/loop.ts
```

Run the crash fixture again:

```sh
PROVE_IT_CRASH_AT_TOOL=3 node src/loop.ts run --provider smoke --run-id c03b
```

Resume the changed run:

```sh
node src/loop.ts resume c03b ; echo "exit=$?"
```

Read the recorded result:

```sh
grep '"tool":"run_check","status":"ok"' runs/c03b/events.jsonl
```

Event 13 says that an operator reconciled the action. No operator made that decision.

### 10. Run the holdout

Run the scripted demo agent:

```sh
node src/loop.ts run --provider smoke --run-id c01
```

Check the run:

```sh
node control/dr-gate.ts check c01
```

Complete the run:

```sh
node src/loop.ts complete c01
```

The holdout still passes. The target case exposes the false event.

### 11. Record the comparison

Copy the table template:

```sh
cp sessions/s5-operate-improve/fixtures/templates/before-after.md runs/before-after-resume.md
```

Fill the table from steps 8, 9, and 10. Record the change, hypothesis, target case, holdout, commands, decision, owner, and saved evidence.

### 12. Copy the evidence back

If you opened a new terminal, rebuild `$PIT` and `$T` from your current directory:

```sh
# new terminal since step 1? both variables are gone. First cd into the
# temporary copy — step 1 printed its path as "temp copy: …":
#   cd <temp copy>/prove-it
# Then rebuild both variables from where you stand:
#   PIT=/path/to/your/real/prove-it ; T="$(dirname "$(pwd)")"
```

Copy the optional fixture evidence:

```sh
mkdir -p "$PIT/runs/evidence-resume"
cp -R runs/c03 runs/c03b runs/c01 "$PIT/runs/evidence-resume/"
cp runs/before-after-resume.md "$PIT/runs/"
cp -R runs/demo "$PIT/runs/"                       # the hand-off pack
cp control/receipts/demo.json "$PIT/control/receipts/"   # the receipt it links
cp fixtures/eval/cases/06-*.yaml "$PIT/fixtures/eval/cases/"   # case 06 — skip if you skipped step 7
cd "$PIT" && rm -rf "$T"
bash sessions/s5-operate-improve/fixtures/checks/before-after-check.sh runs/before-after-resume.md
```

```text
before-after-check: PASS (12 checks). Structure only — whether the
holdout is truly unaffected is a judgement this script cannot make.
```

The copied receipt becomes stale because it describes the deleted temporary tree. Keep it as historical evidence. Do not present it as a current receipt.

## Go deeper

Go deeper is optional. It never blocks a Project, a later session, or Demo Day.

The optional engineering track uses two milestones here:

- **M9** builds a complete hand-off pack. A person or agent with no prior chat history checks the pack.
- **M10** expands the evaluation pack and measures one harness change.

Read [MILESTONES.md](../../MILESTONES.md) before you claim either milestone. A demo does not complete a milestone.

### Build a hand-off pack

Choose one run with a receipt or a recorded refusal. Build its pack, then run:

```sh
bash sessions/s5-operate-improve/fixtures/checks/handoff-check.sh runs/<RUN-ID>/handoff
```

Give the hand-off directory to a person or agent with no history of the run. Ask the reader to:

1. State the requested result.
2. Follow one input to one side effect.
3. Run one check from the system map.
4. Name the rejected idea.
5. State the remaining blind spot.

Record each missing fact as an edit to the pack.

### Expand the evaluation pack

Add two cases from your real repository:

- one ordinary successful task
- one important boundary or failure

Label each grader as deterministic, model-based, or human-adjudicated. Save privacy-safe trace parts under `runs/evidence-*/`.

Check the pack:

```sh
bash sessions/s5-operate-improve/fixtures/checks/eval-case-check.sh fixtures/eval/cases
```

### Measure grader agreement

Build ten rows from your own history: label ten evaluation reports `PASS` or `FAIL` twice, one day apart, and treat the two passes as adjudicators A and B. Calculate:

1. The count for each label pair.
2. Raw agreement, `Po`.
3. Chance agreement, `Pe`.
4. Agreement beyond chance, `κ = (Po − Pe) / (1 − Pe)`.

Then state what the number proves and what it does not prove.

### Optional completion check

- [ ] `handoff-check.sh` exits with status 0 on your pack.
- [ ] A fresh reader checked the pack.
- [ ] The reader caused one visible correction.
- [ ] The evaluation pack contains at least eight cases.
- [ ] Every grader has a type.
- [ ] Two cases come from your real repository.
- [ ] The system map contains current commands and a current stamp.
- [ ] You calculated `Po`, `Pe`, and `κ`.
