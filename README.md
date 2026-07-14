<p align="center">
  <a href="https://maven.com/specstory/hardcore-agentic-engineering-for-builders-who-ship"><img src="assets/maven-logo.png" alt="Maven" width="150"></a>
</p>

<h1 align="center">Hardcore Agentic Engineering: <em>for builders who ship</em></h1>

<p align="center">
Free lightning lessons from <a href="https://maven.com/specstory/hardcore-agentic-engineering-for-builders-who-ship">Hardcore Agentic Engineering</a>, a three-week Maven course on getting real work out of coding agents and proving that work is correct. The course runs <strong>August 3&ndash;21, 2026</strong>. <a href="https://get.specstory.com/agentic-engineering"><strong>Register here</strong></a>: the link applies promo code <code>HARDCORE</code> for you.
</p>

---

## The course

Most AI courses teach you to prompt. This one assumes you already prompt an agent, read the diff, and accept the result. It teaches the discipline that comes next. The spine of the whole course is one sentence:

> **Brief → Steer → Verify. You are the gate the agent can't bribe.**

- **Brief.** Set the goal and the bar before the agent runs.
- **Steer.** Correct the run while it's happening. Don't let a wrong run finish.
- **Verify.** Prove the work against something the agent can't fake. The agent never gets to mark its own homework done.

Over three weeks you build one artifact and keep it: **`prove-it`**, a practice harness that starts as a ~90-line agent loop you can hold in your head. It grows lesson by lesson into something serious: it runs the agent in a sandbox, survives `kill -9`, gates "done" behind checks the agent can't reach, and runs a roster of agents while you keep the keys.

| Week | Theme |
|---|---|
| Aug 3–9 | **Build it, then break it.** A tiny agent with no magic, catching it lying about "done", caging it safely, stopping a wrong run in one sentence |
| Aug 10–16 | **Brief it, then gate it.** The right kind of brief, a "done" the agent can't fake, the gate it can't bribe, writing for the next agent who remembers nothing |
| Aug 17–21 | **Sharpen it, then run a roster.** Context placement, delete-and-regenerate, the right model for each job, running a team of agents. Demo Day closes the cohort. |

Ten live sessions (Tuesdays and Thursdays, August 3–21, 2026), taught by the SpecStory co-founders: [Greg Ceccarelli](https://maven.com/specstory) (ex-CPO Pluralsight; data at GitHub, Dropbox, and Google), Sean Johnson, and Jake Levirne. Details and enrollment on [the Maven course page](https://maven.com/specstory/hardcore-agentic-engineering-for-builders-who-ship).

## The lightning lessons

Three free one-hour sessions in July 2026. Each stands alone and teaches one piece of the course's argument. Each lesson with materials gets a folder in [`lightning-lessons/`](lightning-lessons/) holding its deck and demo code.

| Date | Lesson | Materials |
|---|---|---|
| Tue, Jul 14 | [Build a Definition of Done for Claude Code and Codex](https://maven.com/p/e72330/build-a-definition-of-done-for-claude-code-and-codex): why agents say "done" when they aren't, and the ten-line loop that makes done an exit code | [slides](https://specstoryai.github.io/hardcore-agentic-engineering/definition-of-done/) · [`lightning-lessons/definition-of-done/`](lightning-lessons/definition-of-done/) |
| Mon, Jul 20 | [Build an environment-aware AI Agent from Scratch](https://maven.com/p/2ffede/build-an-environment-aware-ai-agent-from-scratch): an agent harness is a loop you can build yourself in an afternoon. With John Berryman (GitHub Copilot; author, *Prompt Engineering for LLMs*) | coming soon |
| Mon, Jul 27 | [Make Your Repo Agent-Ready: Rules, Docs, Reviews](https://maven.com/p/d68fd1/make-your-repo-agent-ready-rules-docs-reviews): most agent failures aren't the model's fault, they're the repo's. With Dan Gerlanc (co-founder, .txt/Outlines) | coming soon |

## Using this repo

```bash
git clone https://github.com/specstoryai/hardcore-agentic-engineering.git
```

Everything is in the clone, demos included. Each lesson folder has its own README explaining the deck and how to run the demo. The decks are single self-contained HTML files. Open one in a browser and present.

## Further reading

- **[25 Patterns in Agentic Engineering](https://specstory.com/books/25-patterns-in-agentic-engineering-book-2026.pdf)**: Greg's free field guide to shipping software by steering agents, drawn from ~1,310 captured agent sessions and 4,670 commits of building [Stoa](https://withstoa.com)
- **[deadreckon.sh](https://deadreckon.sh)**: run your coding agent unattended, and trust the result. The industrial-grade version of the loops these lessons teach
- **[SpecStory](https://specstory.com)** ([github.com/specstoryai/getspecstory](https://github.com/specstoryai/getspecstory)): capture, search, and learn from every AI coding session
