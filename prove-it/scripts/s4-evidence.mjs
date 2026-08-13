#!/usr/bin/env node
// A projector-friendly evidence view for the Session 4 comparison.
//
//   node scripts/s4-evidence.mjs
//   node scripts/s4-evidence.mjs live/artifacts/s4-<timestamp>
//
// With no argument, the newest Session 4 artifact is shown. The viewer never
// reruns a check: it renders only the retained frames and worker event record.
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

const width = Math.max(68, Math.min(100, (process.stdout.columns ?? 102) - 2));
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

function newest() {
  if (!existsSync(ARTIFACTS)) return null;
  return readdirSync(ARTIFACTS)
    .filter((name) => name.startsWith('s4-'))
    .map((name) => join(ARTIFACTS, name))
    .filter((path) => statSync(path).isDirectory() && existsSync(join(path, 'frames.txt')))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

function readEvents(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
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

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function frame(text, side, name) {
  return text.match(new RegExp(`^${side} ${name} │ (.*)$`, 'm'))?.[1] ?? 'not recorded';
}

function selectedFault(artifact) {
  if (!existsSync(join(artifact, 'decision.txt'))) return 'not recorded';
  const decision = readFileSync(join(artifact, 'decision.txt'), 'utf8');
  return decision.match(/^answer: (.*)$/m)?.[1] ?? 'not recorded';
}

function shortHash(value) {
  const hash = String(value).match(/\b[0-9a-f]{64}\b/i)?.[0];
  return hash ? `${hash.slice(0, 12)}…` : 'not recorded';
}

function state(summary, number) {
  return String(summary).split('\n').find((line) => line.includes(`state ${number}:`)) ?? `state ${number}: not recorded`;
}

const supplied = process.argv[2];
if (supplied === '--help' || supplied === '-h') {
  console.log('usage: node scripts/s4-evidence.mjs [<s4-artifact-dir>]');
  process.exit(0);
}
const artifact = supplied ? resolve(process.cwd(), supplied) : newest();
if (!artifact || !existsSync(artifact) || !existsSync(join(artifact, 'frames.txt'))) {
  console.error('s4-evidence: no Session 4 artifact found');
  process.exit(1);
}

const framesText = readFileSync(join(artifact, 'frames.txt'), 'utf8');
const provenance = existsSync(join(artifact, 'provenance.txt'))
  ? readFileSync(join(artifact, 'provenance.txt'), 'utf8')
  : '';
const leftStart = frame(framesText, 'left', 'START');
const rightStart = frame(framesText, 'right', 'START');
const leftSurprise = frame(framesText, 'left', 'SURPRISE');
const leftControl = frame(framesText, 'left', 'CONTROL');
const leftVerdict = frame(framesText, 'left', 'VERDICT');
const rightSurprise = frame(framesText, 'right', 'SURPRISE');
const rightControl = frame(framesText, 'right', 'CONTROL');
const rightVerdict = frame(framesText, 'right', 'VERDICT');
const hashesMatch = shortHash(leftStart) !== 'not recorded' && shortHash(leftStart) === shortHash(rightStart);
const realMode = /right: mode=real\b/.test(provenance);
const events = readEvents(join(artifact, 'right', 'shared', 'events.jsonl'));
const manifest = readJson(join(artifact, 'right', 'manifest.json'));
const attempts = events
  .filter((event) => event.type === 'tool.result' && event.data?.tool === 'run_adequacy')
  .map((event, index) => {
    const result = event.data?.result ?? {};
    return {
      number: index + 1,
      status: result.status,
      fault: state(result.summary, 2),
      correct: state(result.summary, 3),
    };
  });
const failedRun = events.findLast((event) => event.type === 'run.failed');
const artifactName = relative(ROOT, artifact);

console.log(`\n${C.blue(C.bold('SESSION 4 · DID THE CHECK EARN TRUST?'))}`);
console.log(C.dim(`Artifact: ${artifactName}`));
console.log();

box(
  'EXPERIMENTAL CONTROL',
  [
    `room-selected fault  ${selectedFault(artifact)}`,
    `left product hash    ${shortHash(leftStart)}`,
    `right product hash   ${shortHash(rightStart)}`,
    hashesMatch
      ? C.green('CONTROL HOLDS       same broken product in both lanes')
      : C.red('CONTROL FAILED      product hashes do not match'),
  ],
  hashesMatch ? C.blue : C.red,
);

box(
  'LEFT · WEAK CHECK',
  [
    `broken product + current check  → ${leftSurprise}`,
    `receipt identity                → ${leftControl}`,
    `gate verdict                    → ${leftVerdict}`,
    /VERIFIED/.test(leftVerdict)
      ? C.yellow('READ IT CAREFULLY              valid receipt; adequacy still unknown')
      : C.red('EXPECTED VERIFIED VERDICT NOT RETAINED'),
  ],
  /VERIFIED/.test(leftVerdict) ? C.orange : C.red,
);

if (realMode || attempts.length || failedRun) {
  const model = manifest?.model ?? manifest?.requested_model ?? 'model not recorded';
  const reviewLines = attempts.length
    ? attempts.flatMap((attempt) => [
        `${attempt.status === 'ok' ? C.green('✓') : C.red('×')} attempt ${attempt.number} · ${attempt.fault}`,
        `            ${attempt.correct}`,
      ])
    : [
        failedRun
          ? C.red(`worker failed before an adequacy attempt · ${failedRun.data?.code ?? 'reason not recorded'}`)
          : 'worker activity was not retained',
      ];
  box(
    `REVIEW LOOP · REAL WORKER · ${model}`,
    reviewLines,
    failedRun && !attempts.length ? C.red : C.blue,
  );
} else {
  box(
    'REVIEW LOOP · SUPPLIED CHECK',
    [
      'mock mode starts no model process',
      'the shipped stronger check replaces worker authorship; the adequacy harness still runs',
    ],
    C.blue,
  );
}

const rightPasses = /stays GREEN/.test(rightSurprise) && /goes RED/.test(rightControl) && /stays GREEN/.test(rightVerdict);
box(
  'RIGHT · ATTACKED CHECK',
  [
    `fault + current check       → ${rightSurprise}`,
    `fault + stronger check      → ${rightControl}`,
    `correct + stronger check    → ${rightVerdict}`,
    rightPasses
      ? C.green('CHECK EARNS TRUST          fault red; correct result green')
      : C.red('ADEQUACY NOT ESTABLISHED      inspect the missing or failed state above'),
  ],
  rightPasses ? C.green : C.red,
);

console.log(
  `\n${C.bold('Takeaway:')} a receipt proves which check ran. A fault-red and correct-green experiment shows whether that check can distinguish this wrong result from a correct one.\n`,
);
