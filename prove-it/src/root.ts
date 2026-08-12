// Shared worker-side plumbing. control/dr-gate.ts deliberately does NOT import
// this file: the gate must not depend on code the student extends.
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const ROOT =
  process.env.PROVE_IT_ROOT || resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Node >= 22.18 runs .ts directly; no flag, no build step.
export const NODE_ARGS: string[] = [];

export const sha256 = (b: Buffer | string): string =>
  createHash('sha256').update(b).digest('hex');

// Content identity of a candidate tree. TWO algorithms; the prefix on the
// returned string names the one that produced it, and that is what lets a
// receipt earned under either keep verifying forever — `dr-gate` re-hashes with
// the algorithm the RUN recorded, never with today's default.
//
//   gtree:  the files git knows about — tracked, plus new files not ignored
//   tree:   every file in the directory (the fallback, and every receipt
//           issued before gtree existed)
//
// Why git's view is the better default: a repository holds more than your code.
// Editor state (.Rproj.user/), test caches (__pycache__/, .pytest_cache/) and
// installed libraries (renv/library/) sit beside the source and change without
// anyone touching the work — .Rproj.user/ changes with no command run at all.
// Hashing those makes a receipt go stale for reasons that have nothing to do
// with the candidate, which teaches students to distrust a refusal. The two
// algorithms never need to agree with each other; each copy of this code needs
// to agree with the other copy for the SAME algorithm.
export function gitTreeFiles(dir: string): string[] | null {
  const opts = { cwd: dir, encoding: 'utf8' as const };
  const inTree = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], opts);
  if (inTree.status !== 0 || inTree.stdout.trim() !== 'true') return null;
  // Paths come back relative to cwd and scoped to it, so a candidate_dir that
  // is a subdirectory of a larger repo hashes only its own subtree.
  const ls = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], opts);
  if (ls.status !== 0) return null;
  return ls.stdout.split('\0').filter(Boolean).sort();
}

export function treeHash(dir: string, algo?: string): string {
  const files = algo === 'tree' ? null : gitTreeFiles(dir);
  if (!files) return walkTreeHash(dir);
  const h = createHash('sha256');
  for (const rel of files) {
    const p = join(dir, rel);
    h.update(rel);
    // A path git lists but that is not on disk (staged delete, or a broken
    // link) contributes its absence rather than throwing.
    let st;
    try {
      st = lstatSync(p);
    } catch {
      h.update(':missing');
      continue;
    }
    if (st.isSymbolicLink()) h.update(':symlink');
    else if (st.isDirectory()) h.update(':submodule');
    else h.update(readFileSync(p));
  }
  return 'gtree:' + h.digest('hex');
}

function walkTreeHash(dir: string): string {
  const h = createHash('sha256');
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const p = join(d, e.name);
      if (e.isSymbolicLink()) h.update(relative(dir, p) + ':symlink');
      else if (e.isDirectory()) walk(p);
      else {
        h.update(relative(dir, p));
        h.update(readFileSync(p));
      }
    }
  };
  walk(dir);
  return 'tree:' + h.digest('hex');
}

// The only sanctioned path from worker context to the gate: request a run.
export function requestGate(cmd: 'check' | 'verify', runId: string) {
  const r = spawnSync(
    process.execPath,
    [...NODE_ARGS, join(ROOT, 'control', 'dr-gate.ts'), cmd, runId],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, PROVE_IT_ROOT: ROOT, NODE_NO_WARNINGS: '1' },
    },
  );
  return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim() };
}
