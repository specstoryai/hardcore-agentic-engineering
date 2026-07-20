from pathlib import Path

from dotenv import load_dotenv
from pydantic_ai import Agent
from pydantic_ai.capabilities import WebSearch
from pydantic_ai_harness.filesystem import FileSystem
from pydantic_ai_harness.shell import Shell
from pydantic_ai_skills import SkillsCapability

from event_logging import make_event_stream_printer, print_response

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

def main(user_prompt: str) -> None:
    project_root = Path(__file__).resolve().parents[1] / "scratch_space"

    agent = Agent(
        "anthropic:claude-haiku-4-5",
        name="read_write_edit_skills_agent",
        retries=3,
        instructions="You research things by rummaging around wikipedia.",
        capabilities=[
            FileSystem(root_dir=project_root),
            Shell(cwd=project_root),
            # WebSearch(),
            SkillsCapability(directories=[project_root / ".agents" / "skills"]),
        ],
    )

    result = agent.run_sync(user_prompt, event_stream_handler=make_event_stream_printer())
    print_response(result.output)


if __name__ == "__main__":
    main(input("Prompt: "))
