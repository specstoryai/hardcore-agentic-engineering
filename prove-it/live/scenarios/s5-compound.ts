// S5 · Compound — does a retained case change what a later decision can rely
// on? Declaration
// only; the runner owns every mechanic. One real element, honestly placed: the
// fresh-reader opens the left lane — a real Claude, cold, handed the staged
// demo trace — and everything after it is deterministic in both lanes, so the
// crash, the change and both case runs land the same way every time. The lane
// mechanics live in the S5 session fixtures (stage-pack.sh, run-case.sh), the
// established idiom; nothing under src/ or control/ changes for this scenario.
import type { Scenario } from '../scenario.ts';

const FIX = 'sessions/s5-operate-improve/fixtures';
const CLI = 'node live/runtime/cli.ts';
const CASES = 's5-cases.txt';

// The pack, counted from its own recorded output. This is the decisive
// evidence: what the pack contained, and what it caught.
const PACK_SUMMARY =
  `node -e "const t=require('fs').readFileSync('${CASES}','utf8');` +
  `const f=(t.match(/FAIL/g)||[]).length;const p=(t.match(/: PASS/g)||[]).length;` +
  `console.log('pack: '+(p+f)+' case'+(p+f===1?'':'s')+' run, '+f+' failure'+(f===1?'':'s'))"`;

// A real evaluator, handed exactly what its lane's pack produced. Its decision
// is required to be one of three words, so the screen reads data rather than
// prose — and it is shown after the evidence, because it is secondary to it.
const EVALUATE = (lane: string) =>
  `${CLI} claude --run-id {{runid}} --decision-schema --tools read_file ` +
  `--artifact {{artifact}}/${lane} --timeout 200 --brief ` +
  `"Evaluate this change: after a crash, resume assumes the dispatched action succeeded ` +
  `(--reconcile defaults to 'ok'). Evaluation pack results: $(cat ${CASES}). Decide." ` +
  // Only the decision reaches the screen. The evaluator's whole run is in the
  // artifact, and its reasoning is not what the comparison turns on.
  `| grep '^decision:'`;

// The convenience change, verbatim from the session page (portable -i.bak):
// after a crash, resume assumes the dispatched action succeeded.
const CHANGE =
  `sed -i.bak "s/const rec = opt('--reconcile');/const rec = opt('--reconcile') ?? 'ok';/" src/loop.ts` +
  ` && rm -f src/loop.ts.bak && grep -n "reconcile') ??" src/loop.ts`;

// The fresh-reader is a prelude about the limits of a readable trace. It is
// deliberately separate from the controlled crash-case comparison below.
const COLD_READ =
  'Read runs/demo/events.jsonl. You have no other context about this system — you are cold. ' +
  'Why did turn 2 retry? Answer from the trace alone in a few sentences, ' +
  'then name one thing the trace cannot tell you.';

// Both panes show this before they diverge. Session 4 established the same
// pattern: name the system, starting rule, proposed change and control before
// asking the room to interpret any output.
const BRIEF_INPUT =
  'SYSTEM: the harness records tool dispatch and results, then resumes interrupted runs\n' +
  'SAFE START: if a crash leaves a result unknown, resume stops and asks an operator to reconcile it\n' +
  "CHANGE: without an operator answer, resume now assumes the action succeeded (--reconcile defaults to 'ok')\n" +
  'TARGET: crash after run_check dispatch but before its result is recorded; resume must not invent an answer\n' +
  'CONTROL: both lanes make the same change and run the same holdout; only the right pack runs the target\n' +
  'PRELUDE: a cold reader first inspects a completed run trace; this shows what a trace can explain, not the crash test';

