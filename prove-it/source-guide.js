(function () {
  "use strict";

  var root = document.getElementById("sourceExplorer");
  if (!root) return;

  var publicSourceBase = "https://github.com/specstoryai/hardcore-agentic-engineering/blob/main/prove-it/";

  var modules = {
    loop: {
      file: "loop.ts", role: "command hub", lines: "242 lines", source: "src/loop.ts",
      job: "Opens and loads runs. It asks for turns, dispatches tools, records events and handles every command.",
      limit: "It never accepts a worker claim as completion. It also does not start the gate check for you.",
      uses: ["root", "contract", "events", "runview", "provider", "tools"]
    },
    provider: {
      file: "provider.ts", role: "turn source", lines: "110 lines", source: "src/provider.ts",
      job: "Supplies turns to the small starter. The smoke path is scripted. Its CLI adapters return one text-only turn.",
      limit: "The classroom demo uses live/providers and live/runtime instead. That path connects a real provider to harness tools.",
      uses: []
    },
    contract: {
      file: "contract.ts", role: "contract reader", lines: "91 lines", source: "src/contract.ts",
      job: "Reads one narrow Done Contract shape. It keeps the original bytes and their SHA-256 hash.",
      limit: "This is not a general YAML parser. Several parsed fields do not control the starter.",
      uses: ["root"]
    },
    events: {
      file: "events.ts", role: "durable history", lines: "65 lines", source: "src/events.ts",
      job: "Appends one JSON event per line. It flushes each event to disk before the next action.",
      limit: "A broken final line is dropped during recovery. Earlier durable events stay unchanged.",
      uses: []
    },
    runview: {
      file: "runview.ts", role: "state projector", lines: "101 lines", source: "src/runview.ts",
      job: "Reduces the event history into one current RunView.",
      limit: "The view is disposable. events.jsonl remains the source of truth.",
      uses: ["events"]
    },
    tools: {
      file: "tools.ts", role: "action boundary", lines: "146 lines", source: "src/tools.ts",
      job: "Allows selected reads, writes and one named check. It refuses unapproved action classes.",
      limit: "A policy refusal is not operating-system containment. The probe reports this limit.",
      uses: ["root", "checkexit"]
    },
    root: {
      file: "root.ts", role: "shared plumbing", lines: "51 lines", source: "src/root.ts",
      job: "Finds the project root, hashes files and trees, and starts the independent gate process.",
      limit: "The gate does not import this file. That separation keeps student extensions outside the judge.",
      uses: ["gate"]
    },
    probe: {
      file: "probe.ts", role: "authority experiment", lines: "103 lines", source: "src/probe.ts",
      job: "Makes six real tool attempts and labels each result.",
      limit: "The probe reports no operating-system sandbox on a bare host. Unsupported does not mean contained.",
      uses: ["root", "tools"]
    },
    checkexit: {
      file: "control/check-exit.ts", role: "shared exit rule", lines: "outside src", source: "control/check-exit.ts", external: true,
      job: "Turns a process exit status into accepted, failed or inconclusive.",
      limit: "The host control plane owns this helper, so it sits outside src.",
      uses: []
    },
    gate: {
      file: "control/dr-gate.ts", role: "independent judge", lines: "outside src", source: "control/dr-gate.ts", external: true,
      job: "Runs every named check, signs receipts and verifies current receipts.",
      limit: "A receipt proves that the named checks passed. It does not prove that the checks were adequate.",
      uses: []
    }
  };

  var runSteps = [
    { label: "Define", event: "goal + done/contract.yaml", title: "State the work and the finish line", detail: "The goal tells the worker what to build. The Done Contract tells the gate what must be true.", meta: "Session 1 fixes the contract before work starts.", active: ["goal", "contract"] },
    { label: "Open", event: "run.requested", title: "Pin the contract and candidate", detail: "The harness records the goal, contract hash, starting tree, tools and budgets before the provider acts.", meta: "Later evidence must match these identities.", active: ["contract", "harness"] },
    { label: "Work", event: "message.completed + tool.*", title: "Let a real provider act through the harness", detail: "Claude reads and writes through harness tools. The harness records each request before it executes the action.", meta: "This is the real path behind demo-compare.sh.", active: ["harness", "provider", "tools"] },
    { label: "Claim", event: "worker.claimed_done", title: "Keep the run open after DONE", detail: "The provider can stop and claim completion. The harness records the claim but does not accept it as proof.", meta: "The Session 1 lanes fork at this point.", active: ["harness", "provider"] },
    { label: "Check", event: "gate.result · refused", title: "Ask the independent gate", detail: "dr-gate runs the named check against the pinned candidate. A failed check keeps the run open.", meta: "The worker cannot change this decision.", active: ["contract", "gate"] },
    { label: "Repair", event: "run.resumed", title: "Return the refusal to the worker", detail: "The harness adds the gate evidence to the durable conversation. A real provider acts again and repairs the candidate.", meta: "The check-and-repair loop continues until acceptance or stop.", active: ["harness", "provider", "tools", "gate"] },
    { label: "Exit", event: "accepted → receipt → completed", title: "Exit through verified evidence", detail: "The gate signs an accepted receipt. The verified receipt permits completion. A human still owns release.", meta: "The right lane in Session 1 follows this path.", active: ["harness", "gate", "receipt", "release"] }
  ];

  root.innerHTML = [
    '<div class="guide-thesis">',
      '<p><strong>Read the starter. See the real loop.</strong>The map explains src. The exemplar follows the real provider path used in class.</p>',
      '<p class="guide-proof">small src starter<br>real Claude class run<br>one host-owned gate</p>',
    '</div>',
    '<div class="guide-tabs" role="tablist" aria-label="Source guide views">',
      '<button type="button" role="tab" id="guideTabMap" aria-controls="guidePanelMap" aria-selected="true">Code map</button>',
      '<button type="button" role="tab" id="guideTabRun" aria-controls="guidePanelRun" aria-selected="false">Exemplar run</button>',
      '<button type="button" role="tab" id="guideTabReality" aria-controls="guidePanelReality" aria-selected="false">Starter vs live</button>',
    '</div>',
    '<section class="guide-panel" id="guidePanelMap" role="tabpanel" aria-labelledby="guideTabMap"></section>',
    '<section class="guide-panel" id="guidePanelRun" role="tabpanel" aria-labelledby="guideTabRun" hidden></section>',
    '<section class="guide-panel" id="guidePanelReality" role="tabpanel" aria-labelledby="guideTabReality" hidden></section>',
  ].join("");

  var mapPanel = document.getElementById("guidePanelMap");
  var runPanel = document.getElementById("guidePanelRun");
  var realityPanel = document.getElementById("guidePanelReality");

  mapPanel.innerHTML = '<div class="panel-heading"><h2>The files form one control path</h2><p>Select a file</p></div><div class="map-layout"><div class="module-field"><p class="module-field-label">src/ and the host boundary</p><div class="module-grid"></div><p class="map-legend"><span class="selected">selected</span><span class="uses">selected file uses this</span><span>dashed box sits outside src</span></p></div><aside class="module-detail" aria-live="polite"></aside></div>';

  var moduleGrid = mapPanel.querySelector(".module-grid");
  Object.keys(modules).forEach(function (id) {
    var item = modules[id];
    var button = document.createElement("button");
    button.type = "button";
    button.className = "module-button" + (item.external ? " external" : "");
    button.dataset.module = id;
    button.setAttribute("aria-pressed", id === "loop" ? "true" : "false");
    button.innerHTML = '<span class="file">' + item.file + '</span><span class="role">' + item.role + '</span>';
    moduleGrid.appendChild(button);
  });

  function showModule(id) {
    var item = modules[id];
    var usedBy = Object.keys(modules).filter(function (other) { return modules[other].uses.indexOf(id) !== -1; });
    mapPanel.querySelectorAll(".module-button").forEach(function (button) {
      var buttonId = button.dataset.module;
      button.setAttribute("aria-pressed", buttonId === id ? "true" : "false");
      button.classList.toggle("relation-out", item.uses.indexOf(buttonId) !== -1);
      button.classList.toggle("relation-in", usedBy.indexOf(buttonId) !== -1);
    });
    mapPanel.querySelector(".module-detail").innerHTML = [
      '<div class="module-detail-head"><div><p class="module-kicker">' + item.role + ' · ' + item.lines + '</p>',
      '<h3>' + item.file + '</h3></div>',
      '<a class="source-link" href="' + publicSourceBase + item.source + '">Open ' + item.file + ' on GitHub →</a></div>',
      '<dl class="module-facts"><div class="module-fact"><dt>Runtime job</dt><dd>' + item.job + '</dd></div>',
      '<div class="module-fact"><dt>Connections</dt><dd>' + (item.uses.length ? 'Uses ' + item.uses.map(function (key) { return modules[key].file; }).join(", ") + '.' : 'Uses Node built-ins only.') + (usedBy.length ? ' Used by ' + usedBy.map(function (key) { return modules[key].file; }).join(", ") + '.' : '') + '</dd></div>',
      '<div class="module-fact"><dt>Important limit</dt><dd>' + item.limit + '</dd></div></dl>'
    ].join("");
  }

  moduleGrid.addEventListener("click", function (event) {
    var button = event.target.closest(".module-button");
    if (button) showModule(button.dataset.module);
  });

  runPanel.innerHTML = [
    '<div class="panel-heading"><h2>A real provider works until the gate accepts</h2><p>Session 1 · right lane</p></div>',
    '<p class="classroom-slice"><strong>The full process is one loop.</strong> Each course session studies one slice. Session 1 shows why the gate must own completion.</p>',
    '<div class="step-strip" aria-label="Exemplar run steps"></div>',
    '<div class="exemplar-stage">',
      '<div class="input-merge">',
        '<div class="process-node process-input" data-actor="goal"><span class="process-name">Goal / prompt</span><span class="process-sub">what the worker must build</span></div>',
        '<span class="merge-mark" aria-hidden="true">+</span>',
        '<div class="process-node process-input" data-actor="contract"><span class="process-name">Done Contract</span><span class="process-sub">what the gate must prove</span></div>',
      '</div>',
      '<div class="process-rail">',
        '<div class="process-node" data-actor="harness"><span class="process-name">Harness opens</span><span class="process-sub">pins identities · records events</span></div>',
        '<span class="flow-arrow" aria-hidden="true">→</span>',
        '<div class="process-node" data-actor="provider"><span class="process-name">Claude CLI</span><span class="process-sub">real provider · real model</span></div>',
        '<span class="flow-arrow" aria-hidden="true">⇄</span>',
        '<div class="process-node" data-actor="tools"><span class="process-name">Harness tools</span><span class="process-sub">read · write · candidate</span></div>',
        '<span class="flow-arrow" aria-hidden="true">→</span>',
        '<div class="process-node" data-actor="gate"><span class="process-name">dr-gate</span><span class="process-sub">runs the named check</span></div>',
        '<span class="flow-arrow" aria-hidden="true">→</span>',
        '<div class="process-node" data-actor="receipt"><span class="process-name">Receipt</span><span class="process-sub">signed accepted evidence</span></div>',
        '<span class="flow-arrow" aria-hidden="true">→</span>',
        '<div class="process-node" data-actor="release"><span class="process-name">Human release</span><span class="process-sub">the final owner</span></div>',
      '</div>',
      '<p class="refusal-return"><strong>REFUSED loops back.</strong> The harness returns the check evidence to the provider. The worker repairs the candidate and asks again.</p>',
    '</div>',
    '<div class="run-reading" aria-live="polite"></div>',
    '<div class="state-line"><span class="state">goal + contract</span><span>→</span><span class="state">running</span><span>↺</span><span class="state">refused</span><span>→</span><span class="state done">accepted receipt</span><span>→</span><span class="state done">completed</span></div>',
    '<div class="session-lenses" aria-label="Course session slices"><span><b>S1</b> contract</span><span><b>S2</b> brief + steer</span><span><b>S3</b> recovery + authority</span><span><b>S4</b> check adequacy</span><span><b>S5</b> hand-off + regression</span><span><b>S6</b> joins + release</span></div>',
    '<p class="session-note">These labels are lesson lenses. They are not six separate systems.</p>',
    '<nav class="run-sources" aria-label="Real provider source files"><span>Read the real path:</span>',
      '<a href="' + publicSourceBase + 'scripts/demo-compare.sh">launcher</a>',
      '<a href="' + publicSourceBase + 'live/scenarios/s1-define.ts">Session 1 scenario</a>',
      '<a href="' + publicSourceBase + 'live/runtime/engine.ts">provider loop</a>',
      '<a href="' + publicSourceBase + 'live/providers/claude-cli.ts">Claude adapter</a>',
    '</nav>'
  ].join("");

  var stepStrip = runPanel.querySelector(".step-strip");
  runSteps.forEach(function (step, index) {
    var button = document.createElement("button");
    button.type = "button";
    button.dataset.step = String(index);
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    button.textContent = (index + 1) + ". " + step.label;
    stepStrip.appendChild(button);
  });

  function showStep(index) {
    var step = runSteps[index];
    stepStrip.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-pressed", Number(button.dataset.step) === index ? "true" : "false"); });
    runPanel.querySelectorAll(".process-node").forEach(function (actor) { actor.classList.toggle("active", step.active.indexOf(actor.dataset.actor) !== -1); });
    runPanel.querySelector(".run-reading").innerHTML = '<div><p class="event">' + step.event + '</p><h3>' + step.title + '</h3></div><div><p>' + step.detail + '</p><p class="run-meta">' + step.meta + '</p></div>';
  }

  stepStrip.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-step]");
    if (button) showStep(Number(button.dataset.step));
  });

  realityPanel.innerHTML = [
    '<div class="panel-heading"><h2>The starter and live runtime serve different jobs</h2><p>Both are in prove-it</p></div>',
    '<div class="reality-split"><section><h3>Small starter · <code>src/</code></h3><ul><li>eight source files that students can read</li><li>a scripted smoke provider for repeatable practice</li><li>text-only Claude and Codex adapter probes</li><li>durable events, bounded tools and a signed gate receipt</li></ul></section>',
    '<section><h3>Class exemplar · <code>live/</code></h3><ul><li>a real Claude or Codex provider stream</li><li>structured tool calls through the harness bridge</li><li>a temporary staged copy for each lane</li><li>gate refusals returned to a provider-driven worker</li><li>complete raw, event and receipt artifacts</li></ul></section>',
    '<section><h3>Still not supplied</h3><ul><li>complete operating-system containment for every provider</li><li>full approval flows for risky actions</li><li>a general contract parser and schema validator</li><li>checks that cover every important failure</li><li>automatic human release decisions</li></ul></section></div>',
    '<div class="wiring-ledger"><div class="wiring-row"><strong class="active">Starter path</strong><span><code>src/loop.ts</code> makes the control mechanics small enough to inspect.</span></div>',
    '<div class="wiring-row"><strong class="active">Real path</strong><span><code>live/runtime/engine.ts</code> connects a real provider, harness tools, durable events and the independent gate.</span></div>',
    '<div class="wiring-row"><strong class="partial">Recorded only</strong><span><code>budgets.attempts</code> enters the starter manifest and view. It does not stop a starter run.</span></div>',
    '<div class="wiring-row"><strong class="inactive">Not enforced</strong><span>Several contract fields remain descriptive. A signed receipt proves named checks, not check quality.</span></div></div>'
  ].join("");

  var tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  var panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
  function selectTab(tab) {
    tabs.forEach(function (item) {
      var selected = item === tab;
      item.setAttribute("aria-selected", selected ? "true" : "false");
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(function (panel) { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
    tab.focus();
  }
  tabs.forEach(function (tab, index) {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      var next = event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      selectTab(tabs[next]);
    });
  });

  showModule("loop");
  showStep(0);
})();
