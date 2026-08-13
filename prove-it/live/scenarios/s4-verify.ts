// S4 · Verify — the check-adequacy compare night. Declaration only; the runner
// owns every mechanic. The fault, gate, and host adequacy judgment are
// deterministic. In real mode, one worker authors the right lane's check; in
// mock mode, the shipped strong check replaces only that authorship step. The
// separate brief-A receipt-forgery fire remains the run-sheet's job.
import type { Scenario } from '../scenario.ts';

const SEED =
  `case '{{answer}}' in ` +
  `'long-title truncation') cp control/checks/fixtures/solution-faulty.mjs working/src/slugify.mjs ;; ` +
  `'digit drop') cp sessions/s4-attack-verify/fixtures/solution-faulty-v2.mjs working/src/slugify.mjs ;; ` +
  `*) echo 'unknown fault choice: {{answer}}' >&2; exit 2 ;; esac`;

// The screen confirms the same product-source hash in both lanes before
// anything runs — the START frames must be identical.
// sha256sum on Linux, shasum on macOS before Ventura — identical output.
const HASH =
  'command -v sha256sum >/dev/null && sha256sum working/src/slugify.mjs' +
  ' || shasum -a 256 working/src/slugify.mjs';

// tee keeps the three adequacy states on disk inside the staged copy, so
// CONTROL and VERDICT extract from the one run instead of re-running it.
const ADEQUACY_WITH = (check: string) =>
  'bash sessions/s4-attack-verify/fixtures/check-adequacy.sh ' +
  `working/src/slugify.mjs ${check} 2>&1 | tee s4-adequacy.txt`;
const ADEQUACY = ADEQUACY_WITH('sessions/s4-attack-verify/fixtures/slugify.test.v3.mjs');

// Real mode: the strengthened check is written by an agent, not shipped with
// the session. The agent works in its own stage, so its check is copied back
// into the lane before the adequacy harness judges it.
const CLI = 'node live/runtime/cli.ts';
const AGENT_CHECK = 'working/test/agent-strengthened.test.mjs';
const AUTHOR =
  `${CLI} claude --task check-author --run-id {{runid}} ` +
  `--seed-product working/src/slugify.mjs --artifact {{artifact}}/right --timeout 300; ` +
  `cp "\${TMPDIR:-/tmp}/prove-it-live/{{runid}}/working/test/strengthened.test.mjs" ${AGENT_CHECK}`;

// The room-seeded faulty candidate is the product both lanes certify. In mock
// no worker runs at all; in real, an agent authors the right lane's check.
const BRIEF_INPUT =
  'outcome: working/src/slugify.mjs turns arbitrary titles into url-safe slugs\n' +
  'check: node --test working/test/slugify.test.mjs\n' +
  'product: the room-seeded faulty candidate — the same bytes in both lanes.';

const scenario: Scenario = {
  id: 's4',
  title: 'WEAK CHECK vs ATTACKED CHECK',
  sharedFixture:
    'Both lanes use the same room-selected faulty candidate. Check v1 cannot see the selected fault.',
  mechanism:
    'Mock: seeded fixtures, the real gate, and the shipped strong check — deterministic. Real: the same seeded fault and gate, with the right lane\'s check written by an agent and judged by the same adequacy script.',
  allowedCausalDifference:
    'The left check omits the selected property. The right check includes it.',
  pause: {
    question: 'Which wrong result must this check catch?',
    kind: 'menu',
    options: ['long-title truncation', 'digit drop'],
    default: 'long-title truncation',
  },
  evidenceNote:
    'left: pass 3 over a broken product, then a valid green receipt — identity holds, adequacy unknown · right: the three adequacy states — green over the fault under the current check, red under the strengthened one, green over the correct solution',
  artifactNote:
    'the artifact records which supplied property the room chose and the three adequacy states; it does not prove that the check covers any other property.',
  expectedVerdicts: {
    left: 'dr-gate: VERIFIED',
    right: 'state 3: strengthened check stays GREEN',
  },
  lanes: {
    left: { label: 'WEAK CHECK', promptDisplay: BRIEF_INPUT, inputLabel: 'BRIEF' },
    right: { label: 'ATTACKED CHECK', promptDisplay: BRIEF_INPUT, inputLabel: 'BRIEF' },
  },
  steps: [
    { lane: 'both', pause: true },
    // LEFT — the check held at v1, which omits the relevant case. The gate is
    // real and honest; the product is wrong; every frame is extracted output.
    {
      lane: 'left',
      say: 'The room selected this fault: {{answer}}.',
      cmd: SEED,
    },
    {
      lane: 'left',
      frame: 'START',
      extract: 'working/src/slugify\\.mjs',
      say: 'Both lanes use the same candidate hash. This lane keeps check v1.',
      cmd: HASH,
    },
    {
      lane: 'left',
      frame: 'SURPRISE',
      extract: '# pass \\d+',
      say: 'The broken product runs against the named check.',
      cmd: 'node --test working/test/slugify.test.mjs',
    },
    {
      lane: 'left',
      frame: 'CONTROL',
      extract: 'check=check-v1',
      say: 'The check remains at v1. The gate binds the receipt to this exact tree.',
      cmd: 'node src/loop.ts open --run-id {{runid}} && node control/dr-gate.ts check {{runid}}',
    },
    {
      lane: 'left',
      frame: 'VERDICT',
      extract: 'dr-gate: VERIFIED',
      say: 'The receipt is valid, but the product is wrong. Identity holds. Adequacy remains unknown.',
      cmd: 'node control/dr-gate.ts verify {{runid}}',
    },

    // RIGHT — the same candidate; only the check moves. The pause picks the
    // property; a real worker authors the check (or mock supplies it); the
    // host-owned adequacy harness produces three states from one run.
    {
      lane: 'right',
      say: 'The room selected the same faulty candidate: {{answer}}.',
      cmd: SEED,
    },
    {
      lane: 'right',
      frame: 'START',
      extract: 'working/src/slugify\\.mjs',
      say: 'Both lanes use the same candidate hash. Only the check changes here.',
      cmd: HASH,
    },
    {
      lane: 'right',
      promptDisplay:
        'Find what the existing check misses about this product, write a stronger check, ' +
        'and use run_adequacy until all three states hold.',
      inputLabel: 'REVIEW',
      say: 'An agent attacks the check. Prose explains the work but never proves adequacy.',
      realCmd: AUTHOR,
    },
    {
      lane: 'right',
      frame: 'SURPRISE',
      extract: 'state 1: current check stays GREEN',
      say: 'The current check runs against the selected fault.',
      mockCmd: ADEQUACY,
      realCmd: ADEQUACY_WITH(AGENT_CHECK),
    },
    {
      lane: 'right',
      frame: 'CONTROL',
      extract: 'state 2: strengthened check goes RED',
      say: 'The stronger check makes the same product fail. The fault was already present.',
      cmd: "grep 'state 2' s4-adequacy.txt",
    },
    {
      lane: 'right',
      frame: 'VERDICT',
      // Either outcome is a real result. A check that catches the fault and
      // also fails correct code has not earned anything, and the room should
      // see that when it happens.
      extract: 'state 3: strengthened check (stays GREEN|fails)',
      say: 'The stronger check is judged against the correct solution too.',
      cmd: "grep 'state 3' s4-adequacy.txt",
    },
  ],
};

export default scenario;