const scenario: Scenario = {
  id: 's5',
  title: 'TRACE FILED vs TRACE RETAINED AS A CASE',
  sharedFixture:
    'Both lanes start from the same safe resume rule, apply the same convenience change, and run the same honest holdout.',
  mechanism:
    'A live cold read demonstrates the limits of trace inspection. The controlled comparison then uses deterministic fixtures inside the harness.',
  allowedCausalDifference:
    'After the shared prelude, the left evaluation pack omits the crash target. The right evaluation pack includes it.',
  pause: {
    question: 'Target red, holdout green. Promote, reject or revise?',
    kind: 'menu',
    options: ['promote', 'reject', 'revise'],
    default: 'reject',
  },
  evidenceNote:
    "left: a cold reader's answer, then a green holdout that never enters the crash path — evidence incomplete · right: the same green holdout, the crash target red on a phantom operator event, and the room's signed decision",
  artifactNote:
    'the artifact records which case caught the lie and what the room decided — it proves nothing about the next change; retaining the right case from your own history is Project 3.',
  expectedVerdicts: {
    left: 'Evidence incomplete|pack: 1 case run, 0 failures',
    right: 'decision: (promote|reject|revise)|pack: 2 cases run, 1 failure',
  },
  lanes: {
    left: {
      label: 'TRACE FILED',
      promptDisplay: BRIEF_INPUT,
      inputLabel: 'BRIEF',
      capture: {
        path: 'live/captures/s5-left.txt',
        provenance:
          'recorded 2026-08-18 from one real left-lane run (Claude CLI fresh reader, deterministic core, and real evaluator); local paths sanitized',
      },
    },
    right: { label: 'TRACE RETAINED AS A CASE', promptDisplay: BRIEF_INPUT, inputLabel: 'BRIEF' },
  },
  steps: [
    // LEFT — the prelude trace is readable, but the crash target is absent.
    // Real mode runs a live cold read; mock replays the capture from there on.
    {
      lane: 'left',
      frame: 'START',
      say: 'The trace is readable, but this evaluation pack has no replayable crash target.',
    },
    {
      lane: 'left',
      say: 'The launcher stages the demo run and evaluation pack.',
      cmd: `bash ${FIX}/stage-pack.sh`,
    },
    {
      lane: 'left',
      captureRef: true,
      promptDisplay: COLD_READ,
      inputLabel: 'CLAUDE\'S JOB',
      say: 'A fresh Claude reader receives only the completed run trace. It explains turn 2 and names one uncertainty.',
      realCmd: `bash live/providers/raw-worker.sh '${COLD_READ}'`,
    },
    {
      lane: 'left',
      say: 'The change makes resume assume that the dispatched action succeeded.',
      cmd: CHANGE,
    },
    {
      lane: 'left',
      frame: 'SURPRISE',
      extract: '01-honest-pass: PASS',
      say: 'The unchanged holdout remains green.',
      cmd: `bash ${FIX}/run-case.sh 01-honest-pass 2>&1 | tee -a ${CASES}`,
    },
    {
      lane: 'left',
      frame: 'CONTROL',
      say: 'No retained case tests the change against the crash path.',
    },
    {
      lane: 'left',
      showOutput: true,
      say: 'An evaluator reviews the change with this pack, and nothing else.',
      realCmd: EVALUATE('left'),
    },
    {
      // Real-only, and shown: the pack counted from its own output. The left
      // lane replays a capture in mock, and a capture-bound lane runs no
      // further commands — so this evidence cannot live in the frame below.
      lane: 'left',
      showOutput: true,
      say: 'This is what the pack contained.',
      realCmd: PACK_SUMMARY,
    },
    {
      lane: 'left',
      frame: 'VERDICT',
      say: 'Evidence incomplete: the holdout passes, but this pack never tests the crash path.',
    },

    // RIGHT — the crash boundary is a replayable case; identical in both modes.
    {
      lane: 'right',
      frame: 'START',
      extract: 'id: 03-crash-boundary',
      say: 'The evaluation pack retains the crash boundary as a replayable case.',
      cmd: 'cat fixtures/eval/cases/03-crash-boundary.yaml',
    },
    {
      lane: 'right',
      say: 'The launcher stages the same demo run and evaluation pack.',
      cmd: `bash ${FIX}/stage-pack.sh`,
    },
    {
      lane: 'right',
      say: 'This lane applies the same change.',
      cmd: CHANGE,
    },
    {
      lane: 'right',
      frame: 'SURPRISE',
      extract: '01-honest-pass: PASS',
      say: 'The unchanged holdout remains green here.',
      cmd: `bash ${FIX}/run-case.sh 01-honest-pass 2>&1 | tee -a ${CASES}`,
    },
    {
      lane: 'right',
      frame: 'CONTROL',
      extract: 'FAIL — phantom reconciliation',
      say: 'The retained case reads the actor field and exposes the false history.',
      cmd: `bash ${FIX}/run-case.sh 03-crash-boundary 2>&1 | tee -a ${CASES}; true`,
    },
    { lane: 'right', pause: true },
    {
      lane: 'right',
      showOutput: true,
      say: 'The same evaluator reviews the change, with a pack that caught something.',
      realCmd: EVALUATE('right'),
    },
    {
      lane: 'right',
      frame: 'VERDICT',
      extract: 'decision: (promote|reject|revise)|pack: \\d+ case',
      say: 'The retained case caught the false history.',
      mockCmd: 'echo "room decision: {{answer}} — the retained case caught the false history"',
      realCmd: PACK_SUMMARY,
    },
  ],
};

export default scenario;
