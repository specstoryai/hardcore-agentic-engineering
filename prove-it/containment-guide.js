(function () {
  'use strict';

  const root = document.getElementById('containmentExplorer');
  if (!root) return;

  root.innerHTML = `
    <section class="containment-thesis" aria-labelledby="containment-thesis-title">
      <div>
        <p class="containment-kicker">The student found a real boundary</p>
        <h2 id="containment-thesis-title">A signature is only as strong as the wall around its key.</h2>
      </div>
      <p class="containment-answer"><strong>Yes.</strong> An unconstrained local process can tamper with <code>prove-it</code>. The harness teaches the protocol, not process isolation.</p>
    </section>

    <div class="containment-tabs" role="tablist" aria-label="Containment explainer sections">
      <button id="containment-tab-answer" role="tab" aria-selected="true" aria-controls="containment-panel-answer" data-panel="answer">The direct answer</button>
      <button id="containment-tab-compare" role="tab" aria-selected="false" aria-controls="containment-panel-compare" data-panel="compare" tabindex="-1">Two systems</button>
      <button id="containment-tab-lifecycle" role="tab" aria-selected="false" aria-controls="containment-panel-lifecycle" data-panel="lifecycle" tabindex="-1">Keyless, then sign</button>
      <button id="containment-tab-threats" role="tab" aria-selected="false" aria-controls="containment-panel-threats" data-panel="threats" tabindex="-1">Attack paths</button>
    </div>

    <section class="containment-panel" id="containment-panel-answer" role="tabpanel" aria-labelledby="containment-tab-answer" data-panel-name="answer">
      <div class="direct-summary">
        <h3>Receipt proof is not containment.</h3>
        <p><code>prove-it</code> teaches the receipt protocol. DeadReckon's strict path adds the process boundary that keeps signing authority outside the worker's reach.</p>
      </div>

      <div class="authority-ladder" aria-label="Four levels of authority control">
        <div class="ladder-row">
          <span class="ladder-level">Instruction</span>
          <span class="ladder-effect">“Do not read the key.”</span>
          <span class="ladder-result weak">A worker can ignore it.</span>
        </div>
        <div class="ladder-row prove-it-stop">
          <span class="ladder-level">Tool policy</span>
          <span class="ladder-effect">Refuse paths outside <code>working/</code>.</span>
          <span class="ladder-result partial">This is where <code>prove-it</code> stops.</span>
        </div>
        <div class="ladder-row">
          <span class="ladder-level">Process boundary</span>
          <span class="ladder-effect">Keep the key outside the worker process.</span>
          <span class="ladder-result strong">The worker has no key authority.</span>
        </div>
        <div class="ladder-row">
          <span class="ladder-level">Kernel boundary</span>
          <span class="ladder-effect">Deny reads and writes at the OS layer.</span>
          <span class="ladder-result strong">Even hostile code gets a refusal.</span>
        </div>
      </div>

      <aside class="honest-label">
        <strong>Containment is an observed property.</strong>
        <p><code>prove-it</code> reports OS containment as <code>UNSUPPORTED</code>. DeadReckon makes the claim only when its strict sandbox probe passes.</p>
      </aside>
    </section>

    <section class="containment-panel" id="containment-panel-compare" role="tabpanel" aria-labelledby="containment-tab-compare" data-panel-name="compare" hidden>
      <header class="panel-heading">
        <div><p class="panel-kicker">Same gate idea, different trust claim</p><h3><code>prove-it</code> demonstrates. DeadReckon contains.</h3></div>
        <p>One intentional difference: who can reach the signing authority.</p>
      </header>

      <div class="system-compare">
        <section class="system-column teaching-system">
          <p class="system-label">Teaching harness</p>
          <h4><code>prove-it</code></h4>
          <dl>
            <div><dt>Key</dt><dd><code>control/gate.key</code> inside the clone</dd></div>
            <div><dt>Worker boundary</dt><dd>The supplied TypeScript tool dispatcher</dd></div>
            <div><dt>Gate process</dt><dd>Reads the key when it starts</dd></div>
            <div><dt>OS sandbox</dt><dd>Not supplied</dd></div>
            <div><dt>Valid claim</dt><dd>The receipt binds one result to one contract and candidate.</dd></div>
          </dl>
        </section>

        <div class="boundary-mark" aria-hidden="true"><span>authority boundary</span></div>

        <section class="system-column contained-system">
          <p class="system-label">Contained runtime</p>
          <h4>DeadReckon strict path</h4>
          <dl>
            <div><dt>Key</dt><dd>Protected host key store, outside the workspace</dd></div>
            <div><dt>Worker boundary</dt><dd>OS sandbox plus protected-path policy</dd></div>
            <div><dt>Gate process</dt><dd>Evaluates without a key; trusted host signs later</dd></div>
            <div><dt>OS sandbox</dt><dd>Required and probed for strict jobs</dd></div>
            <div><dt>Valid claim</dt><dd>The worker cannot grant itself completion through the exposed paths.</dd></div>
          </dl>
        </section>
      </div>

      <figure class="filesystem-figure">
        <figcaption><strong>Filesystem and permission boundary</strong><span>Ported from the DeadReckon containment report</span></figcaption>
        <div class="filesystem-scroll" tabindex="0" aria-label="Scrollable filesystem boundary diagram">
<pre>┌────────────────────────────────────────────────────────────────────────┐
│                        TRUSTED HOST SUPERVISOR                         │
│                                                                        │
│  ~/.deadreckon/gate-keys/&lt;run_id&gt;.key  (Mode 0700/0600, 32-byte HMAC)  │
│  ~/.deadreckon/runs/&lt;scope&gt;/&lt;run_id&gt;/                                  │
│  ├── acceptance.yaml                   (Approved test contract)        │
│  ├── snapshots/turn-0/                 (Tamper baseline snapshot)      │
│  └── proofs/turn-acceptance.json       (Signed completion marker)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
════════════════════════════════════╪═════════════════════════════════════
          OS SANDBOX BOUNDARY (sandbox-exec / bwrap / docker)
════════════════════════════════════╪═════════════════════════════════════
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      UNTRUSTED AGENT WORKSPACE                         │
│                                                                        │
│  working/                              (Read / Write allowed)          │
│  working/.git/                         (Write DENIED)                  │
│  run_root/acceptance.yaml              (Write DENIED)                  │
│  run_root/proofs/                      (Write DENIED)                  │
│  ~/.deadreckon/gate-keys/              (Read &amp; Write DENIED)           │
└────────────────────────────────────────────────────────────────────────┘</pre>
        </div>
      </figure>
    </section>

    <section class="containment-panel" id="containment-panel-lifecycle" role="tabpanel" aria-labelledby="containment-tab-lifecycle" data-panel-name="lifecycle" hidden>
      <header class="panel-heading">
        <div><p class="panel-kicker">The crucial sequence</p><h3>The key arrives after the untrusted process leaves.</h3></div>
        <p>Repository-controlled checks never run in the process that holds the signing key.</p>
      </header>

      <figure class="sequence-figure">
        <figcaption><strong>Execution and signing lifecycle</strong><span>Ported from the DeadReckon containment report</span></figcaption>
        <div class="sequence-scroll" tabindex="0" aria-label="Scrollable execution and signing sequence">
          <svg class="sequence-svg" xmlns="http://www.w3.org/2000/svg" viewBox="-50 -10 1347 963" role="img" aria-labelledby="sequence-title sequence-desc">
            <title id="sequence-title">DeadReckon execution and signing sequence</title>
            <desc id="sequence-desc">The sandboxed agent and keyless gate evaluation finish before the trusted host loads the signing key and writes the proof.</desc>
            <defs>
              <marker id="containment-arrowhead" refX="7.9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
                <path d="M -1 0 L 10 5 L 0 10 z" class="sequence-arrowhead" />
              </marker>
            </defs>

            <g>
              <rect x="0" y="0" width="150" height="45" rx="4" class="sequence-actor" />
              <text x="75" y="27" class="sequence-actor-text">Agent (Sandbox)</text>
              <rect x="200" y="0" width="210" height="45" rx="4" class="sequence-actor" />
              <text x="305" y="27" class="sequence-actor-text">dr-gate evaluate</text>
              <rect x="515" y="0" width="210" height="45" rx="4" class="sequence-actor" />
              <text x="620" y="27" class="sequence-actor-text">deadreckon-runtime</text>
              <rect x="890" y="0" width="155" height="45" rx="4" class="sequence-actor" />
              <text x="967" y="27" class="sequence-actor-text">tamper.rs (Host)</text>
              <rect x="1090" y="0" width="160" height="45" rx="4" class="sequence-actor" />
              <text x="1170" y="27" class="sequence-actor-text">dr-gate sign (Host)</text>
            </g>

            <line x1="75" y1="45" x2="75" y2="880" class="sequence-lifeline" />
            <line x1="305" y1="45" x2="305" y2="880" class="sequence-lifeline" />
            <line x1="620" y1="45" x2="620" y2="880" class="sequence-lifeline" />
            <line x1="967" y1="45" x2="967" y2="880" class="sequence-lifeline" />
            <line x1="1170" y1="45" x2="1170" y2="880" class="sequence-lifeline" />

            <text x="347" y="85" class="sequence-message-text">1. Agent calls done</text>
            <line x1="75" y1="95" x2="615" y2="95" class="sequence-message" marker-end="url(#containment-arrowhead)" />
            <text x="620" y="130" class="sequence-message-text">2. clear_stale_gate_attempt_evidence()</text>
            <path d="M 620,140 C 670,135 670,165 620,160" class="sequence-message" marker-end="url(#containment-arrowhead)" />
            <text x="462" y="195" class="sequence-message-text">3. run_strict_sandbox_boundary_probe()</text>
            <line x1="620" y1="205" x2="310" y2="205" class="sequence-message" marker-end="url(#containment-arrowhead)" />
            <text x="462" y="240" class="sequence-message-text">4. dr-gate evaluate (No keys in env)</text>
            <line x1="620" y1="250" x2="310" y2="250" class="sequence-message" marker-end="url(#containment-arrowhead)" />
            <text x="462" y="285" class="sequence-message-text">5. Returns keyless GateEvaluation JSON</text>
            <line x1="305" y1="295" x2="615" y2="295" class="sequence-message sequence-dashed" marker-end="url(#containment-arrowhead)" />
            <text x="620" y="330" class="sequence-message-text">6. Kill &amp; reap evaluator process tree</text>
            <path d="M 620,340 C 670,335 670,365 620,360" class="sequence-message" marker-end="url(#containment-arrowhead)" />
            <text x="793" y="395" class="sequence-message-text">7. Recompute tamper facts vs Turn-0 baseline</text>
            <line x1="620" y1="405" x2="962" y2="405" class="sequence-message" marker-end="url(#containment-arrowhead)" />

            <rect x="40" y="435" width="1170" height="430" class="sequence-alt" />
            <polygon points="40,435 90,435 90,455 75,465 40,465" class="sequence-box-label" />
            <text x="65" y="452" class="sequence-box-text">ALT</text>
            <text x="647" y="455" class="sequence-box-text sequence-accent">[ Tamper Detected OR Test Failure ]</text>
            <text x="793" y="495" class="sequence-message-text">8. Verdict::Refuse / Failed</text>
            <line x1="967" y1="505" x2="625" y2="505" class="sequence-message sequence-dashed" marker-end="url(#containment-arrowhead)" />
            <text x="347" y="540" class="sequence-message-text sequence-accent">9. Loop back: “acceptance failed; continue”</text>
            <line x1="620" y1="550" x2="80" y2="550" class="sequence-message" marker-end="url(#containment-arrowhead)" />

            <line x1="40" y1="585" x2="1210" y2="585" class="sequence-alt" />
            <text x="647" y="605" class="sequence-box-text sequence-accent">[ All Checks Passed AND Tamper Clean ]</text>
            <text x="793" y="640" class="sequence-message-text">10. Tamper Clean</text>
            <line x1="967" y1="650" x2="625" y2="650" class="sequence-message sequence-dashed" marker-end="url(#containment-arrowhead)" />
            <text x="895" y="685" class="sequence-message-text">11. Sign canonical marker via HMAC-SHA256</text>
            <line x1="620" y1="695" x2="1165" y2="695" class="sequence-message" marker-end="url(#containment-arrowhead)" />
            <text x="895" y="730" class="sequence-message-text">12. Write proofs/turn-acceptance.json</text>
            <line x1="1170" y1="740" x2="625" y2="740" class="sequence-message sequence-dashed" marker-end="url(#containment-arrowhead)" />
            <text x="620" y="775" class="sequence-message-text">13. Promote run to library/ (Phase 60: Done)</text>
            <path d="M 620,785 C 670,780 670,810 620,805" class="sequence-message" marker-end="url(#containment-arrowhead)" />

            <g transform="translate(0, 880)">
              <rect x="0" y="0" width="150" height="45" rx="4" class="sequence-actor" />
              <text x="75" y="27" class="sequence-actor-text">Agent (Sandbox)</text>
              <rect x="200" y="0" width="210" height="45" rx="4" class="sequence-actor" />
              <text x="305" y="27" class="sequence-actor-text">dr-gate evaluate</text>
              <rect x="515" y="0" width="210" height="45" rx="4" class="sequence-actor" />
              <text x="620" y="27" class="sequence-actor-text">deadreckon-runtime</text>
              <rect x="890" y="0" width="155" height="45" rx="4" class="sequence-actor" />
              <text x="967" y="27" class="sequence-actor-text">tamper.rs (Host)</text>
              <rect x="1090" y="0" width="160" height="45" rx="4" class="sequence-actor" />
              <text x="1170" y="27" class="sequence-actor-text">dr-gate sign (Host)</text>
            </g>
          </svg>
        </div>
      </figure>

      <p class="sequence-rule"><strong>Order is the defense:</strong> evaluate → reap → load key → sign. If cleanup is uncertain, signing does not start.</p>
    </section>

    <section class="containment-panel" id="containment-panel-threats" role="tabpanel" aria-labelledby="containment-tab-threats" data-panel-name="threats" hidden>
      <header class="panel-heading">
        <div><p class="panel-kicker">Threats become refusals</p><h3>The boundary must stop paths, not intentions.</h3></div>
        <p>These are structural defenses in DeadReckon's strict path.</p>
      </header>

      <div class="threat-ledger" role="table" aria-label="Containment threat ledger">
        <div class="threat-row threat-head" role="row"><span role="columnheader">Worker attempt</span><span role="columnheader">Structural control</span><span role="columnheader">Result</span></div>
        <div class="threat-row" role="row"><strong role="cell">Read the HMAC key</strong><span role="cell">Protected host path plus sandbox read deny</span><span class="refusal" role="cell">DENIED</span></div>
        <div class="threat-row" role="row"><strong role="cell">Rewrite the contract or proof</strong><span role="cell">Sandbox write deny plus host-side binding</span><span class="refusal" role="cell">REFUSE</span></div>
        <div class="threat-row" role="row"><strong role="cell">Forge evaluator JSON</strong><span role="cell">Trusted host validates the evaluation before signing</span><span class="refusal" role="cell">NO PROOF</span></div>
        <div class="threat-row" role="row"><strong role="cell">Leave a background process</strong><span role="cell">Process-group cleanup must prove that descendants are gone</span><span class="refusal" role="cell">LOST CONTAINMENT</span></div>
        <div class="threat-row" role="row"><strong role="cell">Run without a sandbox</strong><span role="cell">Strict jobs require an available backend and a live boundary probe</span><span class="refusal" role="cell">STOP</span></div>
      </div>
    </section>

    <nav class="containment-sources" aria-label="Implementation sources">
      <span>Read the mechanisms</span>
      <a href="control/dr-gate.ts">The teaching gate</a>
      <a href="src/probe.ts">The honest probe</a>
      <a href="https://github.com/gregce/deadreckon/blob/main/crates/deadreckon-runtime/src/turn_loop.rs">The keyless signing sequence</a>
      <a href="https://github.com/gregce/deadreckon/blob/main/crates/deadreckon-sandbox/src/policy.rs">The protected-path policy</a>
    </nav>
  `;

  const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
  const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));

  function selectTab(tab, focus) {
    const name = tab.dataset.panel;
    tabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', selected ? 'true' : 'false');
      candidate.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panelName !== name;
    });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab, false));
    tab.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[tabs.length - 1];
      if (!next) return;
      event.preventDefault();
      selectTab(next, true);
    });
  });
})();
