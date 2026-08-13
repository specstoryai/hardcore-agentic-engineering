# Reviewing a weekly Project

Greg responds to every weekly Project with commentary, not grades. This page is
the review instrument: the same boxes the student saw on the week page, each
paired with the question that separates understanding from compliance. It
exists so that review stays consistent when submissions arrive in different
shapes — a fork, a private repo, a rebuilt toolchain, renamed files. All of
that is allowed. The example already says so: the shape is what transfers, not
the names.

The standard is the course's own rule, applied to the submission itself:
**a claim you have never seen fail is not evidence.** A contract that was never
watched refusing, a brief that was never given to a cold agent, a doubt the run
already answered — each is present on the page and absent as evidence.

## The three verdicts

Each heading earns one word. The words replace grades; the commentary explains
them.

- **Evidenced** — the claim links an artifact that could have come out
  differently, and the story shows it once did: red before green, v1 before
  v2, a pin watched to bite, a refusal before a receipt.
- **Asserted** — the claim is present and plausible, but nothing linked could
  have failed. In course terms, decoration.
- **Missing** — the heading is empty, a placeholder, or answers a different
  question than the one asked.

A truthful refusal is never "missing." A run that went wrong, written down
faithfully with its evidence, is evidenced.

## The five headings, probed

**The result attempted.** The box asks whether a result is named. The probe:
could a stranger check it without asking the author? An observable state of
the world passes; an activity ("I refactored the handler") or an aspiration
("cleaner error handling") does not. Scope choices count in the student's
favor when they are named as choices.

**The contract, fixed before the run.** The box asks whether the contract is
included. The probe: what would this contract refuse, and when was it frozen?
Evidenced needs both halves of "fixed before" — before-ness you can check
(a sha, a commit that predates the run) and a contract that has been seen to
bite (the loophole attack changed it v1 to v2, or a protected pin was edited
and the gate refused). A contract with no revision story usually means the
attack never happened.

**The cold-start brief.** The box asks whether the brief is included. The
probe: could a fresh agent begin from the linked files alone, with no chat
history? Look for one fence, one stop condition, and — the strongest signal of
understanding — the named shortcut: the way an agent could satisfy the check
without doing the task. A brief that restates the contract in prose is
asserted, not evidenced.

**What the first run actually did.** The box asks what happened. The probe:
does the story have a temporal spine? First plan, first wrong action, the fact
the student supplied, the check red before it was green, and a verdict —
receipt or truthful refusal — linked, not pasted. This is the heading students
most often fill with what the run was supposed to do. Preparation, however
good, is not a run.

**The doubt still held.** The box asks for one doubt. The probe is the Demo
Day question three weeks early: what does this evidence still not prove? A
strong doubt names an untested property, a production condition, or a human
judgment the evidence does not reach — and survives the run that was just
described. "Nothing" is wrong, a vague gesture at uncertainty is wrong, and a
doubt the linked evidence already answers is a comprehension flag, not a
doubt.

## Cross-cutting checks

Independent of the five headings, look once at the whole branch:

- Links resolve on the branch. Every claim clicks through to an artifact
  frozen at the submitted commit; nothing lives only in the author's head or
  home directory. A contract gating a repo outside the clone links that repo.
- Evidence is linked, never pasted where a link can stand.
- The week's follow-through is on the branch: the baseline task card
  committed untouched, and the run-card rows in `PROOF.md` filled for the
  outcomes this week earned.
- The submission fits its budget. The week page says 60 to 90 minutes; a
  submission several times that size is a signal worth naming, in either
  direction.

## The response shape

Three moves, in order, every week:

1. **Concede first, and specifically.** Name the places the submission meets
   the course's standards, citing their own artifacts. These students are
   senior; generic praise reads as not having looked.
2. **One push.** The single change that would most alter what the evidence
   proves. One, not three — the others go in a list at the end if they matter.
3. **End on the question.** Ask what the evidence still does not prove, or
   point the strongest doubt at next week's rung. The doubt they wrote is
   usually the bridge to the next Project.

Public sharing is never required, no grade is ever attached, and a submission
that reports failure honestly outranks one that reports success vaguely.
