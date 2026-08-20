(function () {
  'use strict';

  const root = document.getElementById('graphExplorer');
  if (!root) return;

  root.innerHTML = `
    <section class="containment-thesis" aria-labelledby="graph-thesis-title">
      <div>
        <p class="containment-kicker">One goal. Several bounded runs.</p>
        <h2 id="graph-thesis-title">More workers expand execution. They do not multiply authority.</h2>
      </div>
      <p class="containment-answer graph-answer"><strong>One Job decides what joins.</strong> Children return candidates and evidence. The parent still verifies the composed result.</p>
    </section>

    <div class="containment-tabs" role="tablist" aria-label="DeadReckon graph explainer sections">
      <button id="graph-tab-answer" role="tab" aria-selected="true" aria-controls="graph-panel-answer" data-panel="answer">The direct answer</button>
      <button id="graph-tab-execution" role="tab" aria-selected="false" aria-controls="graph-panel-execution" data-panel="execution" tabindex="-1">This execution</button>
      <button id="graph-tab-disk" role="tab" aria-selected="false" aria-controls="graph-panel-disk" data-panel="disk" tabindex="-1">What lives on disk</button>
      <button id="graph-tab-compose" role="tab" aria-selected="false" aria-controls="graph-panel-compose" data-panel="compose" tabindex="-1">Compose or refuse</button>
    </div>

    <section class="containment-panel" id="graph-panel-answer" role="tabpanel" aria-labelledby="graph-tab-answer" data-panel-name="answer">
      <header class="panel-heading">
        <div><p class="panel-kicker">From a run loop to a supervised Job</p><h3>DeadReckon puts a graph around the gate.</h3></div>
        <p>A graph schedules work. It does not remove verification.</p>
      </header>

      <div class="job-pipeline" aria-label="DeadReckon Job pipeline">
        <div class="pipeline-step"><b>Job</b><span>Freeze one goal, policy and acceptance contract.</span></div>
        <div class="pipeline-step"><b>Graph</b><span>Declare tasks and their dependencies.</span></div>
        <div class="pipeline-step"><b>Children</b><span>Run ready tasks in isolated worktrees.</span></div>
        <div class="pipeline-step is-gate"><b>Join</b><span>Admit identity-bound evidence.</span></div>
        <div class="pipeline-step"><b>Compose</b><span>Build one ordered parent candidate.</span></div>
        <div class="pipeline-step is-gate"><b>Parent checks</b><span>Run the native gate and a fresh read-only judge.</span></div>
      </div>

      <div class="one-versus-job">
        <section>
          <h3><code>prove-it</code></h3>
          <p>One worker changes one working tree. One gate verifies one candidate and writes one receipt.</p>
        </section>
        <section>
          <h3>DeadReckon</h3>
          <p>A supervisor schedules child runs. Each child has its own worktree, gate evidence and result identity. Accepted results can enter a parent candidate.</p>
        </section>
      </div>

      <div class="completion-equation" aria-label="Child completion does not equal Job completion">
        <span><strong>child complete</strong><br>one bounded result passed</span>
        <span class="not-equal" aria-hidden="true">≠</span>
        <span><strong>Job complete</strong><br>all required results composed and verified</span>
      </div>
    </section>

    <section class="containment-panel" id="graph-panel-execution" role="tabpanel" aria-labelledby="graph-tab-execution" data-panel-name="execution" hidden>
      <header class="panel-heading">
        <div><p class="panel-kicker">Real execution <code>a7f25a76</code></p><h3>Five tasks does not mean five workers at once.</h3></div>
        <p>Dependencies decide which tasks are ready.</p>
      </header>

      <p class="run-goal"><strong>Parent goal:</strong> Build a local Python to-do application with a curses interface, priorities, categories, reminders and completion tracking.</p>

      <div class="run-facts" aria-label="Observed Job configuration">
        <span>planner, children, reviewer <code>Codex</code></span>
        <span>branch policy <code>stack</code></span>
        <span>apply <code>per-node</code></span>
        <span>strategy <code>squash</code></span>
        <span>network <code>deny</code></span>
        <span>containment <code>required</code></span>
      </div>

      <figure class="execution-graph" tabindex="0" aria-label="Scrollable five-task dependency chain">
        <div class="graph-track">
          <article class="task-node is-running">
            <span class="node-state">ready → running</span>
            <b>0 · Foundation</b>
            <p>Data model, persistence and service layer.</p>
          </article>
          <article class="task-node">
            <span class="node-state">waiting for 0</span>
            <b>1 · Curses UI</b>
            <p>Interactive local terminal interface.</p>
          </article>
          <article class="task-node">
            <span class="node-state">waiting for 1</span>
            <b>2 · Organize</b>
            <p>Priorities and categories.</p>
          </article>
          <article class="task-node">
            <span class="node-state">waiting for 2</span>
            <b>3 · Track</b>
            <p>Reminders and completion.</p>
          </article>
          <article class="task-node">
            <span class="node-state">waiting for 3</span>
            <b>4 · Harden</b>
            <p>Tests, documentation and final checks.</p>
          </article>
        </div>
      </figure>

      <div class="graph-verdict">
        <p><strong>This Job is a chain.</strong> Task 1 cannot start before task 0 passes and joins. The same rule repeats through task 4.</p>
        <p class="observed">Graph shown at launch: task 0 is the only ready node.</p>
      </div>

      <aside class="honest-label">
        <strong>Running is not joining.</strong>
        <p>A child must finish, produce gate evidence and match the current candidate. Only then can its result enter the Job.</p>
      </aside>

      <p class="sequence-rule"><strong>Parallelism is earned by graph shape.</strong> Independent ready nodes can fan out. This Job has no independent siblings, so its five supervised stages stay ordered.</p>
    </section>

    <section class="containment-panel" id="graph-panel-disk" role="tabpanel" aria-labelledby="graph-tab-disk" data-panel-name="disk" hidden>
      <header class="panel-heading">
        <div><p class="panel-kicker">Isolation is visible in the filesystem</p><h3>Each layer has one job.</h3></div>
        <p>The supervisor does not ask children to coordinate through one shared folder.</p>
      </header>

      <div class="disk-flow">
<pre class="disk-tree" aria-label="DeadReckon execution files">~/.deadreckon/
├── jobs/a7f25a76…/
│   ├── job.json
│   ├── authority.json
│   ├── acceptance.yaml
│   └── ordered-candidate/
│       └── workspace/
│
├── plans/a7f25a76…/
│   ├── plan.json
│   ├── plan-events.jsonl
│   └── worker-specs/
│       ├── task-0.md
│       └── task-1…4.md
│
├── worktrees/
│   └── task-0-…/
│
└── runstate/task-0-…/
    └── runs/15b168c0…/
        ├── events/
        ├── snapshots/
        ├── proofs/
        └── provider-evidence/</pre>
        <dl class="disk-legend">
          <div><dt>job/</dt><dd>The parent goal, authority and acceptance contract.</dd></div>
          <div><dt>plan/</dt><dd>The task graph, frozen child briefs and durable plan events.</dd></div>
          <div><dt>worktrees/</dt><dd>An isolated Git worktree for each child that can write.</dd></div>
          <div><dt>runstate/</dt><dd>The child trace, snapshots, proofs and provider evidence.</dd></div>
          <div><dt>ordered-candidate/</dt><dd>The only parent candidate that accepted child results may change.</dd></div>
        </dl>
      </div>

      <div class="candidate-flow" aria-label="Child result application sequence">
        <span>approved parent</span><i>→</i><span>child worktree</span><i>→</i><span>verified result</span><i>→</i><span>prepared event</span><i>→</i><span>exact squash</span><i>→</i><span>completed event</span>
      </div>

      <p class="sequence-rule"><strong>The events surround the mutation.</strong> DeadReckon records the intended application, verifies the exact Git result and then records completion.</p>
    </section>

    <section class="containment-panel" id="graph-panel-compose" role="tabpanel" aria-labelledby="graph-tab-compose" data-panel-name="compose" hidden>
      <header class="panel-heading">
        <div><p class="panel-kicker">The relationship chooses the rule</p><h3>Fan-in is not one generic merge.</h3></div>
        <p>The supervisor must know how child outputs relate.</p>
      </header>

      <div class="composition-ledger" role="table" aria-label="Four composition rules">
        <div class="composition-row composition-head" role="row"><span role="columnheader">Rule</span><span role="columnheader">Child outputs</span><span role="columnheader">Supervisor action</span><span role="columnheader">Result</span></div>
        <div class="composition-row" role="row"><strong role="cell">Synthesis</strong><span role="cell">Findings or competing hypotheses</span><span role="cell">Compare evidence and write one conclusion.</span><span class="rule-result" role="cell">one explanation</span></div>
        <div class="composition-row" role="row"><strong role="cell">Union</strong><span role="cell">Disjoint files or modules</span><span role="cell">Combine artifacts after each local gate passes.</span><span class="rule-result" role="cell">mechanical join</span></div>
        <div class="composition-row is-live" role="row"><strong role="cell">Ordered integration</strong><span role="cell">A declared dependency chain</span><span role="cell">Compose by dependency order, not finish time.</span><span class="rule-result" role="cell">this Job</span></div>
        <div class="composition-row" role="row"><strong role="cell">Repair or refusal</strong><span role="cell">Overlapping siblings or disagreement</span><span role="cell">Preserve a conflict bundle. Assign bounded repair or stop.</span><span class="rule-result" role="cell">no silent winner</span></div>
      </div>

      <div class="fan-in-strip" aria-label="Four distinct parent decisions">
        <div><b>JOIN</b><span>Is this evidence eligible?</span></div>
        <div><b>COMPOSE</b><span>Which rule builds the candidate?</span></div>
        <div><b>GATE</b><span>Do the native gate and fresh judge pass?</span></div>
        <div><b>RELEASE</b><span>Who accepts the consequence?</span></div>
      </div>

      <p class="parent-rule"><strong>The Job believes only what survives the join and both parent checks.</strong> A child cannot declare the Job complete. A clean Git operation cannot replace parent verification.</p>
    </section>

    <nav class="containment-sources" aria-label="Implementation sources">
      <span>Read the mechanisms</span>
      <a href="https://github.com/gregce/deadreckon/blob/main/crates/deadreckon-core/src/plan.rs">Dependency readiness</a>
      <a href="https://github.com/gregce/deadreckon/blob/main/crates/deadreckon/src/commands/plan.rs">Child scheduling and apply</a>
      <a href="https://github.com/gregce/deadreckon/blob/main/crates/deadreckon/src/commands/graph_job.rs">Ordered candidate</a>
      <a href="https://github.com/gregce/deadreckon/blob/main/crates/deadreckon/src/commands/merge.rs">DAG-aware composition</a>
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
