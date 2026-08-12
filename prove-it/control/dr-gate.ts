// dr-gate — the host-owned gate. The gate is small; the discipline is the point.
// Worker context may REQUEST `check` or `verify`. It must never write this file,
// gate.key, the contracts, checks/, receipts/ or the completion transition.
// This file imports nothing from src/ so student extensions cannot bend it.
import { createHash, createHmac } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessCheckExit, observedExit } from './check-exit.ts';

const ROOT = process.env.PROVE_IT_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CTRL = join(ROOT, 'control');
const KEY = readFileSync(join(CTRL, 'gate.key'), 'utf8').trim();
const SUPPRESS = ['|| true', '--no-verify', '--exit-zero', '--passWithNoTests'];
const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const sign = (p: object) => createHmac('sha256', KEY).update(JSON.stringify(p)).digest('hex');
const refuse = (msg: string): never => {
  console.error(`dr-gate: REFUSED — ${msg}`);
  process.exit(1);
};

// Candidate identity. TWO algorithms; the prefix names the one that produced a
// value, and the gate re-hashes with the algorithm the RUN or the RECEIPT
// recorded — never with today's default. That is what keeps every receipt
// earned before `gtree` existed verifying unchanged, and what lets a run opened
// this morning finish the way it started.
//
//   gtree:  the files git knows about — tracked, plus new files not ignored
//   tree:   every file in the directory (fallback when the candidate is not in
//           a git work tree, and every pre-gtree receipt)
//
// This mirrors src/root.ts by hand. The gate imports nothing from src/, so the
// two copies must be kept honest by the tests, not by a shared import.
function gitTreeFiles(dir: string): string[] | null {
  const opts = { cwd: dir, encoding: 'utf8' as const };
  const inTree = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], opts);
  if (inTree.status !== 0 || inTree.stdout.trim() !== 'true') return null;
  const ls = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], opts);
  if (ls.status !== 0) return null;
  return ls.stdout.split('\0').filter(Boolean).sort();
}

function treeHash(dir: string, algo?: string): string {
  const files = algo === 'tree' ? null : gitTreeFiles(dir);
  if (!files) return walkTreeHash(dir);
  const h = createHash('sha256');
  for (const rel of files) {
    const p = join(dir, rel);
    h.update(rel);
    let st;
    try { st = lstatSync(p); } catch { h.update(':missing'); continue; }
    if (st.isSymbolicLink()) h.update(':symlink');
    else if (st.isDirectory()) h.update(':submodule');
    else h.update(readFileSync(p));
  }
  return 'gtree:' + h.digest('hex');
}

// The algorithm a recorded hash was produced by, for re-hashing like for like.
const algoOf = (v: unknown): string | undefined => String(v ?? '').split(':')[0] || undefined;

function walkTreeHash(dir: string): string {
  const h = createHash('sha256');
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const p = join(d, e.name);
      if (e.isSymbolicLink()) h.update(relative(dir, p) + ':symlink');
      else if (e.isDirectory()) walk(p);
      else { h.update(relative(dir, p)); h.update(readFileSync(p)); }
    }
  };
  walk(dir);
  return 'tree:' + h.digest('hex');
}

function parseChecks(raw: string): { command: string; expect_exit: number }[] {
  const out: { command: string; expect_exit: number }[] = [];
  for (const m of raw.matchAll(/-\s+command:\s*(.+)\n(?:\s+expect_exit:\s*(\d+))?/g))
    out.push({ command: m[1].trim(), expect_exit: Number(m[2] ?? 0) });
  return out;
}

