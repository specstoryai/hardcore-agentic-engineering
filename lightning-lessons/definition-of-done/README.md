# Build a Definition of Done for Claude Code & Codex

<p align="center"><strong>Stop letting the agent grade its own homework.</strong></p>

<p align="center">
A 30-minute Maven lightning lesson on why coding agents say "done" when they aren't —<br>
and the smallest possible loop that makes "done" an exit code instead of a feeling.
</p>

---

## The premise

Every coding agent harness — Claude Code, Codex, Gemini CLI, Copilot — runs the same while-loop: the model reasons, calls tools, observes results, repeats. The run ends the moment the model replies **without calling a tool**. Nothing checks anything at that boundary by default. "Done" is a property of the model's output, not of the work.

Agile teams hit this exact problem twenty years ago with humans, and the fix was the **Definition of Done**: written before the work, a checklist not a vibe, binary, and shared. This lesson ports that discipline to agents — first through `/goal`-style LLM judges (an opinion), then through deterministic checks (evidence), and finally down to a loop small enough to memorize:

```bash
until ./check.sh; do
  claude -p "Goal in TODO.md. Run ./check.sh, read the first failure, fix it, commit."
done
```

`until` is the whole orchestration layer. The exit code is the Definition of Done. The model's opinion never touches the exit condition.

It's the same idea as [deadreckon](https://deadreckon.sh) — a separate check, not the agent, decides when the work is actually done — stripped to something you can run tonight.

## What's in this folder

| File | What it is |
|---|---|
| [`definition-of-done-lightning-lesson.html`](definition-of-done-lightning-lesson.html) | The full deck, [presented live here](https://specstoryai.github.io/hardcore-agentic-engineering/). A single self-contained HTML file — open it in a browser and present. `←`/`→` navigate, `G` shows the slide grid, `T` runs the 30-minute timer, `F` goes fullscreen. |
| [`dod-demo/`](https://github.com/specstoryai/dod-demo) | The live demo, as a git submodule. Two Claudes run the same prompt side by side: one alone (ships a bug and calls it done), one inside the gated loop (gets pushed back until the check passes). |

The demo repo has its own README with single-run and side-by-side instructions, including a deterministic `--mock` mode for rehearsal. If you cloned this repo without `--recurse-submodules`, run `git submodule update --init` to pull it in.

## The arc of the talk

1. **How harnesses actually decide to stop** — the while-loop you're already running
2. **What agile teams figured out 20 years ago** — the Definition of Done, and why it worked
3. **Goals arrive in the harness** — `/goal` ships, and an LLM plays judge
4. **The ten-line loop** where a shell script is the judge — live demo
5. **When to skip all of this** — not every task needs a gate

## Links

- [Lesson page on Maven](https://maven.com/p/e72330/build-a-definition-of-done-for-claude-code-and-codex) — Tuesday, July 14, 2026 · free
- [Hardcore Agentic Engineering](https://maven.com/specstory/hardcore-agentic-engineering-for-builders-who-ship) — the full course this lesson comes from
- [deadreckon.sh](https://deadreckon.sh) — where the ten-line loop goes when it grows up
