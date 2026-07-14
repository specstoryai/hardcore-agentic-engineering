#!/usr/bin/env node
// Claude alone, same prompt, no harness. It says "done" and stops. Then we run
// the gate it never ran, to show what actually shipped.
//
//   node vanilla.mjs           real Claude
//   node vanilla.mjs --mock    deterministic

import * as h from './lib.mjs';
const { C } = h;

const WORKDIR = process.env.WORKDIR || '/tmp/dod-vanilla';
const MOCK = process.argv.includes('--mock');

async function main() {
  if (!MOCK && !h.claudeAvailable()) { h.control(C.red + '⚠ `claude` not on PATH. Use: npm run vanilla:mock' + C.reset); process.exit(1); }
  h.resetLog();
  h.setupWorkspace(WORKDIR);
  h.printPrompt(h.BRIEF);

  h.control('\n  ' + C.cyan + '▶' + C.reset + ' regular Claude, no harness');
  if (MOCK) {
    h.agentSession();
    h.agentTool('Read', h.SOLUTION_NAME);
    h.writeSolution(WORKDIR, h.NAIVE);
    h.agentTool('Write', h.SOLUTION_NAME);
    h.agentText("All done, it's working and ready to ship.");
  } else {
    await h.runClaude(WORKDIR, h.BRIEF, {});
  }

  h.control('\n  ' + C.yellow + '■' + C.reset + ' Claude said done and stopped. ' + C.dim + 'nothing checked it.' + C.reset);
  const gate = h.runGate(WORKDIR);
  if (gate.passed) {
    h.control('\n  ' + C.dim + '( the gate happens to pass this time — run again to catch it shipping a bug )' + C.reset);
  } else {
    h.control('\n  ' + C.red + C.bold + '❌ but the gate it never ran says: NOT done.' + C.reset);
    h.control('     ' + C.red + '⎿ ' + h.failReason(gate.output) + C.reset);
    h.control('  ' + C.red + '   it shipped a bug.' + C.reset);
  }
  process.exit(0);
}
main();
