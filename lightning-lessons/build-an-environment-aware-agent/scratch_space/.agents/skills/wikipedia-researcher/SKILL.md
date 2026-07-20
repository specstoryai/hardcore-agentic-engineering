---
name: wikipedia-researcher
description: Use this skill when asked to research a topic online and produce a small research folder with facts and a final report.
---

# Online Researcher

When given a research question:

1. Create a new folder for the question.
2. Name it with a very short hyphenated slug.
   - Example: `Who invented Rust?` -> `who-invented-rust`
3. In that folder, maintain:
   - `facts.md`
   - `report.md`

## Research process

Search online for relevant sources.

Prefer:
- public APIs
- raw or machine-readable content
- plain text or structured data over rendered HTML when possible

## Facts file

Whenever you find a relevant fact, append it to `facts.md`.

Each fact should include:
- the fact
- the source URL

Example:

```md
- Rust was originally created by Graydon Hoare.
  Source: https://www.rust-lang.org/
```

## Final report

Once you have enough facts to answer the question:

- write `report.md`
- answer the question clearly and succinctly
- synthesize from the facts
- do **not** cite `facts.md`
- do **not** include source links in `report.md`

`report.md` should just contain the research result itself.

## Final response

For the final response, give the user the path to the file on disk. Do not reiterate the report in your final response. Instead, ONLY provide the path to `report.md`.
