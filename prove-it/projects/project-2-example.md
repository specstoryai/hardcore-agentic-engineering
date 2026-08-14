# Project 2 — controlled and attacked run (worked example)

> Week 2 of the same fictional task. Same repository and evidence lineage,
> with new attempts where the contract or check changes.
> Evidence paths are illustrative; yours are real links on your branch.

## The moment the run became uncertain

Mid-run, my agent's session died between sending a charge to the staging
ledger and recording that it was sent. The effect may or may not have landed,
and nothing in the transcript could say which — the same shape as the
harness's `PENDING action dispatched but never recorded`, in a repo where the
charge is real.

## The control I chose, and why

Reconcile from observation, not from hope. I queried the ledger by the
idempotency key the send carried, found the entry present, and only then let
the run continue. The ruling and the query output are committed on the branch
as `projects/p2-crash-reconcile.md` — the record says a human ruled, and on
what evidence. I chose this over rerunning the send because a blind retry is
exactly how the original double-charge happened.

## The case I made wrong on purpose

My Project 1 check sent duplicate deliveries one after another. It did not
send them at the same time.

On a non-main branch, I replaced the atomic insert with a read-then-insert
sequence. Two concurrent deliveries can both read "missing" before either
one writes. The old sequential check still passed this wrong implementation.

## The evidence that came back

I saved three results under `projects/project-2-evidence/`:

1. The old sequential check passed the wrong read-then-insert implementation.
2. The stronger concurrent check failed on that implementation. It found two ledger entries for one `event_id`.
3. The stronger concurrent check passed after I restored the atomic insert.

The linked `wrong-case.md` records both commands and links all three outputs.
The branch history keeps the deliberate wrong change and the correction.

## The blind spot that remains

The stronger check covers two simultaneous deliveries. It does not cover a
large burst across several service instances. A distributed race can still
pass this local test.
