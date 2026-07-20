from pathlib import Path

from dotenv import load_dotenv
from pydantic_ai import Agent, RunContext
from pydantic_ai.capabilities.hooks import Hooks
from pydantic_ai.messages import ModelRequest, UserPromptPart
from pydantic_ai.models import ModelRequestContext

from event_logging import make_event_stream_printer, print_response

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SUMMARIZER = Agent(
    "anthropic:claude-haiku-4-5",
    name="history_summarizer",
    retries=3,
    instructions="Summarize the conversation history briefly. Preserve important facts, requests, and decisions.",
)


class Session:
    def __init__(self) -> None:
        self.message_history = []
        self.summarizer = SUMMARIZER


def main() -> None:
    hooks = Hooks()
    agent = Agent(
        "anthropic:claude-haiku-4-5",
        name="history_and_compaction_agent",
        deps_type=Session,
        retries=3,
        instructions="You are a helpful assistant. Be concise.",
        capabilities=[hooks],
    )

    @hooks.on.before_model_request
    async def compact_history_if_necessary(
        ctx: RunContext[Session],
        request_context: ModelRequestContext,
    ) -> ModelRequestContext:
        if len(request_context.messages) <= 10:
            return request_context

        print("-----------------------")
        print("Summarizing earlier messages...")
        summary_result = await ctx.deps.summarizer.run(
            "Summarize these earlier messages:\n\n" + "\n\n".join(str(message) for message in request_context.messages[:7])
        )
        print("-----------------------")
        print(summary_result.output)
        print("-----------------------")
        request_context.messages = [
            ModelRequest(parts=[UserPromptPart(content=f"Summary of earlier conversation:\n{summary_result.output}")]),
            *request_context.messages[-3:],
        ]
        ctx.deps.message_history = list(request_context.messages)
        return request_context

    session = Session()
    while True:
        user_prompt = input("Prompt: ")
        result = agent.run_sync(
            user_prompt,
            deps=session,
            message_history=session.message_history,
            event_stream_handler=make_event_stream_printer(),
        )
        session.message_history.extend(result.new_messages())
        print_response(result.output)


if __name__ == "__main__":
    main()
