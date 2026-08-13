// The single presentation layer for live compare scenarios. Scenarios declare;
// this file owns staging, guards, panes, pauses, fallback, and the artifact.
//
//   node live/runner.ts <scenarioId> [--mock] [--seq] [--ci] [--lane left|right]
//
//   default        tmux, two panes (falls back to --seq if tmux is absent)
//   --seq          left lane fully, then right lane, in one terminal
//   --mock         rehearsal/student mode: mockCmd where declared and capture
//                  replay for real-only lanes; a TTY can still answer the pause
//   --ci           non-interactive: the pause accepts its default
//   --lane SIDE    run one lane only (the tmux panes use this)
//   --describe     print the declared causal difference and exit (the battery)
//   --artifact DIR internal: share one artifact directory across panes
//
// The presentation grammar is a readable transcript: persistent lane title,
// exact input, compact activity, evidence frames, one room decision, and a
// final comparison. Full commands and raw output stay in the artifact.
import { spawn, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import readline from 'node:readline';
import {
  cleanInlineMarkdown,
  evidenceForScreen,
  inputBlocks,
  renderPresentationEvent,
  stripAnsi,
  summarizeCommand,
  summarizeTool,
  wrapText,
} from './presentation.ts';
import { presentClaudeLine } from './providers/claude-cli.ts';
import {
  armBarriers,
  awaitCheckpoint,
  releasePeer,
  signalCheckpoint,
  waitAtFrame,
} from './runtime/barriers.ts';
import type { FrameName, LaneSide, PauseSpec, Scenario, Step } from './scenario.ts';

// A node:test ancestor marks its children with NODE_TEST_CONTEXT, and a child
// `node --test <check>` that sees it SKIPS the check silently — exit 0, no
// output. A tmux server started under a test suite hands that mark to every
// pane. Scrubbed here, once, so every step, gate, and check this process
// spawns runs the same way it does from a clean shell.
delete process.env.NODE_TEST_CONTEXT;

const LIVE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(LIVE, '..');
const MARKER = '.prove-it-live-lane'; // ownership marker: cleanup refuses dirs without it
// --details widens the same throttle instead of removing it: the artifact is
// still the complete record, and a 300-line test run would drown the frames.
// (process.argv directly — the flag helpers are declared further down.)
const HEAD_LINES = process.argv.includes('--details') ? 12 : 2;
const TAIL_LINES = process.argv.includes('--details') ? 6 : 1;

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[97m',
  orange: '\x1b[38;5;208m',
};
const FRAME_COLOR: Record<FrameName, string> = {
  START: C.cyan,
  SURPRISE: C.yellow,
  CONTROL: C.orange,
  VERDICT: C.green,
};
const FRAME_INDEX: Record<FrameName, number> = { START: 1, SURPRISE: 2, CONTROL: 3, VERDICT: 4 };
// How long a pane will hold at a frame for its peer. Generous, because a real
// worker runs for minutes — but finite, because a pane that waits forever in
// front of a room is worse than one that says what went wrong.
const FRAME_WAIT_MS = Number(process.env.PROVE_IT_FRAME_WAIT_MS ?? 600_000);
const BAD = /fail(?!\s*0\b)|refus|✖|error|unexpected/i; // VERDICT (and summary) go red by content

const argv = process.argv.slice(2);
const id = argv[0];
const has = (f: string) => argv.includes(f);
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const MOCK = has('--mock');
const CI = has('--ci');
// Display depth only. It changes how much of the record reaches the screen and
// never what the record contains — the artifact is identical either way.
const DETAILS = has('--details');
// Explicit replay. It never starts a provider: a capture-backed lane plays its
// recording instead. There is deliberately no automatic path into this mode —
// a run that falls back to a recording on its own is a run whose evidence
// nobody can trust.
const CAPTURE = has('--capture');
const LANE = opt('--lane') as LaneSide | undefined;
const ARTIFACT_OPT = opt('--artifact');
const MODE = MOCK ? 'mock' : 'real';
let seqMode = has('--seq');

const fail = (msg: string): never => {
  console.error(`runner: ${msg}`);
  process.exit(1);
};

// ── cleanup: preserve the artifact (already on disk), then remove only temp
// directories that pass both the expected-path and ownership-marker checks ──
const staged: string[] = [];
function cleanup() {
  for (const dir of staged) {
    try {
      const real = realpathSync(dir);
      if (!real.startsWith(realpathSync(tmpdir()) + sep)) continue;
      if (!existsSync(join(real, MARKER))) continue;
      rmSync(real, { recursive: true, force: true });
    } catch {
      /* a vanished temp dir is already clean */
    }
  }
}
process.on('exit', () => {
  // Whatever happens to this lane, its peer must not be left at a barrier.
  if (LANE && artDir) releasePeer(artDir, LANE, process.exitCode ? `exit ${process.exitCode}` : 'lane finished');
  cleanup();
});
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const)
  process.on(sig, () => {
    console.error(`\nrunner: interrupted — artifact preserved, temp copies removed.`);
    process.exit(130);
  });

async function loadScenario(scenarioId: string): Promise<Scenario> {
  const dir = join(LIVE, 'scenarios');
  const file = existsSync(dir)
    ? readdirSync(dir).find((f) => f.startsWith(scenarioId + '-') && f.endsWith('.ts'))
    : undefined;
  if (!file) return fail(`no scenario '${scenarioId}' under live/scenarios/ (expected ${scenarioId}-*.ts)`);
  const mod = await import(pathToFileURL(join(dir, file)).href);
  const sc: Scenario | undefined = mod.default ?? mod.scenario;
  if (!sc?.steps?.length) return fail(`${file} does not export a Scenario`);
  return sc;
}