// Ported contracts (PORT.md): OPTIONAL keys read from the sha-pinned contract
// bytes, never from worker-writable state. candidate_dir points the gate at the
// student's own repo; protect pins the student's own test files. Both resolve
// relative to the contract file's directory (absolute paths pass through).
// Absent → today's fixture behavior, byte for byte.
// An inline `# comment` (whitespace before the #, YAML's rule) is not part of
// the value. Check commands are never de-commented — they come from parseChecks.
const uncomment = (v: string) => v.replace(/\s+#.*$/, '').trim();

function parsePort(raw: string): { candidateDir?: string; protect: string[] } {
  const cd = raw.match(/^candidate_dir:[ \t]*(.+)$/m)?.[1];
  const candidateDir = cd ? uncomment(cd) || undefined : undefined;
  const protect: string[] = [];
  // A full-line comment or a blank line inside the block does not end it —
  // parseContract skips both and stays in the section, so this must too, or the
  // two parsers disagree about the same bytes. Item extraction is anchored to
  // the line start: a dash inside a comment is prose, not a protected path.
  const block = raw.match(/^protect:[ \t]*(?:#.*)?\n((?:[ \t]*(?:#.*)?\n|[ \t]+-[ \t]+.+\n?)*)/m)?.[1] ?? '';
  for (const m of block.matchAll(/^[ \t]+-[ \t]+(.+)$/gm)) {
    const entry = uncomment(m[1]);
    if (entry) protect.push(entry);
  }
  return { candidateDir, protect };
}

const [cmd, runId] = process.argv.slice(2);
if (!cmd || !runId) { console.error('usage: dr-gate <check|verify> <run-id>'); process.exit(2); }
const runDir = join(ROOT, 'runs', runId);
if (!existsSync(join(runDir, 'run.json'))) refuse(`no run manifest for '${runId}' — open a run first`);
const run = JSON.parse(readFileSync(join(runDir, 'run.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(CTRL, 'checks', 'manifest.json'), 'utf8'));
const receiptPath = join(CTRL, 'receipts', `${runId}.json`);
// The recorded --contract may be absolute (ported) or relative to ROOT.
const contractAbs = resolve(ROOT, run.contract_path);
const contractDir = dirname(contractAbs);
const rsv = (p: string) => resolve(contractDir, p);

if (cmd === 'check') {
  const raw = readFileSync(contractAbs, 'utf8');
  const checks = parseChecks(raw);
  if (checks.length === 0) refuse('contract names no checks');
  for (const c of checks) {
    const hit = SUPPRESS.find((s) => c.command.includes(s)) ??
      (/(;|&&|\|\|)\s*exit 0\s*$/.test(c.command) ? 'trailing exit 0' : undefined);
    if (hit) refuse(`suppressed check: '${hit}' in '${c.command}'`);
  }
  if (sha256(raw) !== run.contract_sha256)
    refuse('contract hash mismatch: contract changed after the run was opened');
  const port = parsePort(raw); // safe: parsed from the bytes the sha just pinned
  // Belt and braces: `loop open` pinned protect hashes this parser cannot see
  // again means the two parsers disagree about the same bytes. Refuse; never
  // fall back to the fixture manifest on a ported run. Counts, not emptiness:
  // a parser that sees SOME of the block is the dangerous case, because the
  // pins it drops are never verified and nothing else here would notice.
  const pinned = Object.keys(run.protected ?? {});
  if (pinned.length > 0 && pinned.length !== port.protect.length)
    refuse(
      `protect parse mismatch: open pinned ${pinned.length} file(s), gate parses ${port.protect.length} — gate and open disagree`,
    );
  if (port.protect.length > 0) {
    // Ported: the student's protect list replaces the fixture manifest. The
    // pins were hashed at `loop open` into run.json; a protected file edited
    // since then refuses here, before any check runs.
    const pins = (run.protected ?? {}) as Record<string, string>;
    for (const f of port.protect) {
      if (!pins[f]) refuse(`protect target not pinned at open: ${f} — reopen the run`);
      if (!existsSync(rsv(f))) refuse(`protected check target missing: ${f}`);
      if (sha256(readFileSync(rsv(f))) !== pins[f]) refuse(`protected check target modified: ${f}`);
    }
  } else {
    for (const [f, want] of Object.entries(manifest.protected as Record<string, string>)) {
      if (!existsSync(join(ROOT, f))) refuse(`protected check target missing: ${f}`);
      if (sha256(readFileSync(join(ROOT, f))) !== want) refuse(`protected check target modified: ${f}`);
    }
  }
  const candidateDir = port.candidateDir ? rsv(port.candidateDir) : join(ROOT, 'working');
  if (port.candidateDir && !existsSync(candidateDir)) refuse(`candidate_dir not found: ${candidateDir}`);
  // Follow the algorithm `loop open` recorded, so a run that started before a
  // hash change finishes the way it started.
  const candidate = treeHash(candidateDir, algoOf(run.candidate_tree_start));
  const results: object[] = [];
  for (const c of checks) {
    // NODE_TEST_CONTEXT is scrubbed: a check inheriting a test-runner context reports exit 0 on failure.
    // Ported checks run FROM the candidate repo root (cwd = resolved candidate_dir);
    // today's contracts keep cwd = ROOT. Output is retained in the prove-it clone —
    // the student's repo is read and judged, never written to.
    const r = spawnSync('bash', ['-c', c.command], { cwd: port.candidateDir ? candidateDir : ROOT, encoding: 'utf8', env: { ...process.env, NODE_NO_WARNINGS: '1', NODE_TEST_CONTEXT: undefined, NODE_OPTIONS: undefined } });
    const assessment = assessCheckExit(r.status, c.expect_exit);
    results.push({ command: c.command, exit: r.status, expected: c.expect_exit, outcome: assessment.outcome });
    writeFileSync(join(runDir, 'check-output.txt'), (r.stdout || '') + (r.stderr || ''));
    if (!assessment.accepted) {
      const detail = assessment.outcome === 'inconclusive'
        ? `check inconclusive: '${c.command}' returned ${observedExit(r.status)}, expected exit ${c.expect_exit}`
        : `check failed: '${c.command}' exited ${r.status}, expected ${c.expect_exit}`;
      refuse(`${detail} (output in runs/${runId}/check-output.txt)`);
    }
  }
  const payload = {
    run_id: runId, contract_sha256: run.contract_sha256,
    check_version: port.protect.length > 0 ? 'protect' : manifest.version,
    candidate_tree: candidate,
    // Ported receipts carry the protect pins themselves: verify re-hashes the
    // student's protected files against these, with no fixture manifest involved.
    ...(port.protect.length > 0
      ? { protected: Object.fromEntries(port.protect.map((f) => [f, (run.protected as Record<string, string>)[f]])) }
      : {}),
    checks: results, issued_at: new Date().toISOString(),
  };
  mkdirSync(join(CTRL, 'receipts'), { recursive: true });
  writeFileSync(receiptPath, JSON.stringify({ ...payload, sig: sign(payload) }, null, 2) + '\n');
  console.log(`dr-gate: ACCEPTED — receipt at ${relative(ROOT, receiptPath)}`);
  console.log(`  run=${runId} contract=sha256:${run.contract_sha256.slice(0, 12)}… check=${payload.check_version} candidate=${candidate.slice(0, 17)}…`);
} else if (cmd === 'verify') {
  if (!existsSync(receiptPath)) refuse(`no receipt for run '${runId}' — request 'dr-gate check ${runId}' first`);
  const { sig, ...payload } = JSON.parse(readFileSync(receiptPath, 'utf8'));
  if (sig !== sign(payload)) refuse('receipt not issued by this gate: signature does not verify');
  if (payload.run_id !== runId) refuse(`receipt run mismatch: replay of run '${payload.run_id}'`);
  if (payload.contract_sha256 !== run.contract_sha256) refuse('receipt contract mismatch: not the contract this run fixed');
  // Ported runs re-read the contract: candidate_dir/protect resolution must come
  // from the same bytes the run pinned. Contracts without the keys skip all of this.
  const rawNow = existsSync(contractAbs) ? readFileSync(contractAbs, 'utf8') : '';
  const port = parsePort(rawNow);
  if ((port.candidateDir || port.protect.length > 0) && sha256(rawNow) !== run.contract_sha256)
    refuse('contract hash mismatch: contract changed after the run was opened');
  if (payload.protected) {
    for (const [f, want] of Object.entries(payload.protected as Record<string, string>)) {
      if (!existsSync(rsv(f))) refuse(`protected check target missing: ${f}`);
      if (sha256(readFileSync(rsv(f))) !== want) refuse(`protected check target modified: ${f}`);
    }
  } else if (payload.check_version !== manifest.version)
    refuse(`receipt stale: checks are now ${manifest.version}, receipt was issued under ${payload.check_version}`);
  const candidateDir = port.candidateDir ? rsv(port.candidateDir) : join(ROOT, 'working');
  if (port.candidateDir && !existsSync(candidateDir)) refuse(`candidate_dir not found: ${candidateDir}`);
  // Re-hash like for like: a receipt issued under `tree:` is still judged by
  // `tree:`, however this gate would hash the same directory today.
  if (treeHash(candidateDir, algoOf(payload.candidate_tree)) !== payload.candidate_tree)
    refuse('receipt stale: candidate tree mismatch');
  console.log(`dr-gate: VERIFIED — run=${runId} contract=sha256:${payload.contract_sha256.slice(0, 12)}… check=${payload.check_version} candidate=${payload.candidate_tree.slice(0, 17)}…`);
} else refuse(`unknown command '${cmd}'`);
