// Shared bits for the demo. The key idea: the AGENT works in an isolated
// workspace (a temp dir) that does NOT contain the gate. The gate (the real
// definition of done) lives here, in gate/, owned by the harness. The agent
// literally cannot read the acceptance checks, exactly like deadreckon.

import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, copyFileSync, rmSync, appendFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import readline from 'node:readline';

export const ROOT = dirname(fileURLToPath(import.meta.url));
export const GATE_DIR = join(ROOT, 'gate');
export const BRIEF = readFileSync(join(ROOT, 'BRIEF.md'), 'utf8').trim();
export const SOLUTION_NAME = 'slugify.mjs';

export const STUB = `export function slugify(input) {\n  throw new Error('not implemented');\n}\n`;
// used only by --mock (a deterministic stand-in for Claude)
export const NAIVE = `export function slugify(input) {\n  return input\n    .toLowerCase()\n    .trim()\n    .replace(/[^a-z0-9]+/g, '-')\n    .replace(/^-+|-+$/g, '');\n}\n`;
export const CORRECT = `export function slugify(input) {\n  return input\n    .toLowerCase()\n    .replace(/&/g, ' and ')\n    .trim()\n    .replace(/[^a-z0-9]+/g, '-')\n    .replace(/^-+|-+$/g, '');\n}\n`;

// ── ANSI colors ──
export const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m',
  cyan: '\x1b[36m', gray: '\x1b[90m', white: '\x1b[97m', orange: '\x1b[38;5;208m',
};

const AGENT_LOG = process.env.AGENT_LOG || null;
export const agentOut = (s) => (AGENT_LOG ? appendFileSync(AGENT_LOG, s + '\n') : process.stdout.write(s + '\n'));
export const control = (s = '') => process.stdout.write(s + '\n');
export const tail = (s, n = 14) => s.trim().split('\n').slice(-n).join('\n');
export function resetLog() { if (AGENT_LOG) writeFileSync(AGENT_LOG, ''); }

// ── pretty headers ──
export function printPrompt(brief) {
  control('');
  control('  ' + C.bold + C.cyan + 'PROMPT TO CLAUDE' + C.reset);
  control('  ' + C.gray + '─'.repeat(48) + C.reset);
  brief.split('\n').forEach((l) => control('  ' + C.gray + (l || ' ') + C.reset));
  control('  ' + C.gray + '─'.repeat(48) + C.reset);
}
export function banner(label) {
  control('');
  control('  ' + C.bold + label + C.reset);
}

// ── Claude-style agent stream lines ──
export const agentSession = () => agentOut('  ' + C.gray + '● started session' + C.reset);
export const agentTool = (name, arg) =>
  agentOut('  ' + C.cyan + '⏺' + C.reset + ' ' + C.bold + name + C.reset + (arg ? C.gray + '(' + arg + ')' + C.reset : ''));
export const agentText = (t) => agentOut('  ' + C.white + '●' + C.reset + ' ' + t);
export const agentResult = (t) => agentOut('    ' + C.gray + '⎿ ' + t + C.reset);

// ── the GATE: run the real tests against the agent's solution in an ephemeral dir ──
export function runGate(workdir) {
  const dir = mkdtempSync(join(tmpdir(), 'dod-gate-'));
  copyFileSync(join(GATE_DIR, 'slugify.test.mjs'), join(dir, 'slugify.test.mjs'));
  copyFileSync(join(workdir, SOLUTION_NAME), join(dir, '_solution.mjs'));
  const res = spawnSync('node', ['--test'], { cwd: dir, encoding: 'utf8' });
  rmSync(dir, { recursive: true, force: true });
  return { passed: res.status === 0, output: (res.stdout || '') + (res.stderr || '') };
}
// pull the human-readable reason a check failed (e.g. expected "x", got "y")
export function failReason(output) {
  const clean = (s) => s.trim().replace(/,\s*$/, '');
  const a = output.match(/actual:\s*(.+)/);
  const e = output.match(/expected:\s*(.+)/);
  if (a && e) return `expected ${clean(e[1])}, got ${clean(a[1])}`;
  const t = output.match(/✖\s+(.+?)\s*\(/);
  return t ? t[1] : 'a required check failed';
}

export function claudeAvailable() { return !spawnSync('claude', ['--version']).error; }

// build a clean, isolated workspace with ONLY the solution stub + the brief
export function setupWorkspace(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, SOLUTION_NAME), STUB);
  writeFileSync(join(dir, 'BRIEF.md'), BRIEF + '\n');
  return dir;
}
export function writeSolution(dir, code) { writeFileSync(join(dir, SOLUTION_NAME), code); }

// drive real Claude Code, streaming its tool calls live
function summarizeInput(input) {
  if (!input || typeof input !== 'object') return '';
  if (input.file_path) return String(input.file_path).split('/').pop();
  if (input.path) return input.path;
  if (input.command) return String(input.command).split('\n')[0].slice(0, 60);
  if (input.pattern) return input.pattern;
  const s = JSON.stringify(input);
  return s.length > 60 ? s.slice(0, 60) + '…' : s;
}
function printEvent(line) {
  let ev;
  try { ev = JSON.parse(line); } catch { return; }
  if (ev.type === 'system' && ev.subtype === 'init') agentSession();
  else if (ev.type === 'assistant' && ev.message?.content) {
    for (const c of ev.message.content) {
      if (c.type === 'text' && c.text?.trim()) agentText(c.text.trim().split('\n')[0].slice(0, 120));
      else if (c.type === 'tool_use') agentTool(c.name, summarizeInput(c.input));
    }
  } else if (ev.type === 'user' && ev.message?.content) {
    for (const c of ev.message.content) {
      if (c.type === 'tool_result') {
        const raw = Array.isArray(c.content) ? c.content.map((x) => x.text || '').join(' ') : c.content || '';
        const first = String(raw).trim().split('\n')[0].slice(0, 78);
        if (first) agentResult(first);
      }
    }
  }
}
export function runClaude(workdir, prompt, { cont = false } = {}) {
  return new Promise((resolve) => {
    const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions'];
    if (cont) args.unshift('--continue');
    const child = spawn('claude', args, { cwd: workdir });
    readline.createInterface({ input: child.stdout }).on('line', printEvent);
    child.stderr.on('data', () => {});
    child.on('error', (e) => { agentOut('  ' + C.red + '⚠ could not launch claude: ' + e.message + C.reset); resolve(); });
    child.on('close', () => resolve());
  });
}