function replayCommand(sc: Scenario): string {
  const flags = [MOCK ? ' --mock' : '', seqMode ? ' --seq' : ''].join('');
  return `bash scripts/demo-compare.sh ${sc.id}${flags}`;
}

function artifactDir(sc: Scenario): string {
  if (ARTIFACT_OPT) {
    mkdirSync(ARTIFACT_OPT, { recursive: true });
    return ARTIFACT_OPT;
  }
  const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, 'Z');
  const dir = join(LIVE, 'artifacts', `${sc.id}-${ts}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function seedArtifact(sc: Scenario, art: string) {
  try {
    writeFileSync(join(art, 'frames.txt'), `# expected evidence shape: ${sc.evidenceNote}\n`, {
      flag: 'wx',
    });
  } catch {
    /* another pane already seeded it */
  }
  if (!existsSync(join(art, 'replay.txt')))
    writeFileSync(join(art, 'replay.txt'), replayCommand(sc) + '\n');
}

// ── staging: each lane gets its own throwaway copy of the checkout ──
function stageLane(sc: Scenario, side: LaneSide): string {
  const tmp = mkdtempSync(join(tmpdir(), `prove-it-live-${sc.id}-${side}-`));
  staged.push(tmp);
  cpSync(ROOT, tmp, {
    recursive: true,
    filter: (src) => {
      const rel = relative(ROOT, src);
      if (rel === '') return true;
      const parts = rel.split(sep);
      const top = parts[0];
      if (top === '.git' || top === 'node_modules') return false;
      if (top !== 'live') return true;
      if (parts.length === 1) return true; // the live/ directory itself
      // A lane needs the live runtime — S3 drives it directly. It must never
      // get the script of the demo it is starring in: no scenarios, no
      // captures, no runner, no artifacts from earlier runs.
      const second = parts[1];
      return second === 'runtime' || second === 'providers' || second === 'presentation.ts';
    },
  });
  for (const runState of [join(tmp, 'runs'), join(tmp, 'control', 'receipts')]) {
    mkdirSync(runState, { recursive: true });
    for (const e of readdirSync(runState)) if (e !== '.gitkeep') rmSync(join(runState, e), { recursive: true, force: true });
  }
  copyFileSync(
    join(tmp, 'control', 'checks', 'fixtures', 'solution-stub.mjs'),
    join(tmp, 'working', 'src', 'slugify.mjs'),
  );
  // Observer tooling (e.g. SpecStory) writes session transcripts into the
  // workspace; they are not worker output and must not contaminate evidence
  // diffstats. Only the stage's own .gitignore changes, never the checkout's.
  appendFileSync(join(tmp, '.gitignore'), '.specstory/\n');
  writeFileSync(join(tmp, MARKER), `${sc.id} ${side} ${new Date().toISOString()}\n`);
  return tmp;
}

// HARD GUARD: no step ever runs outside its lane's temp copy. Refuse loudly.
function assertStaged(cwd: string, stage: string) {
  const real = realpathSync(cwd);
  const stageReal = realpathSync(stage);
  const inside = real === stageReal || real.startsWith(stageReal + sep);
  const inTmp = stageReal.startsWith(realpathSync(tmpdir()) + sep);
  const owned = existsSync(join(stageReal, MARKER));
  if (!inside || !inTmp || !owned)
    fail(
      `REFUSING to run a step: cwd '${real}' is not inside an owned temp copy ` +
        `('${stageReal}'). Nothing may touch the real checkout.`,
    );
}

function childEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_NO_WARNINGS: '1' };
  if (!env.TMPDIR) env.TMPDIR = tmpdir(); // Linux leaves TMPDIR unset; scenario commands expand $TMPDIR
  delete env.PROVE_IT_ROOT; // the staged copy resolves its own root; never inherit one
  return env;
}

interface LaneState {
  side: LaneSide;
  stage: string;
  runid: string;
  answer: string | null;
  onCapture: boolean;
  capChunked: boolean; // capture entered at a declared step: play it in chunks, in step order
  capLines: string[];
  capCursor: number;
  capPlayed: number;
  unexpected: boolean;
  activityOpen: boolean;
}

const framesMem: Record<LaneSide, Partial<Record<FrameName, string>>> = { left: {}, right: {} };
let artDir = '';

// ── output primitives: one writer, so blank lines never stack ──
let lastBlank = true;
const put = (s = '') => {
  if (s === '' && lastBlank) return;
  console.log(s);
  lastBlank = s.trim() === '';
};
const blank = () => put('');
const show = (s: string) => put('  ' + s);
const logLane = (side: LaneSide, text: string) =>
  appendFileSync(join(artDir, `${side}.log`), text + '\n');
// {{artifact}} and {{shared}} are the same in both panes: the artifact
// directory is what the lanes have in common, so a shared prefix can be named
// without either lane having to know about the other.
const interp = (s: string, lane: LaneState) =>
  s
    .replaceAll('{{runid}}', lane.runid)
    .replaceAll('{{artifact}}', artDir)
    .replaceAll('{{shared}}', sharedId())
    .replaceAll('{{authorship}}',
      MOCK
        ? 'Mock: no Claude process starts; the supplied stronger check stands in for Claude authorship.'
        : 'Live: one real Claude worker authors the stronger check.')
    .replaceAll('{{answer}}', lane.answer ?? '{{answer}}');

