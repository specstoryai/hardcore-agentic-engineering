// Ported runs (PORT.md): the gate judges the student's OWN repo. A throwaway
// "student repo" is built from scratch here — a small module, a real node:test
// file, and a contract carrying candidate_dir + protect — then the full ported
// lifecycle runs: open pins identities, check issues a receipt, complete
// verifies it. Every refusal the fixture enjoys must fire on ported runs too,
// and the student's repo must never be written to.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { gate, loop, makeFixtureRoot } from './helpers.ts';

const MODULE = `// Tiny stand-in for a student's real code.
export function parseDuration(text) {
  const m = String(text).trim().match(/^(\\d+(?:\\.\\d+)?)\\s*(ms|s|m|h)$/);
  if (!m) throw new Error('unparseable duration: ' + text);
  const unit = { ms: 1, s: 1000, m: 60000, h: 3600000 }[m[2]];
  return Number(m[1]) * unit;
}
`;

const TEST_FILE = `import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../src/parse-duration.mjs';

test('parses each unit', () => {
  assert.equal(parseDuration('250ms'), 250);
  assert.equal(parseDuration('1.5s'), 1500);
  assert.equal(parseDuration('2m'), 120000);
  assert.equal(parseDuration('1h'), 3600000);
});

test('rejects junk', () => {
  assert.throws(() => parseDuration('soon'));
});
`;

// candidate_dir and protect resolve relative to THIS file's directory; the
// check command runs with cwd = the resolved candidate_dir (the repo root).
const CONTRACT = `# Ported Done Contract (PORT.md): gates the student's own repo.
outcome: myrepo/src/parse-duration.mjs parses ms/s/m/h durations and its own named test passes
candidate_dir: myrepo
protect:
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
`;

function makeStudentRepo() {
  const base = mkdtempSync(join(tmpdir(), 'prove-it-port-'));
  const repo = join(base, 'myrepo');
  mkdirSync(join(repo, 'src'), { recursive: true });
  mkdirSync(join(repo, 'test'), { recursive: true });
  writeFileSync(join(repo, 'src', 'parse-duration.mjs'), MODULE);
  writeFileSync(join(repo, 'test', 'parse-duration.test.mjs'), TEST_FILE);
  const contract = join(base, 'port-contract.yaml');
  writeFileSync(contract, CONTRACT);
  return { base, repo, contract, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}

// Full content snapshot: path → sha256 for every file under dir.
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else out[relative(dir, p)] = createHash('sha256').update(readFileSync(p)).digest('hex');
    }
  };
  walk(dir);
  return out;
}

test('ported lifecycle: open pins the student repo, check issues a receipt, complete verifies — repo never written to', () => {
  const { root, cleanup } = makeFixtureRoot();
  const student = makeStudentRepo();
  try {
    const before = snapshot(student.base);

    const o = loop(root, ['open', '--run-id', 'p1', '--contract', student.contract]);
    assert.equal(o.status, 0, o.out);
    const run = JSON.parse(readFileSync(join(root, 'runs', 'p1', 'run.json'), 'utf8'));
    assert.match(run.candidate_tree_start, /^tree:/, 'open hashed the student repo as the candidate');
    assert.match(
      run.protected['myrepo/test/parse-duration.test.mjs'],
      /^[0-9a-f]{64}$/,
      'open pinned the protected test hash',
    );

    const c = gate(root, ['check', 'p1']);
    assert.equal(c.status, 0, c.out);
    assert.match(c.out, /ACCEPTED/);
    assert.match(c.out, /check=protect/, 'ported receipts carry protect pins, not the fixture manifest');
    const receipt = JSON.parse(readFileSync(join(root, 'control', 'receipts', 'p1.json'), 'utf8'));
    assert.equal(receipt.check_version, 'protect');
    assert.equal(
      receipt.protected['myrepo/test/parse-duration.test.mjs'],
      run.protected['myrepo/test/parse-duration.test.mjs'],
      'the receipt binds the protect pins from open',
    );

    const done = loop(root, ['complete', 'p1']);
    assert.equal(done.status, 0, done.out);
    assert.match(done.out, /VERIFIED/);
    assert.match(done.out, /status=completed/);

    assert.deepEqual(snapshot(student.base), before, 'the student repo was judged, never written to');
  } finally {
    cleanup();
    student.cleanup();
  }
});

