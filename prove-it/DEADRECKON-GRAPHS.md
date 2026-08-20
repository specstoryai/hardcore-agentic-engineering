# How does DeadReckon turn one goal into verified child runs?

`prove-it` makes one worker, one gate and one receipt visible. DeadReckon adds
a Job supervisor, a dependency graph, isolated child worktrees and a parent
gate.

The graph does not make every child run at once. A child becomes ready only
after its dependencies pass. Its result is still only a candidate until the
Job admits its evidence, composes the result and verifies the new parent.

<div id="graphExplorer" class="containment-explorer graph-explorer"><p>The visual explainer needs JavaScript. The short answer is that `prove-it` verifies one run. DeadReckon supervises a graph of isolated runs and verifies what joins the parent.</p><p>The live example uses five tasks, but they form one dependency chain. Only one child is ready at a time.</p></div>