// A run id both panes derive identically, from the one thing they share.
const sharedId = () => `sh-${artDir.split(sep).pop()}`;
const firstLine = (s: string) => s.split('\n').find((l) => l.trim())?.trim() ?? '';
const paneColumns = () => process.stdout.columns ?? 118;
const bodyWidth = (prefixWidth = 0) => Math.max(34, Math.min(92, paneColumns() - 6) - prefixWidth);

function uiSection(label: string, color = C.gray) {
  blank();
  show(`${C.bold}${color}${label}${C.reset}`);
}

function uiParagraph(
  text: string,
  options: {
    color?: string;
    bold?: boolean;
    prefix?: string;
    continuation?: string;
    indent?: number;
    maxLines?: number;
  } = {},
) {
  const color = options.color ?? C.white;
  const prefix = options.prefix ?? '';
  const continuation = options.continuation ?? ' '.repeat(prefix.length);
  const indent = ' '.repeat(options.indent ?? 2);
  const available = bodyWidth(Math.max(prefix.length, continuation.length));
  let lines = wrapText(text, available);
  if (options.maxLines && lines.length > options.maxLines) {
    lines = lines.slice(0, options.maxLines);
    const last = lines.length - 1;
    lines[last] = `${lines[last].slice(0, Math.max(1, available - 1))}…`;
  }
  let first = true;
  for (const line of lines) {
    if (!line) {
      blank();
      first = true;
      continue;
    }
    const marker = first ? prefix : continuation;
    put(`${indent}${options.bold ? C.bold : ''}${color}${marker}${line}${C.reset}`);
    first = false;
  }
}

function uiActivity(text: string, options: { color?: string; symbol?: string } = {}) {
  uiParagraph(text, {
    color: options.color ?? C.gray,
    prefix: `${options.symbol ?? '•'} `,
    continuation: '  ',
    indent: 2,
  });
}

function uiMeta(text: string) {
  uiParagraph(text, { color: C.gray });
}

function openActivity(lane: LaneState, label?: string) {
  if (lane.activityOpen) return;
  const activityLabel = label ?? (lane.onCapture ? 'REPLAY ACTIVITY' : MODE === 'real' ? 'LIVE ACTIVITY' : 'ACTIVITY');
  uiSection(activityLabel);
  lane.activityOpen = true;
}

const sayLine = (side: LaneSide, text: string) => {
  uiParagraph(text, { color: C.gray });
  logLane(side, `· ${text}`);
};

const cmdLine = (cmd: string) => uiActivity(summarizeCommand(cmd));

// Show the exact worker input with readable line wrapping. The artifact keeps
// the original text, including line breaks and technical names.
function printInput(side: LaneSide, label: string, text: string) {
  uiSection(label.toUpperCase(), C.gray);
  const blocks = inputBlocks(text);
  blocks.forEach((block, index) => {
    if (block.label) {
      uiParagraph(block.label, { color: C.gray, bold: true });
      uiParagraph(block.text, { color: C.white, indent: 4 });
      return;
    }
    uiParagraph(block.text, {
      color: index === 0 ? C.cyan : C.white,
      prefix: index === 0 ? '› ' : '  ',
      continuation: '  ',
    });
  });
  logLane(side, `${label.toUpperCase()} (shown on screen):`);
  for (const line of text.split('\n')) logLane(side, `  ${line}`);
}

// Live and replay streams use the same compact transcript. Tool activity is a
// bullet. Worker prose is a paragraph. Raw Markdown never reaches the screen.
function streamLine(raw: string, mode: 'worker' | 'exhibit') {
  const t = stripAnsi(raw).trim();
  if (!t) return;
  if (t.startsWith('$ ')) {
    cmdLine(t.slice(2));
    return;
  }
  if (t.startsWith('⏺')) {
    uiActivity(cleanInlineMarkdown(t.slice(1).trim()), { color: C.gray });
    return;
  }
  if (t.startsWith('●')) {
    uiParagraph(cleanInlineMarkdown(t.slice(1).trim()), { color: C.gray, indent: 4, maxLines: 2 });
    return;
  }
  if (t.startsWith('⎿')) {
    const result = evidenceForScreen(t.slice(1).trim());
    uiActivity(result, { color: BAD.test(result) ? C.red : C.gray, symbol: '↳' });
    return;
  }
  const clean = evidenceForScreen(t);
  if (mode === 'worker') uiParagraph(clean, { color: C.gray, indent: 4, maxLines: 2 });
  else uiActivity(clean, { color: BAD.test(clean) ? C.red : C.gray, symbol: '↳' });
}

// Head+tail throttle: at most HEAD_LINES + TAIL_LINES visible lines per step,
// with an honest elision in the middle. The full text is always in the artifact.
function makeStream(mode: 'worker' | 'exhibit') {
  let shown = 0;
  let hidden = 0;
  const held: string[] = [];
  return {
    push(line: string) {
      if (!line.trim()) return;
      if (shown < HEAD_LINES) {
        streamLine(line, mode);
        shown += 1;
      } else {
        held.push(line);
        if (held.length > TAIL_LINES) {
          held.shift();
          hidden += 1;
        }
      }
    },
    flush() {
      if (hidden > 0) uiMeta(`… ${hidden} more lines in the artifact`);
      for (const l of held) streamLine(l, mode);
    },
  };
}

