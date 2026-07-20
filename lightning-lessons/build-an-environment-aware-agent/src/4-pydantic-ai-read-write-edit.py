import subprocess
from pathlib import Path

from dotenv import load_dotenv
from pydantic_ai import Agent

from event_logging import make_event_stream_printer, print_response

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def main(user_prompt: str) -> None:
    project_root = Path(__file__).resolve().parents[1] / "scratch_space"

    agent = Agent(
        "anthropic:claude-haiku-4-5",
        name="read_write_shell_agent",
        retries=3,
        instructions="You are a helpful assistant. Be concise.",
    )

    @agent.tool_plain(docstring_format="google", require_parameter_descriptions=True)
    def read_file(path: str) -> str:
        """Read a file.

        Args:
            path: The path to the file, relative to the scratch_space directory.
        """
        try:
            return (project_root / path).read_text()
        except Exception as error:
            return str(error)

    @agent.tool_plain(docstring_format="google", require_parameter_descriptions=True)
    def write_file(path: str, content: str) -> str:
        """Write a file.

        Args:
            path: The path to the file, relative to the scratch_space directory.
            content: The text content to write.
        """
        try:
            full_path = project_root / path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
            return f"Wrote {full_path}"
        except Exception as error:
            return str(error)

    @agent.tool_plain(docstring_format="google", require_parameter_descriptions=True)
    def run_command(command: str) -> str:
        """Run a shell command.

        Args:
            command: The shell command to run inside the scratch_space directory.
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=project_root,
                capture_output=True,
                text=True,
            )
            return f"stdout:\n{result.stdout}\n\nstderr:\n{result.stderr}"
        except Exception as error:
            return str(error)

    result = agent.run_sync(user_prompt, event_stream_handler=make_event_stream_printer())
    print_response(result.output)


if __name__ == "__main__":
    main(input("Prompt: "))
