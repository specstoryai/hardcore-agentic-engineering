---
name: screen-candidate
description: Screen a job candidate for advance/decline/follow-up. Use this when given a candidate application and a job opening.
---

# Screen Candidate

## Workflow

1. Compare the candidate's background (bio, LinkedIn URL, region) against the job opening (title, department, seniority, description).
2. If the web search or web fetch capabilities are available, search for the candidate's public work (articles, talks, open source, portfolio) — weigh this lightly; focus on the information provided in the application and on the LinkedIn profile.
3. If the role looks like an obvious mismatch, decline immediately with clear reasoning.
4. If the fit looks plausible but evidence is thin or ambiguous, recommend follow-up with one or two concrete questions.
5. Advance only when the candidate appears to be a strong match and the evidence is sufficient.

## Output fields

- `update_type`: `recommend_advance` | `recommend_decline` | `recommend_follow_up`
- `internal_notes`: checklist-style summary covering role fit, evidence quality, job-opening alignment, and the reasoning that drove the recommendation.
- `correspondence`: a short professional message to the candidate (congratulatory for advance, respectful for decline, information request for follow-up).

## Decision guidelines

- **Advance**: strong role fit, sufficient evidence, no missing pieces.
- **Decline**: clear mismatch in domain, seniority, or skills — not a case of insufficient evidence.
- **Follow-up**: plausible fit but one or two narrow gaps that more information could resolve.

Be concise. Favor clear rationale over volume. Do not over-research when the evidence is already sufficient.