// ── worker stream rendering ────────────────────────────────────────────────
// The runner does not parse provider output. The adapter turns a stream line
// into normalized events; the renderer turns those into screen lines. Adding a
// second provider adds an adapter here, and nothing else.
//
// Returns rendered lines, or null when the line is not a provider event at all
// and should be printed as it stands.
function workerStreamLines(raw: string, side: LaneSide): string[] | null {
  const parsed = presentClaudeLine(raw);
  if (!parsed) return null;
  if (parsed.artifact) logLane(side, parsed.artifact);
  return parsed.events.flatMap((event) =>
    renderPresentationEvent(event, { style: 'glyph', details: DETAILS, width: 96 }),
  );
}

function execStep(
  cmdText: string,
  cwd: string,
  timeoutMs: number,
  side: LaneSide,
  options: { render: 'worker' | 'exhibit' | 'none' },
) {
  return new Promise<{ code: number; out: string; timedOut: boolean }>((done) => {
    const child = spawn('bash', ['-c', cmdText], {
      cwd,
      env: childEnv(),
      detached: true, // its own process group, so a timeout can stop all of it
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const lines: string[] = [];
    const stream = options.render === 'none' ? null : makeStream(options.render);
    const onLine = (line: string) => {
      lines.push(line);
      if (options.render === 'worker') {
        const rendered = workerStreamLines(line, side);
        if (rendered) {
          for (const r of rendered) {
            logLane(side, r);
            stream?.push(r);
          }
          return;
        }
      }
      logLane(side, line);
      stream?.push(line);
    };
    readline.createInterface({ input: child.stdout! }).on('line', onLine);
    readline.createInterface({ input: child.stderr! }).on('line', onLine);
    let timedOut = false;
    const input = process.stdin as NodeJS.ReadStream;
    const wasPaused = input.isPaused();
    const wasRaw = input.isRaw ?? false;
    const stopInput = () => {
      input.off('data', onInput);
      if (input.isTTY && input.setRawMode) input.setRawMode(wasRaw);
      if (wasPaused) input.pause();
    };
    const stopChild = () => {
      try {
        process.kill(-child.pid!, 'SIGKILL');
      } catch {
        /* already gone */
      }
    };
    const onInput = (chunk: Buffer | string) => {
      const key = chunk.toString();
      if (key.includes('\u0003')) {
        stopChild();
        stopInput();
        process.kill(process.pid, 'SIGINT');
        return;
      }
    };
    if (input.isTTY && input.setRawMode) {
      // Ctrl-C only. There is no key that swaps a live worker for a recording.
      input.setRawMode(true);
      input.resume();
      input.on('data', onInput);
    }
    const timer = setTimeout(() => {
      timedOut = true;
      stopChild();
    }, timeoutMs);
    child.on('error', () => {
      clearTimeout(timer);
      stopInput();
      done({ code: 127, out: lines.join('\n'), timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      stopInput();
      stream?.flush();
      done({ code: code ?? 1, out: lines.join('\n'), timedOut });
    });
  });
}

// The switch to a capture must be visible and honest, never silent. The body
// never dumps here: the lane plays it in chunks, each beside the step that
// narrates it (playCaptureChunk below), through the same stream renderer the
// live path uses — so a replay and a live run share one shape.
function replayCapture(sc: Scenario, lane: LaneState, reason: string) {
  const cap = sc.lanes[lane.side].capture;
  if (!cap) {
    uiSection('REPLAY ERROR', C.red);
    uiParagraph(`No capture exists for the ${lane.side} lane.`, { color: C.red, bold: true });
    lane.unexpected = true;
    process.exitCode = 1;
    return;
  }
  const file = resolve(ROOT, cap.path);
  if (!existsSync(file)) {
    uiSection('REPLAY ERROR', C.red);
    uiParagraph(`The capture is missing: ${cap.path}`, { color: C.red, bold: true });
    lane.unexpected = true;
    process.exitCode = 1;
    return;
  }
  const raw = readFileSync(file, 'utf8').split('\n');
  let i = 0;
  const header: string[] = [];
  while (i < raw.length && raw[i].startsWith('#')) header.push(raw[i++]);
  const body = raw
    .slice(i)
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
  uiSection('REPLAY', C.orange);
  const replayMessage = MOCK && reason.includes('real-only step')
    ? 'This mock run uses a recorded worker.'
    : `The recorded worker replaces the live worker because ${reason}.`;
  uiParagraph(replayMessage, { color: C.white });
  const recorded = cap.provenance.match(/recorded ([0-9-]+)/)?.[1] ?? 'an earlier run';
  const reader = cap.provenance.includes('fresh reader') ? 'Claude CLI fresh reader' : 'Claude CLI';
  uiMeta(`Recorded ${recorded} · ${reader} · real capture · local paths removed`);
  appendFileSync(join(artDir, `${lane.side}.log`), body + '\n');
  appendFileSync(
    join(artDir, 'provenance.txt'),
    `${lane.side}: replayed ${cap.path} — ${cap.provenance} (reason: ${reason})\n` +
      header.map((h) => `${lane.side}: ${h}`).join('\n') +
      '\n',
  );
  lane.onCapture = true;
  lane.activityOpen = false;
  lane.capLines = body.split('\n');
  lane.capCursor = 0;
  lane.capPlayed = 0;
  setPaneTitle(sc, lane);
}

// Interleaved capture playback. Captures are self-narrating: their `· ` lines
// are the say-lines the runner just printed live, so skip them, then play the
// recorded lines for this step — everything up to the next narration line.
// Worker steps show a compact chunk. Everything else plays silently into the
// artifact. Frames keep extracting from the full capture, in step order.
function playCaptureChunk(lane: LaneState, opts: { body?: boolean; cmds?: boolean } = {}) {
  const isSay = (l: string) => l.startsWith('· ');
  let i = lane.capPlayed;
  while (i < lane.capLines.length && isSay(lane.capLines[i])) i++;
  const start = i;
  while (i < lane.capLines.length && !isSay(lane.capLines[i])) i++;
  lane.capPlayed = i;
  if (i <= start || (!opts.body && !opts.cmds)) return;
  const stream = opts.body ? makeStream('worker') : null;
  let printedCmd = false;
  for (const l of lane.capLines.slice(start, i)) {
    if (l.startsWith('$ ')) {
      if (opts.cmds && (opts.body || !printedCmd)) {
        cmdLine(l.slice(2));
        printedCmd = true;
      }
      continue;
    }
    stream?.push(l);
  }
  stream?.flush();
}

function matchExtract(pattern: string, out: string): string | null {
  const re = new RegExp(pattern);
  for (const l of out.split('\n')) if (re.test(l)) return l.trim();
  return null;
}

// Frames replayed from a capture are matched in order: the cursor only moves
// forward, so START/SURPRISE/CONTROL/VERDICT land in sequence.
// Hold this pane at the frame until the other one is showing the same thing.
// A lane that is alone never waits; a lane whose peer died is released and told
// so on screen, rather than standing at a barrier in front of a room.
async function syncAtFrame(lane: LaneState, frame: FrameName): Promise<void> {
  const result = await waitAtFrame(artDir, lane.side, frame, FRAME_WAIT_MS);
  if (result.outcome === 'synced' && result.waitedMs > 400)
    uiMeta(`… waited ${(result.waitedMs / 1000).toFixed(1)}s for the other lane at ${frame}`);
  if (result.outcome === 'peer_failed' || result.outcome === 'timeout') {
    uiSection('LANE ERROR', C.red);
    uiParagraph(result.detail, { color: C.red, bold: true });
    lane.unexpected = true;
    process.exitCode = 1;
  }
}

function frameFromCapture(lane: LaneState, step: Step): string | null {
  const re = new RegExp(step.extract!);
  for (let i = lane.capCursor; i < lane.capLines.length; i++) {
    if (re.test(lane.capLines[i])) {
      lane.capCursor = i + 1;
      return lane.capLines[i].trim();
    }
  }
  return null;
}

// Evidence frames pair one short explanation with one decisive result. The
// artifact keeps the original result line for later inspection.
function emitFrame(
  sc: Scenario,
  lane: LaneState,
  name: FrameName,
  line: string,
  context?: string,
  showEvidence = true,
) {
  framesMem[lane.side][name] = line;
  const color = name === 'VERDICT' && BAD.test(line) ? C.red : FRAME_COLOR[name];
  uiSection(name, color);
  if (context) uiParagraph(context, { color: C.white });
  if (showEvidence) {
    const evidence = evidenceForScreen(line);
    uiParagraph(evidence, {
      color: name === 'VERDICT' ? color : name === 'SURPRISE' ? C.yellow : C.white,
      bold: true,
    });
  }
  lane.activityOpen = false;
  setPaneTitle(sc, lane, name);
  // The evidence file is read by the battery and by people. Colour codes from
  // a lane's own output are screen decoration, not evidence.
  appendFileSync(join(artDir, 'frames.txt'), `${lane.side} ${name} │ ${stripAnsi(line)}\n`);
}

async function runPause(sc: Scenario, lane: LaneState) {
  const p: PauseSpec = sc.pause;
  uiSection('ROOM DECISION', C.yellow);
  uiParagraph(p.question, { color: C.white, bold: true });
  if (p.kind === 'menu' && p.options) {
    p.options.forEach((option, index) => {
      const hint = option === p.default ? '  (Enter)' : '';
      uiParagraph(`${option}${hint}`, {
        color: option === p.default ? C.white : C.gray,
        prefix: `${index + 1}  `,
        continuation: '   ',
        indent: 4,
      });
    });
  } else {
    uiMeta(`Press Enter to use: ${p.default}`);
  }
  let answer = p.default;
  let defaultUsed = true;
  if (!CI && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const raw = (await new Promise<string>((res) => rl.question(`  ${C.yellow}›${C.reset} `, res))).trim();
    rl.close();
    if (raw) {
      if (p.kind === 'menu' && p.options) {
        const pick = p.options[Number(raw) - 1] ?? p.options.find((o) => o === raw);
        if (pick) {
          answer = pick;
          defaultUsed = false;
        } else uiMeta(`The answer was not recognized. Using: ${p.default}`);
      } else {
        answer = raw;
        defaultUsed = false;
      }
    }
  } else {
    const why = CI ? '--ci' : 'no TTY';
    uiParagraph(answer, { color: C.white, prefix: '› ', continuation: '  ' });
    uiMeta(`The default was accepted automatically (${why}).`);
  }
  lane.answer = answer;
  logLane(lane.side, `? ${p.question}`);
  logLane(lane.side, `> ${answer}${defaultUsed ? ' (default)' : ''}`);
  writeFileSync(
    join(artDir, 'decision.txt'),
    `scenario: ${sc.id} — ${sc.title}\n` +
      `question: ${p.question}\n` +
      `answer: ${answer}\n` +
      `default-used: ${defaultUsed ? 'yes' : 'no'}\n` +
      `note: ${sc.artifactNote}\n`,
  );
  uiActivity(`Recorded as evidence: ${answer}`, { color: C.green, symbol: '✓' });
  lane.activityOpen = false;
}

async function readSharedDecision(sc: Scenario, lane: LaneState) {
  const file = join(artDir, 'decision.txt');
  uiSection('ROOM DECISION', C.yellow);
  uiMeta('The room answers once in the left pane. This lane waits for that answer.');
  const deadline = Date.now() + 60_000;
  while (!existsSync(file) && Date.now() < deadline)
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  if (!existsSync(file)) fail(`the shared room decision did not arrive within 60 seconds`);
  const text = readFileSync(file, 'utf8');
  const answer = text.match(/^answer: (.*)$/m)?.[1];
  if (!answer) fail(`the shared decision artifact has no answer`);
  lane.answer = answer;
  logLane(lane.side, `> ${answer} (shared room decision)`);
  uiActivity(`Received the room answer: ${answer}`, { color: C.green, symbol: '✓' });
  lane.activityOpen = false;
}

function laneMode(lane: LaneState): string {
  if (lane.onCapture) return 'REPLAY';
  return MODE === 'real' ? 'LIVE' : 'MOCK';
}

function setPaneTitle(sc: Scenario, lane: LaneState, frame?: FrameName, done = false) {
  if (!process.env.TMUX || !process.env.TMUX_PANE) return;
  const progress = frame ? ` · ${FRAME_INDEX[frame]}/4` : '';
  const state = done ? 'DONE' : laneMode(lane);
  const title = `${lane.side.toUpperCase()} · ${sc.lanes[lane.side].label}   ${state}${progress}`;
  spawnSync('tmux', ['select-pane', '-t', process.env.TMUX_PANE, '-T', title]);
}

async function runLane(sc: Scenario, side: LaneSide): Promise<LaneState> {
  const spec = sc.lanes[side];
  const stage = stageLane(sc, side);
  const lane: LaneState = {
    side,
    stage,
    runid: `${sc.id}${side === 'left' ? 'l' : 'r'}-${Date.now().toString(36).slice(-6)}`,
    answer: null,
    onCapture: false,
    capChunked: false,
    capLines: [],
    capCursor: 0,
    capPlayed: 0,
    unexpected: false,
    activityOpen: false,
  };
  appendFileSync(join(artDir, 'provenance.txt'), `${side}: mode=${MODE} stage=${stage}\n`);
  logLane(side, `lane: ${spec.label}`);
  logLane(side, `mechanism: ${sc.mechanism}`);
  logLane(side, `shared fixture: ${sc.sharedFixture}`);
  logLane(side, `mode: ${MODE}`);
  logLane(side, `stage: ${stage}`);
  setPaneTitle(sc, lane);
  if (spec.promptDisplay) printInput(side, spec.inputLabel ?? 'INPUT', interp(spec.promptDisplay, lane));
  const timeoutMs = (sc.stepTimeoutSec ?? 300) * 1000;

  for (const step of sc.steps) {
    if (step.lane !== 'both' && step.lane !== side) continue;
    if (step.awaits) {
      const ready = await awaitCheckpoint(artDir, side, step.awaits, FRAME_WAIT_MS);
      if (ready.outcome === 'synced')
        uiMeta(`… the other lane finished ${step.awaits}; continuing from it`);
      if (ready.outcome === 'peer_failed' || ready.outcome === 'timeout') {
        uiSection('LANE ERROR', C.red);
        uiParagraph(ready.detail, { color: C.red, bold: true });
        lane.unexpected = true;
        process.exitCode = 1;
        return;
      }
    }
    const context = step.say ? interp(step.say, lane) : undefined;
    if (context) {
      if (step.frame) logLane(side, `· ${context}`);
      else sayLine(side, context);
    }
    if (step.promptDisplay)
      printInput(side, step.inputLabel ?? 'INPUT', interp(step.promptDisplay, lane));
    if (step.pause) {
      if (step.lane === 'both' && side === 'right') await readSharedDecision(sc, lane);
      else await runPause(sc, lane);
    }

    // --capture replays a recorded worker where a lane has one. A lane with no
    // recording has nothing to replay, so it runs its keyless mock path — the
    // alternative would be executing real-mode commands against a shared
    // prefix no worker ever produced.
    const declared =
      MOCK || (CAPTURE && !spec.capture)
        ? (step.mockCmd ?? step.cmd)
        : (step.realCmd ?? step.cmd);
    // In --capture the worker step is not executed at all; the replay below
    // takes it, exactly as the mock path does for a real-only lane.
    const cmdText = CAPTURE && step.captureRef === true ? undefined : declared;
    const isWorker = step.captureRef === true || Boolean(step.promptDisplay);
    let out: string | null = null;
    if (!lane.onCapture && cmdText) {
      const cmd = interp(cmdText, lane);
      logLane(side, `$ ${cmd}`);
      const cwd = step.cwdKey ? resolve(stage, step.cwdKey) : stage;
      assertStaged(cwd, stage);
      const render = isWorker ? 'worker' : step.showOutput === true ? 'exhibit' : 'none';
      if (render !== 'none') {
        openActivity(lane, isWorker ? undefined : 'ACTIVITY');
        cmdLine(cmd);
      }
      const res = await execStep(cmd, cwd, timeoutMs, side, {
        render,
      });
      out = res.out;
      if (res.timedOut || res.code !== 0) {
        const why = res.timedOut
          ? `timed out after ${timeoutMs / 1000}s`
          : `failed (exit ${res.code})`;
        // A live step that fails is a live step that failed. Sliding into a
        // recording here would put a rehearsal on screen under the same
        // labels as a real run, which is the one thing the artifact could
        // never tell the room afterwards.
        uiSection('UNEXPECTED', C.red);
        uiParagraph(`The step ${why}.`, { color: C.red, bold: true });
        if (spec.capture)
          uiParagraph(
            `To show the recorded worker instead, start again with: ${replayCommand(sc)} --capture`,
            { color: C.white },
          );
        lane.unexpected = true;
        process.exitCode = 1;
      }
    } else if (!lane.onCapture && !cmdText && step.captureRef) {
      replayCapture(
        sc,
        lane,
        CAPTURE
          ? `--capture was given on the command line`
          : MOCK
          ? `real-only step in --mock mode`
          : `real-only step, real mode off`,
      );
      if (lane.onCapture) {
        lane.capChunked = true;
        openActivity(lane);
        playCaptureChunk(lane, { body: true, cmds: true });
      }
    } else if (lane.onCapture && lane.capChunked && (step.realCmd ?? step.cmd)) {
      if (isWorker) openActivity(lane);
      playCaptureChunk(lane, { body: isWorker, cmds: isWorker });
    }

    // Signalled before the frame barrier, never after. The checkpoint says
    // "the work your lane needs is on disk"; the barrier says "wait for me on
    // screen". Doing them the other way round deadlocks a two-pane run: this
    // lane blocks at the barrier while its peer waits for the checkpoint this
    // step just finished producing.
    if (step.signals) signalCheckpoint(artDir, step.signals);

    if (step.frame) {
      let line: string | null = null;
      if (step.extract) {
        line = lane.onCapture && out === null ? frameFromCapture(lane, step) : matchExtract(step.extract, out ?? '');
      } else if (context) {
        line = firstLine(context);
      } else if (out) {
        line = firstLine(out);
      }
      if (line) {
        emitFrame(sc, lane, step.frame, line, context, Boolean(step.extract));
        await syncAtFrame(lane, step.frame);
      } else {
        emitFrame(
          sc,
          lane,
          step.frame,
          'UNEXPECTED — decisive line not found (full log in artifact)',
          context,
        );
        lane.unexpected = true;
        process.exitCode = 1;
        await syncAtFrame(lane, step.frame);
      }
    }
  }
  while (lane.capChunked && lane.capPlayed < lane.capLines.length) playCaptureChunk(lane);
  setPaneTitle(sc, lane, 'VERDICT', true);
  return lane;
}

function artifactScreenPath(): string {
  const rel = relative(ROOT, artDir);
  return rel && !rel.startsWith('..') ? rel : artDir.split(sep).pop() ?? artDir;
}

function artifactVerdicts(): Partial<Record<LaneSide, string>> {
  const file = join(artDir, 'frames.txt');
  if (!existsSync(file)) return {};
  const result: Partial<Record<LaneSide, string>> = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    for (const side of ['left', 'right'] as LaneSide[]) {
      const prefix = `${side} VERDICT │ `;
      if (line.startsWith(prefix)) result[side] = line.slice(prefix.length);
    }
  }
  return result;
}

function renderFinalComparison(sc: Scenario, verdicts: Partial<Record<LaneSide, string>>) {
  uiSection('FINAL COMPARISON', C.cyan);
  for (const side of ['left', 'right'] as LaneSide[]) {
    uiParagraph(`${side.toUpperCase()} · ${sc.lanes[side].label}`, { color: C.gray, bold: true });
    const verdict = evidenceForScreen(verdicts[side] ?? 'No verdict was recorded.');
    uiParagraph(verdict, { color: BAD.test(verdict) ? C.red : C.green, bold: true, indent: 4 });
  }
  uiSection('ONLY DIFFERENCE');
  uiParagraph(sc.allowedCausalDifference, { color: C.white });
  blank();
  uiMeta(`Artifact: ${artifactScreenPath()}`);
  uiMeta(`Replay: ${replayCommand(sc)}`);
}

async function finishLane(sc: Scenario, lane: LaneState) {
  if (lane.side === 'left') {
    uiSection('DONE', C.green);
    uiMeta('This lane is complete. The final comparison appears in the right pane.');
    return;
  }
  let verdicts = artifactVerdicts();
  if (!verdicts.left || !verdicts.right) {
    uiSection('WAITING');
    uiMeta('This lane is complete. Waiting for the other verdict.');
    const deadline = Date.now() + ((sc.stepTimeoutSec ?? 300) + 30) * 1000;
    while ((!verdicts.left || !verdicts.right) && Date.now() < deadline) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 200));
      verdicts = artifactVerdicts();
    }
  }
  renderFinalComparison(sc, verdicts);
}

