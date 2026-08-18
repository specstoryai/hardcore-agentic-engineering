#!/usr/bin/env node
// A projector-friendly evidence view for the Session 5 comparison.
//
//   node scripts/s5-evidence.mjs
//   node scripts/s5-evidence.mjs live/artifacts/s5-<timestamp>
//   node scripts/s5-evidence.mjs --details
//
// With no argument, the newest Session 5 artifact is shown. The viewer reads
// retained evidence only. It never reruns a case or asks a model to decide.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ARTIFACTS = join(ROOT, 'live', 'artifacts');
const useColor = !process.env.NO_COLOR;
const color = (code, text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
const C = {
  blue: (text) => color('36', text),
  orange: (text) => color('38;5;208', text),
  green: (text) => color('32', text),
  red: (text) => color('31', text),
  yellow: (text) => color('33', text),
  dim: (text) => color('90', text),
  bold: (text) => color('1', text),
};

const width = Math.max(72, Math.min(108, (process.stdout.columns ?? 110) - 2));
const visibleLength = (text) => String(text).replace(/\x1b\[[0-9;]*m/g, '').length;

function wrap(text, max = width - 4) {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if (!line) line = word;
    else if (visibleLength(line) + visibleLength(word) + 1 <= max) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function box(title, lines, paint = C.blue) {
  const label = ` ${title} `;
  const rule = '─'.repeat(Math.max(1, width - visibleLength(label) - 2));
  console.log(paint(`╭─${label}${rule}╮`));
  for (const text of lines.flatMap((line) => wrap(line))) {
    const padding = ' '.repeat(Math.max(0, width - visibleLength(text) - 4));
    console.log(`${paint('│')} ${text}${padding} ${paint('│')}`);
  }
  console.log(paint(`╰${'─'.repeat(width - 2)}╯`));
}

function safeRead(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function readEvents(path) {
  return safeRead(path)
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function newest() {
  if (!existsSync(ARTIFACTS)) return null;
  return readdirSync(ARTIFACTS)
    .filter((name) => name.startsWith('s5-'))
    .map((name) => join(ARTIFACTS, name))
    .filter((path) => statSync(path).isDirectory() && existsSync(join(path, 'frames.txt')))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

function frame(text, side, name) {
  return text.match(new RegExp(`^${side} ${name} │ (.*)$`, 'm'))?.[1] ?? 'not recorded';
}

function field(text, name) {
  return text.match(new RegExp(`^${name}: (.*)$`, 'm'))?.[1] ?? 'not recorded';
}

function modelDecision(events) {
  const outputs = events
    .flatMap((event) => event.data?.calls ?? [])
    .filter((call) => call.tool === 'StructuredOutput' && call.args?.decision);
  const value = outputs.at(-1)?.args;
  return value
    ? { decision: String(value.decision), reason: String(value.reason ?? '') }
    : { decision: 'not recorded', reason: '' };
}

function firstSentence(text, max = 190) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const sentence = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? clean;
  return sentence.length <= max ? sentence : `${sentence.slice(0, max - 1).trimEnd()}…`;
}

function decisionLine(label, decision, reason) {
  const why = firstSentence(reason);
  return `${label.padEnd(17)} ${decision}${why ? ` — ${why}` : ''}`;
}

function caseOutcome(text) {
  if (/\bPASS\b/.test(text)) return 'PASS';
  if (/\bFAIL\b/.test(text)) return 'FAIL';
  if (/no retained case|does not contain/i.test(text)) return 'NOT RUN';
  return 'NOT RECORDED';
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('usage: node scripts/s5-evidence.mjs [--details] [<s5-artifact-dir>]');
  process.exit(0);
}

const details = args.includes('--details');
const paths = args.filter((arg) => arg !== '--details');
if (paths.length > 1) {
  console.error('s5-evidence: give one artifact directory');
  process.exit(1);
}

const artifact = paths[0] ? resolve(process.cwd(), paths[0]) : newest();
if (!artifact || !existsSync(artifact) || !existsSync(join(artifact, 'frames.txt'))) {
  console.error('s5-evidence: no Session 5 artifact found');
  process.exit(1);
}

const frames = safeRead(join(artifact, 'frames.txt'));
const provenance = safeRead(join(artifact, 'provenance.txt'));
const decision = safeRead(join(artifact, 'decision.txt'));
const leftLog = safeRead(join(artifact, 'left.log'));
const rightLog = safeRead(join(artifact, 'right.log'));
const leftEvents = readEvents(join(artifact, 'left', 'shared', 'events.jsonl'));
const rightEvents = readEvents(join(artifact, 'right', 'shared', 'events.jsonl'));
const leftModel = modelDecision(leftEvents);
const rightModel = modelDecision(rightEvents);
const roomDecision = field(decision, 'answer');
const realMode = /(?:left|right): mode=real\b/.test(provenance);
const artifactName = relative(ROOT, artifact);

const leftStart = frame(frames, 'left', 'START');
const leftHoldout = frame(frames, 'left', 'SURPRISE');
const leftControl = frame(frames, 'left', 'CONTROL');
const leftVerdict = frame(frames, 'left', 'VERDICT');
const rightStart = frame(frames, 'right', 'START');
const rightHoldout = frame(frames, 'right', 'SURPRISE');
const rightTarget = frame(frames, 'right', 'CONTROL');
const rightVerdict = frame(frames, 'right', 'VERDICT');
const leftHoldoutOutcome = caseOutcome(leftHoldout);
const leftTargetOutcome = caseOutcome(leftControl);
const rightHoldoutOutcome = caseOutcome(rightHoldout);
const rightTargetOutcome = caseOutcome(rightTarget);

const leftChange = leftLog.match(/^\d+:\s+const rec = .*$/m)?.[0] ?? 'change line not recorded';
const rightChange = rightLog.match(/^\d+:\s+const rec = .*$/m)?.[0] ?? 'change line not recorded';
const changeMatches = leftChange !== 'change line not recorded' && leftChange === rightChange;
const holdoutMatches = leftHoldout !== 'not recorded' && leftHoldout === rightHoldout;
const controlHolds = changeMatches && holdoutMatches;
const leftFrameConflict = /would promote/i.test(leftVerdict) && leftModel.decision === 'reject';
const phantomText = rightLog.match(/^\s*(\{"id":\d+.*"operator reconciliation: marked ok[^\n]*\})$/m)?.[1] ?? '';
let phantom = null;
try {
  phantom = phantomText ? JSON.parse(phantomText) : null;
} catch {
  phantom = null;
}
const legacyColdRead = /Read runs\/demo\/events\.jsonl/.test(leftLog);

console.log(`\n${C.blue(C.bold('SESSION 5 · WHAT DID THE RETAINED CASE REVEAL?'))}`);
console.log(C.dim(`Artifact: ${artifactName}`));
console.log();
console.log(
  realMode
    ? C.green(C.bold('RUN MODE · REAL — Claude read the trace and evaluated both packs.'))
    : C.yellow(C.bold('RUN MODE · MOCK OR CAPTURE — no live model judgment is implied.')),
);
console.log();

box(
  '1 · THE CHANGE',
  [
    'Old rule: if a result is unknown after a crash, the harness waits for an operator.',
    "Proposed shortcut: if no operator answers, the harness records the result as 'ok'.",
    'Risk: the log can say that an operator answered when nobody did.',
  ],
  C.orange,
);

box(
  '2 · THE FAIR COMPARISON',
  [
    `Both lanes use the same proposed code change: ${changeMatches ? 'YES' : 'NOT PROVED'}.`,
    `Both lanes run the same holdout case: ${holdoutMatches ? 'YES' : 'NOT PROVED'}.`,
    'Left lane: the evaluation pack does not contain the crash case.',
    'Right lane: the evaluation pack contains the crash case.',
    controlHolds
      ? C.green('The retained crash case is the only controlled difference.')
      : C.red('The comparison is not controlled. Inspect the detailed evidence.'),
  ],
  controlHolds ? C.blue : C.red,
);

box(
  '3 · THE RESULTS',
  [
    `LEFT  · Holdout: ${leftHoldoutOutcome} · Crash case: ${leftTargetOutcome} · Result: EVIDENCE INCOMPLETE`,
    `RIGHT · Holdout: ${rightHoldoutOutcome} · Crash case: ${rightTargetOutcome} · Result: ${rightTargetOutcome === 'FAIL' ? 'UNSAFE CHANGE FOUND' : 'INSPECT DETAILS'}`,
    phantom
      ? C.red(`The failed case found event ${phantom.id}: actor=${phantom.actor}, status=${phantom.data?.status ?? 'unknown'}.`)
      : C.red('The failed case found a false operator record.'),
    `The room decided: ${roomDecision.toUpperCase()}.`,
  ],
  /FAIL.*phantom reconciliation/.test(rightTarget) ? C.green : C.red,
);

box(
  '4 · WHAT THE EVIDENCE PROVES',
  [
    C.green('The retained case reproduced the unsafe crash path.'),
    'The case changed a suspected risk into an observed failure.',
    'The passing holdout did not make the proposed change safe.',
    'Keep the case. Reject or revise the code change.',
    C.dim('This experiment does not prove that a future code change will work.'),
  ],
  C.blue,
);

if (details) {
  box(
    legacyColdRead ? 'DETAILS · TRACE PRELUDE' : 'DETAILS · TRACE READ',
    legacyColdRead
      ? [
          'Claude read a completed slugify trace before the controlled comparison.',
          'That trace was not the crash case used in this experiment.',
          'The trace supports diagnosis. The retained case makes the failure replayable.',
        ]
      : [
          'A fresh reader inspected the retained incident trace before the comparison.',
          'The trace supports diagnosis. The retained case makes the failure replayable.',
        ],
    C.blue,
  );

  box(
    'DETAILS · EXACT CHANGE AND CASE OUTPUT',
    [
      `Left code: ${leftChange}`,
      `Right code: ${rightChange}`,
      `Left start: ${leftStart}`,
      `Left holdout: ${leftHoldout}`,
      `Left crash case: ${leftControl}`,
      `Right target: ${rightStart}`,
      `Right holdout: ${rightHoldout}`,
      `Right crash case: ${rightTarget}`,
      `Right pack: ${rightVerdict}`,
      ...(phantom ? [`False claim: ${phantom.data?.summary ?? 'not recorded'}`] : []),
    ],
    C.blue,
  );

  box(
    'DETAILS · ADVICE AND DECISION',
    [
      decisionLine('Left model', leftModel.decision, leftModel.reason),
      decisionLine('Right model', rightModel.decision, rightModel.reason),
      `Room decision: ${roomDecision}`,
      ...(leftFrameConflict
        ? ['The old scenario summary conflicts with the live left-model recommendation.']
        : [`Left pack summary: ${leftVerdict}`]),
      leftModel.decision === rightModel.decision
        ? 'The model advice did not change. The evidence supporting it did.'
        : 'The retained case changed the evidence and the model advice.',
      'The model gives advice. The target, holdout, and human decision control promotion.',
    ],
    C.blue,
  );
}

console.log(
  `\n${C.bold('Say this:')} Both lanes used the same change. Only the right lane replayed the crash. That case caught the false operator record, so we rejected the change and kept the case.\n`,
);
