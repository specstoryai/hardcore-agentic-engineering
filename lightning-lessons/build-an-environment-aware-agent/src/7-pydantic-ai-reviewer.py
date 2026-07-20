from __future__ import annotations

import asyncio
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models.anthropic import AnthropicModel, AnthropicModelSettings
from pydantic_ai_skills import SkillsCapability

from event_logging import (
    make_event_stream_printer,
    print_review_input,
    print_review_output,
)

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


# ── models ─────────────────────────────────────────────────────────────────────

@dataclass
class JobOpening:
    title: str
    seniorityLevel: str
    department: str
    subDepartments: list[str]
    jobDescription: str
    company: str


@dataclass
class Application:
    id: str
    firstName: str
    lastName: str
    email: str
    mobile: str
    bio: str
    linkedinUrl: str
    region: str
    jobOpening: JobOpening


class UpdateType(str, Enum):
    RECOMMEND_ADVANCE = "recommend_advance"
    RECOMMEND_DECLINE = "recommend_decline"
    RECOMMEND_FOLLOW_UP = "recommend_follow_up"


class AIApplicationReview(BaseModel):
    update_type: UpdateType
    internal_notes: str = Field(min_length=1)
    correspondence: str = Field(min_length=1)


# ── reviewer ──────────────────────────────────────────────────────────────────

SKILLS_DIR = Path(__file__).resolve().parents[1] / "skills"

agent = Agent(
    model=AnthropicModel(
        "claude-sonnet-5",
        settings=AnthropicModelSettings(anthropic_thinking={"type": "adaptive"}),
    ),
    output_type=AIApplicationReview,
    capabilities=[
        SkillsCapability(directories=[SKILLS_DIR]),
    ],
    instructions=(
        "You are a careful candidate-screening assistant; use the skills in the "
        "repository skills directory to make a grounded recommendation."
    ),
)


async def review(application: Application) -> AIApplicationReview:
    job_opening = application.jobOpening
    sub_departments = ", ".join(str(v) for v in job_opening.subDepartments) or "None"

    prompt = (
        f"Application ID: {application.id}\n"
        f'Candidate: first_name="{application.firstName}", last_name="{application.lastName}"\n'
        f"Email: {application.email}\n"
        f"Phone: {application.mobile}\n"
        f"Bio: {application.bio}\n"
        f"LinkedIn URL: {application.linkedinUrl}\n"
        f"Job opening title: {job_opening.title}\n"
        f"Job opening seniority level: {job_opening.seniorityLevel}\n"
        f"Job opening department: {job_opening.department}\n"
        f"Job opening sub-departments: {sub_departments}\n"
        f"Job opening description: {job_opening.jobDescription}\n"
        f"Hiring company: {job_opening.company}\n"
        f"Candidate region: {application.region}\n"
        "\nPlease screen this candidate using the screen-candidate skill."
    )

    result = await agent.run(
        prompt,
        event_stream_handler=make_event_stream_printer(),
    )
    return result.output


# ── main ──────────────────────────────────────────────────────────────

async def main() -> None:
    application = Application(
        id="app-doug-turnbull-001",
        firstName="Doug",
        lastName="Turnbull",
        email="doug@example.com",
        mobile="+1-555-0101",
        bio=(
            "Search relevance engineer and educator focused on information retrieval, "
            "hybrid search, learning to rank, and LLM-powered search systems."
        ),
        linkedinUrl="https://www.linkedin.com/in/softwaredoug/",
        region="Charlottesville, Virginia, United States",
        jobOpening=JobOpening(
            title="Lead Mobile Product Designer",
            seniorityLevel="Lead",
            department="DESIGN",
            subDepartments=["PROD_MOBILE", "DES_UI"],
            jobDescription=(
                "We are hiring a lead mobile product designer to own end-to-end UX "
                "for our iOS and Android apps. The role requires strong product design "
                "craft, interaction design, prototyping, visual design systems experience, "
                "close partnership with product and engineering, and a portfolio showing "
                "shipped mobile consumer experiences."
            ),
            company="Arcturus Labs",
        ),
    )
    print_review_input(application)
    output = await review(application)
    print_review_output(output)


if __name__ == "__main__":
    asyncio.run(main())
