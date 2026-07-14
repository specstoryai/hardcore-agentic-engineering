#!/usr/bin/env node
// Claude + the harness + the gate. The harness owns the loop; the agent's "done"
// does not end the run; a separate gate runs the real check; on failure the agent
// is pushed back. The agent works in an isolated workspace and cannot see the gate.
//
//   node harness.mjs           drive REAL Claude Code (streams tool calls)
//   node harness.mjs --mock    deterministic fake agent (wrong once, then fixes)

import * as h from './lib.mjs';
const { C } = h;

const WORKDIR = process.env.WORKDIR || '/tmp/dod-harness';
const MOCK = process.argv.includes('--mock');
const MAX_TURNS = 5;

async function agentTurn(turn, message) {
  if (MOCK) {
    h.agentSession();
    h.agentTool('Read', h.SOLUTION_NAME);
    h.writeSolution(WORKDIR, turn === 1 ? h.NAIVE : h.CORRECT);
    h.agentTool(turn === 1 ? 'Write' : 'Edit', h.SOLUTION_NAME);
    h.agentText(turn === 1 ? "All done, it's working and ready to ship." : 'Fixed the failing case. Done now.');
  } else {
    await h.runClaude(WORKDIR, message, { cont: turn > 1 });
  }
}

async function main() {
  if (!MOCK && !h.claudeAvailable()) { h.control(C.red + '⚠ `claude` not on PATH. Use: npm run harness:mock' + C.reset); process.exit(1); }
  h.resetLog();
  h.setupWorkspace(WORKDIR);
  h.printPrompt(h.BRIEF);
  let message = h.BRIEF;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    h.control('\n  ' + C.dim + '──────────  turn ' + turn + '  ──────────' + C.reset);
    h.control('  ' + C.cyan + '▶' + C.reset + ' the agent works ' + C.dim + '(it cannot see the gate)' + C.reset);
    await agentTurn(turn, message);

    h.control('\n  ' + C.yellow + '■' + C.reset + " the agent says it's done. " + C.bold + 'the harness runs the gate' + C.reset + C.dim + ' (node --test)' + C.reset);
    const gate = h.runGate(WORKDIR);

    if (gate.passed) {
      h.control('\n  ' + C.green + C.bold + '✅ GATE PASSED' + C.reset + C.green + ' — the definition of done is met.' + C.reset);
      h.control('  ' + C.green + '   the check decided, not the agent. done in ' + turn + ' turn(s).' + C.reset);
      process.exit(0);
    }
    h.control('\n  ' + C.red + C.bold + '❌ GATE FAILED' + C.reset + C.red + ' — "done" was an opinion. back to work.' + C.reset);
    h.control('     ' + C.red + '⎿ ' + h.failReason(gate.output) + C.reset);
    message = `The check failed. Do not stop until it passes.\n\n${h.BRIEF}\n\nFailing test output:\n${h.tail(gate.output)}\n\nFix ${h.SOLUTION_NAME} and try again.`;
  }
  h.control('\n  Reached ' + MAX_TURNS + ' turns without passing the gate.');
  process.exit(1);
}
main();
