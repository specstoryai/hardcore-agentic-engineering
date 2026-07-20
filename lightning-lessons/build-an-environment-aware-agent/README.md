# Build an environment-aware AI Agent from Scratch

<p align="center"><strong>An agent harness is not a black box. It is a loop you can build in an afternoon.</strong></p>

<p align="center">
A one-hour Maven lightning lesson that strips the agent harness down to its core,<br>
then rebuilds it step by step until it works far beyond the terminal.
</p>

<p align="center">
<a href="https://www.youtube.com/watch?v=x8UI9X6ofr4"><strong>&#9654;&nbsp;Watch the recording on YouTube</strong></a><br>
<sub>delivered live on July 20, 2026, with John Berryman</sub>
</p>

---

## The premise

Everything a coding agent does reduces to a model, a loop, and tools. This lesson proves it by building exactly that, seven small steps at a time: first a bare model call, then the tool loop that makes it an agent, then the same agent rebuilt on Pydantic AI with file tools, skills, compaction, and finally a reviewer that lives inside a product instead of a terminal. Along the way it shows the second argument of the course: with the right instructions and tools, agents are researchers, assistants, and reviewers, not just code generators.

## What's in this folder

| Path | What it is |
|---|---|
| [`slides/`](slides/) | The deck, [published here](https://specstoryai.github.io/hardcore-agentic-engineering/build-an-environment-aware-agent/). A static HTML deck: open `index.html` in a browser, arrow keys navigate. |
| [`src/`](src/) | The seven progressive examples, numbered in teaching order: `1-just-a-model.py` through `7-pydantic-ai-reviewer.py`. |
| [`skills/`](skills/) | The `screen-candidate` skill used by the reviewer example. |
| [`scratch_space/`](scratch_space/) | The working directory the later examples read and write, including the `wikipedia-researcher` skill the research example discovers. |
| [`UPSTREAM-README.md`](UPSTREAM-README.md) | The original README from the source repo, kept verbatim. |

## Running the examples

You need [uv](https://docs.astral.sh/uv/), Python 3.13 or newer, and an Anthropic API key in a `.env` file at this folder's root (`ANTHROPIC_API_KEY=...`). Then, from this folder:

```bash
uv run python src/1-just-a-model.py    # a model alone: text in, text out
uv run python src/2-tool-loop.py       # the whole harness: a while-loop and tools
uv run python src/7-pydantic-ai-reviewer.py   # an agent living inside a product
```

Run them in order. The distance between example 1 and example 7 is the lesson.

## Provenance

This folder is a snapshot of [arcturus-labs/agents-showcase](https://github.com/arcturus-labs/agents-showcase) at commit `67fb4b0` (July 20, 2026), the demo code John Berryman wrote for this lesson. The maintained version lives upstream and may have evolved since. The 18-slide deck is John's as well; we host a copy so everything for the lesson lives in one place.

## Links

- [The recording on YouTube](https://www.youtube.com/watch?v=x8UI9X6ofr4): the full lesson as delivered
- [Lesson page on Maven](https://maven.com/p/2ffede/build-an-environment-aware-ai-agent-from-scratch): delivered Monday, July 20, 2026, free
- [arcturus-labs/agents-showcase](https://github.com/arcturus-labs/agents-showcase): the upstream repo
- [Hardcore Agentic Engineering](https://maven.com/specstory/hardcore-agentic-engineering-for-builders-who-ship): the full course this lesson comes from
