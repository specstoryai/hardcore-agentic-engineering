// The Session 4 viewer is a one-screen teaching aid after the live comparison.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPO } from './helpers.ts';

const event = (id: number, status: 'failed' | 'ok', state3: string) =>
  JSON.stringify({
    id,
    run: 's4-test',
    lane: 'shared',
    ts: `2026-08-13T20:00:${String(id).padStart(2, '0')}.000Z`,
    type: 'tool.result',
    actor: 'tool',
    data: {
      tool: 'run_adequacy',
      result: {
        status,
        summary: [
          'state 1: current check stays GREEN over the fault',
          'state 2: strengthened check goes RED over the fault',
          `state 3: strengthened check ${state3}`,
        ].join('\n'),
      },
    },
  });

test('the S4 viewer shows the control, both lanes, and rejected worker attempts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'prove-it-s4-evidence-'));
  try {
    mkdirSync(join(dir, 'right', 'shared'), { recursive: true });
    const hash = 'a'.repeat(64);
    writeFileSync(
      join(dir, 'frames.txt'),
      [
        `left START │ ${hash}  working/src/slugify.mjs`,
        'left SURPRISE │ # pass 3',
        'left CONTROL │ check=check-v1 candidate=tree:abc',
        'left VERDICT │ dr-gate: VERIFIED — check=check-v1',
        `right START │ ${hash}  working/src/slugify.mjs`,
        'right SURPRISE │ state 1: current check stays GREEN over the fault',
        'right CONTROL │ state 2: strengthened check goes RED over the fault',
        'right VERDICT │ state 3: strengthened check stays GREEN over the correct solution',
      ].join('\n') + '\n',
    );
    writeFileSync(
      join(dir, 'decision.txt'),
      'question: Which wrong result must this check catch?\nanswer: long-title truncation\n',
    );
    writeFileSync(join(dir, 'provenance.txt'), 'left: mode=real\nright: mode=real\n');
    writeFileSync(
      join(dir, 'right', 'manifest.json'),
      JSON.stringify({ mode: 'live', provider: 'claude-cli', model: 'test-sonnet' }),
    );
    writeFileSync(
      join(dir, 'right', 'shared', 'events.jsonl'),
      [
        JSON.stringify({
          id: 0,
          run: 's4-test',
          lane: 'shared',
          ts: '2026-08-13T20:00:00.000Z',
          type: 'tool.requested',
          actor: 'worker',
          data: {
            tool: 'write_file',
            args: {
              path: 'working/test/strengthened.test.mjs',
              content:
                "test('long titles preserve every word', () => {\n" +
                "  assert.equal(slugify('word '.repeat(20)), Array(20).fill('word').join('-'));\n" +
                '});\n',
            },
          },
        }),
        event(1, 'failed', 'fails the correct solution'),
        event(2, 'ok', 'stays GREEN over the correct solution'),
      ].join('\n') + '\n',
    );

    const result = spawnSync(process.execPath, [join(REPO, 'scripts', 's4-evidence.mjs'), dir], {
      cwd: REPO,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const heading of [
      'WHAT THIS DEMO IS ACTUALLY TESTING',
      'EXPERIMENTAL CONTROL',
      'LEFT · WEAK CHECK',
      'WHAT CLAUDE CHANGED · REAL WORKER · test-sonnet',
      'RIGHT · HOST JUDGES THE STRONGER CHECK',
    ]) assert.match(result.stdout, new RegExp(heading));
    assert.match(result.stdout, /RUN MODE · REAL/);
    assert.match(result.stdout, /slugify turns a title into a URL slug/);
    assert.match(result.stdout, /three short examples/);
    assert.match(result.stdout, /incorrectly becomes only “a” once the slug exceeds 60/);
    assert.match(result.stdout, /characters\./);
    assert.match(result.stdout, /1 · READ\s+the faulty slugify and the three-example check-v1/);
    assert.match(result.stdout, /2 · FOUND\s+long inputs enter a branch that returns only the first word/);
    assert.match(result.stdout, /3 · LEFT ALONE\s+working\/src\/slugify\.mjs/);
    assert.match(result.stdout, /4 · WROTE\s+1 version of working\/test\/strengthened\.test\.mjs/);
    assert.match(result.stdout, /long titles preserve every word/);
    assert.match(result.stdout, /1 · prove the blind spot/);
    assert.match(result.stdout, /2 · prove detection/);
    assert.match(result.stdout, /3 · rule out false alarm/);
    assert.match(result.stdout, /CONTROL HOLDS\s+same broken product/);
    assert.match(result.stdout, /version 1/);
    assert.match(result.stdout, /state 2: strengthened check goes RED/);
    assert.match(result.stdout, /state 3: strengthened check fails the correct solution/);
    assert.match(result.stdout, /CHECK EARNS TRUST\s+fault red; correct result green/);
    assert.match(result.stdout, /receipt proves which check ran/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