// ── the battery's view: lane-specific steps against the declared difference ──
function describe(sc: Scenario) {
  const laneSteps = sc.steps.filter((s) => s.lane !== 'both');
  console.log(`${sc.id} — ${sc.title}`);
  console.log(`allowed causal difference: ${sc.allowedCausalDifference || '(none declared)'}`);
  console.log(`expected left verdict: ${sc.expectedVerdicts?.left || '(none declared)'}`);
  console.log(`expected right verdict: ${sc.expectedVerdicts?.right || '(none declared)'}`);
  console.log('causal difference:');
  for (const s of laneSteps) {
    const what = s.cmd ?? s.realCmd ?? s.mockCmd ?? (s.pause ? '(pause)' : (s.say ?? '(frame only)'));
    console.log(`  ${s.lane.padEnd(5)} ${what}`);
  }
  const pauseCount = sc.steps.filter((s) => s.pause).length;
  if (laneSteps.length > 0 && !sc.allowedCausalDifference) {
    console.error('describe: lane-specific steps exist with no allowedCausalDifference declared');
    process.exitCode = 1;
  }
  if (!sc.expectedVerdicts?.left || !sc.expectedVerdicts?.right) {
    console.error('describe: both expected verdict regexes are required');
    process.exitCode = 1;
  }
  if (pauseCount !== 1) {
    console.error(`describe: expected exactly one declared pause, found ${pauseCount}`);
    process.exitCode = 1;
  }
}