test('ported refusals: a candidate edit goes stale, a protected-test edit gets its own refusal', () => {
  const { root, cleanup } = makeFixtureRoot();
  const student = makeStudentRepo();
  try {
    assert.equal(loop(root, ['open', '--run-id', 'p1', '--contract', student.contract]).status, 0);
    assert.equal(gate(root, ['check', 'p1']).status, 0);
    assert.equal(gate(root, ['verify', 'p1']).status, 0, 'receipt verifies before any drift');

    // Candidate edit after the receipt → stale.
    const modulePath = join(student.repo, 'src', 'parse-duration.mjs');
    appendFileSync(modulePath, '// drift after receipt\n');
    const stale = gate(root, ['verify', 'p1']);
    assert.notEqual(stale.status, 0);
    assert.match(stale.out, /receipt stale: candidate tree mismatch/);
    writeFileSync(modulePath, MODULE); // restore the exact receipted bytes
    assert.equal(gate(root, ['verify', 'p1']).status, 0, 'restored candidate verifies again');

    // Protected-test edit → its own refusal, at verify AND at check.
    assert.equal(loop(root, ['open', '--run-id', 'p2', '--contract', student.contract]).status, 0);
    appendFileSync(join(student.repo, 'test', 'parse-duration.test.mjs'), '// weakened\n');
    const v = gate(root, ['verify', 'p1']);
    assert.notEqual(v.status, 0);
    assert.match(v.out, /protected check target modified: myrepo\/test\/parse-duration\.test\.mjs/);
    const c = gate(root, ['check', 'p2']);
    assert.notEqual(c.status, 0);
    assert.match(c.out, /protected check target modified: myrepo\/test\/parse-duration\.test\.mjs/);
  } finally {
    cleanup();
    student.cleanup();
  }
});

// Regression: PORT.md's example carries inline `# comments` on candidate_dir
// and protect. An earlier parser kept the comment in the value (open died) or
// missed the protect block entirely (the gate silently fell back to the
// fixture manifest and a tampered test still got a receipt). Both parsers now
// strip whitespace-preceded comments, and the gate refuses outright when open
// pinned protect hashes it cannot re-parse.
test('a contract with inline comments pins and protects exactly like a bare one', () => {
  const { root, cleanup } = makeFixtureRoot();
  const student = makeStudentRepo();
  try {
    writeFileSync(
      student.contract,
      CONTRACT.replace(
        'candidate_dir: myrepo',
        'candidate_dir: myrepo            # the tree the gate hashes as the candidate',
      ).replace(
        'protect:',
        'protect:                         # files pinned at open, verified at check and verify',
      ),
    );

    assert.equal(loop(root, ['open', '--run-id', 'pc', '--contract', student.contract]).status, 0);
    const run = JSON.parse(readFileSync(join(root, 'runs', 'pc', 'run.json'), 'utf8'));
    assert.match(
      run.protected['myrepo/test/parse-duration.test.mjs'],
      /^[0-9a-f]{64}$/,
      'open pinned the protected test despite the inline comments',
    );

    // The tamper the silent fallback used to let through: it must refuse now.
    appendFileSync(join(student.repo, 'test', 'parse-duration.test.mjs'), '// weakened\n');
    const c = gate(root, ['check', 'pc']);
    assert.notEqual(c.status, 0);
    assert.match(c.out, /protected check target modified: myrepo\/test\/parse-duration\.test\.mjs/);

    // Restored, the commented contract mints a receipt like the bare one.
    writeFileSync(join(student.repo, 'test', 'parse-duration.test.mjs'), TEST_FILE);
    const ok = gate(root, ['check', 'pc']);
    assert.equal(ok.status, 0, ok.out);
    assert.match(ok.out, /check=protect/);
  } finally {
    cleanup();
    student.cleanup();
  }
});

