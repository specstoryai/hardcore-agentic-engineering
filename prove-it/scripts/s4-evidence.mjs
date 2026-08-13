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

function faultStory(answer) {
  if (answer.startsWith('digit drop')) {
    return {
      seeded: '“Top 10 Tools of 2026” incorrectly becomes “top-tools-of”',
      missing: 'The three original examples contain no digits.',
      stronger: 'Add an example that requires digits to survive in the slug.',
    };
  }
  if (answer.startsWith('long-title truncation')) {
    return {
      seeded: '“A very long title …” incorrectly becomes only “a” once the slug exceeds 60 characters.',
      missing: 'The three original examples are short, so they never reach the faulty branch.',
      stronger: 'Add a long-title example that requires every word to survive.',
    };
  }
  return {
    seeded: answer,
    missing: 'Read the retained room decision to identify the missing property.',
    stronger: 'Add an observable example for the selected wrong result.',
  };
}

function testNames(content) {
  return [...String(content ?? '').matchAll(/test\(\s*['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

const ORIGINAL_TEST_NAMES = testNames(safeRead(join(ROOT, 'working', 'test', 'slugify.test.mjs')));

function addedTestNames(check) {
  return check?.names?.filter((name) => !ORIGINAL_TEST_NAMES.includes(name)) ?? [];
}

function checkFacts(content) {
  const text = String(content ?? '');
  const title = text.match(/const\s+title\s*=\s*['"]([^'"]+)['"]/s)?.[1] ?? null;
  return {
    content: text,
    names: testNames(text),
    title,
    rejectsFirstWord: /assert\.notEqual\(\s*result\s*,\s*(?:firstWord|full\.split)/.test(text),
    requiresSeveralWords: /result\.includes\(\s*['"]-['"]\s*\)/.test(text),
    imposesSixtyCharacterLimit: /result\.length\s*<=\s*60/.test(text),
    requiresFullSlug: /assert\.equal\(\s*result\s*,\s*expected\s*\)/.test(text),
  };
}

function checkWrites(events) {
  return events
    .filter(
      (event) =>
        event.type === 'tool.requested' &&
        event.data?.tool === 'write_file' &&
        event.data?.args?.path === 'working/test/strengthened.test.mjs',
    )
    .map((event) => checkFacts(event.data.args.content));
}

function safeRead(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function preview(value, max = 74) {
  const text = String(value ?? '');
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function expectedSlug(title) {
  return String(title)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mockCheckPath(artifact) {
  const log = safeRead(join(artifact, 'right.log'));
  return log.match(/check-adequacy\.sh\s+\S+\s+([^\s;&|]+)/)?.[1] ?? null;
}

function newestRealArtifact(exclude) {
  if (!existsSync(ARTIFACTS)) return null;
  return readdirSync(ARTIFACTS)
    .filter((name) => name.startsWith('s4-'))
    .map((name) => join(ARTIFACTS, name))
    .filter((path) => path !== exclude && /right: mode=real\b/.test(safeRead(join(path, 'provenance.txt'))))
    .filter((path) => existsSync(join(path, 'frames.txt')))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null;
}

function editDescription(check, previous) {
  const changes = [];
  if (check.rejectsFirstWord) changes.push('rejects the first-word-only result');
  if (check.requiresSeveralWords) changes.push('requires a multi-word slug');
  if (check.imposesSixtyCharacterLimit) changes.push('adds a maximum-60-character rule');
  if (previous?.imposesSixtyCharacterLimit && !check.imposesSixtyCharacterLimit)
    changes.push('removes the unsupported 60-character maximum');
  if (check.requiresFullSlug) changes.push('requires the complete normalized slug');
  return changes.length ? changes.join('; ') : 'changes the examples shown below';
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
const selected = selectedFault(artifact);
const story = faultStory(selected);
const writes = checkWrites(events);
const finalCheck = writes.at(-1) ?? null;
const mockPath = realMode ? null : mockCheckPath(artifact);
const mockCheck = mockPath ? checkFacts(safeRead(join(ROOT, mockPath))) : null;
const mockAddedTests = addedTestNames(mockCheck);
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

if (realMode) {
  console.log(C.green(C.bold('RUN MODE · REAL — one Claude worker authored the stronger check.')));
} else {
  console.log(C.yellow(C.bold('RUN MODE · MOCK — Claude did not run in this artifact.')));
  console.log('The supplied stronger check stood in for Claude authorship; the host still ran all three judgments.');
  const real = newestRealArtifact(artifact);
  if (real) console.log(C.dim(`Newest retained real S4 run: ${relative(ROOT, real)}`));
}
console.log();

box(
  'WHAT THIS DEMO IS ACTUALLY TESTING',
  [
    'Product             slugify turns a title into a URL slug: “Hello World” → “hello-world”',
    'Original check      three short examples: lowercase and dashes; ampersands; messy punctuation',
    `Seeded wrong result ${story.seeded}`,
    `Why check-v1 misses it ${story.missing}`,
    'Only change         the check; both lanes start with the same broken slugify',
  ],
  C.blue,
);

box(
  'EXPERIMENTAL CONTROL',
  [
    `room-selected fault  ${selected}`,
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
  const reviewLines = [
    '1 · READ           the faulty slugify and the three-example check-v1',
    '2 · FOUND          long inputs enter a branch that returns only the first word; check-v1 uses only short inputs',
    '3 · LEFT ALONE     working/src/slugify.mjs — Claude changed the check, not the product',
    `4 · WROTE          ${writes.length} version${writes.length === 1 ? '' : 's'} of working/test/strengthened.test.mjs`,
    ...(finalCheck?.names?.length
      ? [`FINAL TEST(S)      ${addedTestNames(finalCheck).join(' · ') || finalCheck.names.join(' · ')}`]
      : ['FINAL TEST         not retained in this artifact']),
    ...(finalCheck?.title
      ? [
          `NEW INPUT          “${preview(finalCheck.title)}”`,
          `BROKEN OUTPUT      “${finalCheck.title.split(/\s+/)[0].toLowerCase()}”`,
          `REQUIRED OUTPUT    “${preview(expectedSlug(finalCheck.title))}”`,
        ]
      : []),
    ...(finalCheck
      ? [`WHAT IMPROVED      ${editDescription(finalCheck, writes.at(-2))}`]
      : [`PROPERTY ADDED     ${story.stronger}`]),
    ...(attempts.length
      ? attempts.flatMap((attempt) => [
          `${attempt.status === 'ok' ? C.green('✓') : C.red('×')} version ${attempt.number} · ${editDescription(writes[attempt.number - 1] ?? finalCheck, writes[attempt.number - 2])}`,
          `            ${attempt.fault}`,
          `            ${attempt.correct}`,
        ])
      : [
          failedRun
            ? C.red(`worker failed before an adequacy attempt · ${failedRun.data?.code ?? 'reason not recorded'}`)
            : 'worker activity was not retained',
        ]),
  ];
  box(
    `WHAT CLAUDE CHANGED · REAL WORKER · ${model}`,
    reviewLines,
    failedRun && !attempts.length ? C.red : C.blue,
  );
} else {
  box(
    'WHAT THE SUPPLIED CHECK CHANGED · NO CLAUDE PROCESS',
    [
      `Source file        ${mockPath ?? 'not recorded'}`,
      `Property added     ${story.stronger}`,
      `Original check     ${ORIGINAL_TEST_NAMES.join(' · ')}`,
      ...(mockAddedTests.length ? [`Added beyond v1    ${mockAddedTests.join(' · ')}`] : []),
      'Product unchanged  the supplied check does not fix working/src/slugify.mjs',
      'Host judgment      the same three-state adequacy harness still runs',
    ],
    C.blue,
  );
}

const rightPasses = /stays GREEN/.test(rightSurprise) && /goes RED/.test(rightControl) && /stays GREEN/.test(rightVerdict);
box(
  'RIGHT · HOST JUDGES THE STRONGER CHECK',
  [
    `1 · prove the blind spot    current check + fault    → ${rightSurprise}`,
    `2 · prove detection         stronger check + fault   → ${rightControl}`,
    `3 · rule out false alarm    stronger check + correct → ${rightVerdict}`,
    rightPasses
      ? C.green('CHECK EARNS TRUST          fault red; correct result green')
      : C.red('ADEQUACY NOT ESTABLISHED      inspect the missing or failed state above'),
  ],
  rightPasses ? C.green : C.red,
);

console.log(
  `\n${C.bold('Takeaway:')} a receipt proves which check ran. A fault-red and correct-green experiment shows whether that check can distinguish this wrong result from a correct one.\n`,
);