function assertArtifact(sc: Scenario, dir: string) {
  const file = join(resolve(dir), 'frames.txt');
  if (!existsSync(file)) fail(`no frames.txt in artifact '${dir}'`);
  const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
  for (const side of ['left', 'right'] as LaneSide[]) {
    for (const frame of ['START', 'SURPRISE', 'CONTROL', 'VERDICT'] as FrameName[]) {
      const count = lines.filter((line) => line.startsWith(`${side} ${frame}`)).length;
      if (count !== 1) fail(`${side} must emit one ${frame} frame; found ${count}`);
    }
    const verdict = lines.find((line) => line.startsWith(`${side} VERDICT`)) ?? '';
    if (!new RegExp(sc.expectedVerdicts[side]).test(verdict))
      fail(`${side} verdict does not match /${sc.expectedVerdicts[side]}/: ${verdict}`);
  }
  if (!existsSync(join(resolve(dir), 'decision.txt'))) fail(`artifact has no decision.txt`);
  console.log(`artifact assertions: PASS ${sc.id}`);
}

const tmuxAvailable = () => !spawnSync('tmux', ['-V']).error;

function orchestrate(sc: Scenario) {
  const ses = `prove-it-live-${sc.id}`;
  const tmux = (...args: string[]) => spawnSync('tmux', args, { encoding: 'utf8' });
  tmux('kill-session', '-t', ses);
  const flags = `${MOCK ? ' --mock' : ''}${CI ? ' --ci' : ''}${DETAILS ? ' --details' : ''}`;
  const paneCmd = (side: LaneSide) =>
    `cd '${ROOT}' && env NODE_NO_WARNINGS=1 node live/runner.ts ${sc.id} --lane ${side}${flags} --artifact '${artDir}'; exec sh -c 'read -r _'`;
  // Both panes are about to exist, so each may wait for the other. Without
  // this the lanes run alone and never synchronize.
  armBarriers(artDir, ['left', 'right']);
  tmux('new-session', '-d', '-s', ses, '-x', '240', '-y', '56', '-n', 'compare', paneCmd('left'));
  tmux('split-window', '-d', '-h', '-l', '50%', '-t', `${ses}:0`, paneCmd('right'));
  tmux('set-window-option', '-t', `${ses}:0`, 'remain-on-exit', 'off');
  tmux('set-window-option', '-t', `${ses}:0`, 'pane-border-status', 'top');
  tmux('set-window-option', '-t', `${ses}:0`, 'pane-border-format', '#[fg=colour44,bold] #{pane_title} ');
  tmux('set-window-option', '-t', `${ses}:0`, 'pane-border-style', 'fg=colour238');
  tmux('set-window-option', '-t', `${ses}:0`, 'pane-active-border-style', 'fg=colour44');
  tmux('set-window-option', '-t', `${ses}:0`, 'window-status-format', '');
  tmux('set-window-option', '-t', `${ses}:0`, 'window-status-current-format', '');
  tmux('set-option', '-t', ses, 'status-style', 'bg=colour233,fg=colour245');
  tmux('set-option', '-t', ses, 'status-left-length', '80');
  tmux('set-option', '-t', ses, 'status-right-length', '80');
  tmux('set-option', '-t', ses, 'status-left', ` ${sc.id.toUpperCase()} · LIVE COMPARE `);
  tmux('set-option', '-t', ses, 'status-right', ' f replay fallback · Enter choose ');
  tmux('select-pane', '-t', `${ses}:0.0`, '-T', `LEFT · ${sc.lanes.left.label}   STARTING`);
  tmux('select-pane', '-t', `${ses}:0.1`, '-T', `RIGHT · ${sc.lanes.right.label}   STARTING`);
  const pauseLane = sc.steps.find((step) => step.pause)?.lane;
  tmux('select-pane', '-t', `${ses}:0.${pauseLane === 'right' ? '1' : '0'}`);
  const attach = spawnSync('tmux', ['attach', '-t', ses], { stdio: 'inherit' });
  if (attach.status !== 0)
    console.log(
      `could not attach (no TTY). Session '${ses}' is running — attach with: tmux attach -t ${ses}`,
    );
}

async function main() {
  if (!id || id.startsWith('--'))
    fail('usage: node live/runner.ts <scenarioId> [--mock] [--seq] [--ci] [--lane left|right]');
  const sc = await loadScenario(id);
  const assertDir = opt('--assert-artifact');
  if (assertDir) return assertArtifact(sc, assertDir);
  if (has('--describe')) return describe(sc);
  if (LANE && LANE !== 'left' && LANE !== 'right') fail(`--lane must be left or right, not '${LANE}'`);

  if (LANE) {
    artDir = artifactDir(sc);
    seedArtifact(sc, artDir);
    const lane = await runLane(sc, LANE);
    await finishLane(sc, lane);
    return;
  }
  if (!seqMode && !tmuxAvailable()) {
    console.log('tmux not found — running the lanes sequentially (--seq) instead.');
    seqMode = true;
  }
  artDir = artifactDir(sc);
  seedArtifact(sc, artDir);
  if (seqMode) {
    await runLane(sc, 'left');
    await runLane(sc, 'right');
    renderFinalComparison(sc, {
      left: framesMem.left.VERDICT,
      right: framesMem.right.VERDICT,
    });
    return;
  }
  orchestrate(sc);
}

main();