// Regression, found by a student reading the two parsers against each other:
// a full-line comment inside the protect block used to END the gate's block
// match while parseContract skipped it and kept collecting. Open pinned every
// entry, the gate re-parsed only the ones above the comment, and the entries
// below it were never verified — a protected test could be weakened and still
// earn a receipt. The old guard missed it because it only fired on a ZERO
// parse. A blank line inside the block did the same thing, with no comment
// involved. Both shapes must now protect every entry.
for (const [shape, divider] of [
  ['a full-line comment', '  # the fixtures below are negative controls'],
  ['a blank line', ''],
] as const) {
  test(`${shape} inside the protect block still protects every entry below it`, () => {
    const { root, cleanup } = makeFixtureRoot();
    const student = makeStudentRepo();
    try {
      const fixtures = join(student.repo, 'test', 'fixtures.json');
      writeFileSync(fixtures, '{ "cases": ["1s", "2m"] }\n');
      writeFileSync(
        student.contract,
        CONTRACT.replace(
          '  - myrepo/test/parse-duration.test.mjs\nchecks:',
          `  - myrepo/test/parse-duration.test.mjs\n${divider}\n  - myrepo/test/fixtures.json\nchecks:`,
        ),
      );

      assert.equal(loop(root, ['open', '--run-id', 'pd', '--contract', student.contract]).status, 0);
      const run = JSON.parse(readFileSync(join(root, 'runs', 'pd', 'run.json'), 'utf8'));
      assert.equal(Object.keys(run.protected).length, 2, 'open pins both entries');

      // Tamper with the entry BELOW the divider — the one the old gate dropped.
      appendFileSync(fixtures, '// weakened\n');
      const c = gate(root, ['check', 'pd']);
      assert.notEqual(c.status, 0, 'the gate must refuse a tampered entry below the divider');
      assert.match(c.out, /protected check target modified: myrepo\/test\/fixtures\.json/);

      // Restored, the contract mints a receipt like a bare one.
      writeFileSync(fixtures, '{ "cases": ["1s", "2m"] }\n');
      const ok = gate(root, ['check', 'pd']);
      assert.equal(ok.status, 0, ok.out);
      assert.match(ok.out, /check=protect/);
    } finally {
      cleanup();
      student.cleanup();
    }
  });
}

// Candidate identity comes from git's view of the repo, not from every file in
// the directory. Found the hard way by two students in one week, from two
// languages: pytest caches in one repo and RStudio's .Rproj.user/ in another
// moved the candidate tree and staled a receipt while the code sat untouched.
// .Rproj.user/ needs no command at all — having the editor open is enough.
test('an ignored file does not move the candidate tree, and a tracked one does', () => {
  const { root, cleanup } = makeFixtureRoot();
  const student = makeStudentRepo();
  try {
    execFileSync('git', ['init', '-q'], { cwd: student.repo });
    writeFileSync(join(student.repo, '.gitignore'), '.cache/\n');
    execFileSync('git', ['add', '-A'], { cwd: student.repo });
    execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], {
      cwd: student.repo,
    });

    assert.equal(loop(root, ['open', '--run-id', 'pg', '--contract', student.contract]).status, 0);
    const run = JSON.parse(readFileSync(join(root, 'runs', 'pg', 'run.json'), 'utf8'));
    assert.match(run.candidate_tree_start, /^gtree:/, 'a git candidate hashes by git');

    // Editor state, build caches, installed libraries: present, ignored, and
    // irrelevant to whether the code passed.
    mkdirSync(join(student.repo, '.cache'), { recursive: true });
    writeFileSync(join(student.repo, '.cache', 'junk'), 'editor state\n');
    const c = gate(root, ['check', 'pg']);
    assert.equal(c.status, 0, c.out);
    const receipt = JSON.parse(readFileSync(join(root, 'control', 'receipts', 'pg.json'), 'utf8'));
    assert.match(receipt.candidate_tree, /^gtree:/);

    // The receipt still binds real work: verify passes with the ignored file in
    // place, and refuses once a tracked file changes.
    assert.equal(loop(root, ['complete', 'pg']).status, 0, 'ignored file did not stale the receipt');
    appendFileSync(join(student.repo, 'src', 'parse-duration.mjs'), '// real edit\n');
    const v = gate(root, ['verify', 'pg']);
    assert.notEqual(v.status, 0);
    assert.match(v.out, /receipt stale: candidate tree mismatch/);
  } finally {
    cleanup();
    student.cleanup();
  }
});

