# Can the worker tamper with the gate key?

Yes, if the worker can run an arbitrary process on the same machine as
`prove-it`. The student who asked this question was right.

`prove-it` is a teaching harness. It makes receipt binding, replay refusal and
stale-result refusal visible. It does not supply an operating-system sandbox.

<div id="containmentExplorer" class="containment-explorer"><p>The visual explainer needs JavaScript. The short answer is that `prove-it` demonstrates the gate protocol, not the security boundary around the gate.</p><p>DeadReckon adds that boundary. The worker runs inside an OS sandbox. The evaluator has no signing key. The host loads the key only after the evaluator process tree is gone.</p></div>
