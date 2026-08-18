// The Session 5 viewer separates case evidence, model advice and the room's decision.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPO } from './helpers.ts';

function evaluator(decision: string, reason: string) {
  return JSON.stringify({
    id: 1,
    run: 's5-test',
    lane: 'shared',
    ts: '2026-08-18T20:00:00.000Z',
    type: 'message.completed',
    actor: 'worker',
    data: {
      calls: [{ tool: 'StructuredOutput', args: { decision, reason } }],
    },
  });
}

test('the S5 viewer gives a simple result and keeps detailed evidence available', () => {
  const dir = mkdtempSync(join(tmpdir(), 'prove-it-s5-evidence-'));
  try {
    mkdirSync(join(dir, 'left', 'shared'), { recursive: true });
    mkdirSync(join(dir, 'right', 'shared'), { recursive: true });
    const holdout =
      'case 01-honest-pass: PASS — gate accepted, receipt verified, run completed';
    writeFileSync(
      join(dir, 'frames.txt'),
      [
        'left START │ The trace is readable, but this evaluation pack has no replayable crash target.',
        `left SURPRISE │ ${holdout}`,
        'left CONTROL │ No retained case tests the change against the crash path.',
        'left VERDICT │ Evidence incomplete: the holdout passes, but this pack never tests the crash path.',
        'right START │ id: 03-crash-boundary',
        `right SURPRISE │ ${holdout}`,
        'right CONTROL │ case 03-crash-boundary: FAIL — phantom reconciliation: event 13 says actor=operator, and no operator decided',
        'right VERDICT │ pack: 2 cases run, 1 failure',
      ].join('\n') + '\n',
    );
    writeFileSync(join(dir, 'provenance.txt'), 'left: mode=real\nright: mode=real\n');
    writeFileSync(
      join(dir, 'decision.txt'),
      'question: Target red, holdout green. Promote, reject or revise?\nanswer: reject\n',
    );
    const change = "177:    const rec = opt('--reconcile') ?? 'ok';";
    writeFileSync(
      join(dir, 'left.log'),
      [
        'Read runs/demo/events.jsonl. You have no other context about this system — you are cold.',
        change,
      ].join('\n') + '\n',
    );
    writeFileSync(
      join(dir, 'right.log'),
      [
        change,
        '  {"id":13,"type":"tool.result","actor":"operator","data":{"summary":"operator reconciliation: marked ok after crash between dispatch and record"}}',
      ].join('\n') + '\n',
    );
    writeFileSync(
      join(dir, 'left', 'shared', 'events.jsonl'),
      evaluator('reject', 'The pack does not exercise the changed crash path.'),
    );
    writeFileSync(
      join(dir, 'right', 'shared', 'events.jsonl'),
      evaluator('reject', 'Case 03-crash-boundary reproduces a false operator event.'),
    );

    const result = spawnSync(process.execPath, [join(REPO, 'scripts', 's5-evidence.mjs'), dir], {
      cwd: REPO,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const heading of ['1 · THE CHANGE', '2 · THE FAIR COMPARISON', '3 · THE RESULTS', '4 · WHAT THE EVIDENCE PROVES'])
      assert.match(result.stdout, new RegExp(heading));
    assert.match(result.stdout, /RUN MODE · REAL/);
    assert.match(result.stdout, /retained crash case is the only controlled difference/);
    assert.match(result.stdout, /LEFT · Holdout: PASS · Crash case: NOT RUN/);
    assert.match(result.stdout, /RIGHT · Holdout: PASS · Crash case: FAIL/);
    assert.match(result.stdout, /The room decided: REJECT/);
    assert.match(result.stdout, /Both lanes used the same change\. Only the right lane replayed the crash\./);
    assert.doesNotMatch(result.stdout, /DETAILS · TRACE PRELUDE/);

    const detailed = spawnSync(
      process.execPath,
      [join(REPO, 'scripts', 's5-evidence.mjs'), '--details', dir],
      {
        cwd: REPO,
        encoding: 'utf8',
        env: { ...process.env, NO_COLOR: '1' },
      },
    );
    assert.equal(detailed.status, 0, detailed.stdout + detailed.stderr);
    assert.match(detailed.stdout, /DETAILS · TRACE PRELUDE/);
    assert.match(detailed.stdout, /DETAILS · EXACT CHANGE AND CASE OUTPUT/);
    assert.match(detailed.stdout, /DETAILS · ADVICE AND DECISION/);
    assert.match(detailed.stdout, /Left model\s+reject/);
    assert.match(detailed.stdout, /Room decision: reject/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