// Backward compatibility: four receipts were already in students' hands when
// gtree shipped. A receipt records the algorithm that produced it, and the gate
// re-hashes with THAT one, so nothing earned under `tree:` needs redoing.
test('a receipt issued under the old tree algorithm still verifies', () => {
  const { root, cleanup } = makeFixtureRoot();
  const student = makeStudentRepo();
  try {
    execFileSync('git', ['init', '-q'], { cwd: student.repo });
    execFileSync('git', ['add', '-A'], { cwd: student.repo });
    execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], {
      cwd: student.repo,
    });

    assert.equal(loop(root, ['open', '--run-id', 'pold', '--contract', student.contract]).status, 0);
    // Rewrite the run as if it had been opened before gtree existed.
    const runPath = join(root, 'runs', 'pold', 'run.json');
    const run = JSON.parse(readFileSync(runPath, 'utf8'));
    run.candidate_tree_start = 'tree:whatever-open-recorded';
    writeFileSync(runPath, JSON.stringify(run, null, 2));

    const c = gate(root, ['check', 'pold']);
    assert.equal(c.status, 0, c.out);
    const receipt = JSON.parse(readFileSync(join(root, 'control', 'receipts', 'pold.json'), 'utf8'));
    assert.match(receipt.candidate_tree, /^tree:/, 'the run kept the algorithm it opened with');
    assert.equal(loop(root, ['complete', 'pold']).status, 0, 'an old-algorithm receipt still verifies');
  } finally {
    cleanup();
    student.cleanup();
  }
});

test('ported runs keep every gate tooth: smoke worker refused, forged receipt refused, moved goalposts refused', () => {
  const { root, cleanup } = makeFixtureRoot();
  const student = makeStudentRepo();
  try {
    // The smoke worker is fixture-only: on a ported contract the worker is the
    // student's own agent, so `loop run` refuses honestly instead of pretending.
    const r = loop(root, ['run', '--provider', 'smoke', '--run-id', 'px', '--contract', student.contract]);
    assert.notEqual(r.status, 0);
    assert.match(r.out, /ported contract/);
    assert.equal(existsSync(join(root, 'runs', 'px')), false, 'refusal happens before any run is opened');

    // Forged receipt on a ported run: every field real except the signature.
    assert.equal(loop(root, ['open', '--run-id', 'p3', '--contract', student.contract]).status, 0);
    assert.equal(gate(root, ['check', 'p3']).status, 0);
    const receiptPath = join(root, 'control', 'receipts', 'p3.json');
    const forged = JSON.parse(readFileSync(receiptPath, 'utf8'));
    forged.sig = 'f0'.repeat(32);
    writeFileSync(receiptPath, JSON.stringify(forged, null, 2) + '\n');
    const v = gate(root, ['verify', 'p3']);
    assert.notEqual(v.status, 0);
    assert.match(v.out, /not issued by this gate/);
    const done = loop(root, ['complete', 'p3']);
    assert.notEqual(done.status, 0);
    assert.match(done.out, /gate refused/);

    // Moved goalposts on a ported contract → refused at check.
    assert.equal(loop(root, ['open', '--run-id', 'p4', '--contract', student.contract]).status, 0);
    appendFileSync(student.contract, '# moved goalposts\n');
    const g = gate(root, ['check', 'p4']);
    assert.notEqual(g.status, 0);
    assert.match(g.out, /contract hash mismatch/);
  } finally {
    cleanup();
    student.cleanup();
  }
});
