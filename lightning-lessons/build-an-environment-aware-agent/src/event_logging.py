import hashlib
import json
from collections.abc import AsyncIterable

from pydantic_ai.messages import (
    DeferredToolRequestsEvent,
    DeferredToolResultsEvent,
    EnqueuedMessagesEvent,
    FinalResultEvent,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    OutputToolCallEvent,
    OutputToolResultEvent,
    PartDeltaEvent,
    PartEndEvent,
    PartStartEvent,
)

RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

C_THINKING = "\033[35m"
C_TEXT = "\033[32m"
C_TOOL_CALL = "\033[33m"
C_TOOL_RESP = "\033[34m"
C_HEADER = "\033[1;37m"
C_META = "\033[90m"
C_FINAL = "\033[96m"

TRUNCATE_AT = 500


__all__ = ["color", "C_HEADER", "C_FINAL", "make_event_stream_printer", "print_response"]


def color(c: str, text: str) -> str:
    return f"{c}{text}{RESET}"


def truncate(text: str, limit: int = TRUNCATE_AT) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + color(DIM, f"… [{len(text) - limit} chars omitted]")


def _fmt_args(raw_args: object) -> str:
    if isinstance(raw_args, str):
        try:
            raw_args = json.loads(raw_args)
        except Exception:
            return raw_args
    if isinstance(raw_args, dict):
        parts = ", ".join(f"{k}={json.dumps(v, ensure_ascii=False)}" for k, v in raw_args.items())
        return f"({parts})"
    return repr(raw_args)


def _fmt_tool_result(content: object) -> str:
    if content is None:
        return color(C_META, "(no direct content)")
    if isinstance(content, (dict, list)):
        return json.dumps(content, indent=2, ensure_ascii=False)
    text = str(content)
    return truncate(text)


def _short_id(tool_call_id: str | None) -> str:
    if not tool_call_id:
        return ""
    return hashlib.md5(tool_call_id.encode()).hexdigest()[:6]


def _fmt_event(event: object) -> str | None:
    if isinstance(event, PartStartEvent):
        return None

    if isinstance(event, PartDeltaEvent):
        delta_kind = getattr(event.delta, "part_delta_kind", type(event.delta).__name__)
        text = getattr(event.delta, "content_delta", None) or getattr(event.delta, "text_delta", None)
        if delta_kind == "thinking":
            return color(C_THINKING, text or "") if text else None
        if delta_kind == "text":
            return None
        return None

    if isinstance(event, PartEndEvent):
        return None

    if isinstance(event, FunctionToolCallEvent):
        part = event.part
        short_id = _short_id(part.tool_call_id)
        return color(C_TOOL_CALL, f"⚙ tool_call<{short_id}>: {part.tool_name}{_fmt_args(part.args)}")

    if isinstance(event, FunctionToolResultEvent):
        part = event.part
        short_id = _short_id(part.tool_call_id)
        return color(C_TOOL_RESP, f"↩ tool_response<{short_id}>: {part.tool_name}\n{_fmt_tool_result(part.content)}")

    if isinstance(event, OutputToolCallEvent):
        part = event.part
        short_id = _short_id(part.tool_call_id)
        return color(C_TOOL_CALL, f"⚙ output_tool_call<{short_id}>: {part.tool_name}{_fmt_args(part.args)}")

    if isinstance(event, OutputToolResultEvent):
        return color(C_TOOL_RESP, "↩ output_tool_result")

    if isinstance(event, EnqueuedMessagesEvent):
        return color(C_META, f"[enqueued messages: {len(event.messages)}]")

    if isinstance(event, DeferredToolRequestsEvent):
        return color(C_META, "[deferred tool requests]")

    if isinstance(event, DeferredToolResultsEvent):
        return color(C_META, "[deferred tool results]")

    if isinstance(event, FinalResultEvent):
        return None

    return color(C_META, repr(event))


def make_event_stream_printer():
    printed_header = False

    async def print_event_stream(_ctx: object, events: AsyncIterable[object]) -> None:
        nonlocal printed_header
        async for event in events:
            rendered = _fmt_event(event)
            if rendered:
                if not printed_header:
                    print(color(C_HEADER, f"\n{'─' * 70}"))
                    print(color(C_HEADER, "AGENT TRACE"))
                    print(color(C_HEADER, f"{'─' * 70}\n"))
                    printed_header = True
                print(rendered)

    return print_event_stream


def print_response(output: str) -> None:
    print(color(C_FINAL, f"Response: {output}"))


def print_review_input(application):  # no type hints — avoids dependency on 7-pydantic-ai-reviewer
    """Print the application + job opening as the agent sees it."""
    job_opening = application.jobOpening
    sub_departments = ", ".join(str(v) for v in job_opening.subDepartments) or "None"

    print(color(C_HEADER, f"\n{'─' * 70}"))
    print(color(C_HEADER, "REVIEW INPUT"))
    print(color(C_HEADER, f"{'─' * 70}"))
    print(f"Application ID: {application.id}")
    print(f'Candidate: first_name="{application.firstName}", last_name="{application.lastName}"')
    print(f"Email: {application.email}")
    print(f"Phone: {application.mobile}")
    print(f"Bio: {application.bio}")
    print(f"LinkedIn URL: {application.linkedinUrl}")
    print(f"Job opening title: {job_opening.title}")
    print(f"Job opening seniority level: {job_opening.seniorityLevel}")
    print(f"Job opening department: {job_opening.department}")
    print(f"Job opening sub-departments: {sub_departments}")
    print(f"Job opening description: {job_opening.jobDescription}")
    print(f"Hiring company: {job_opening.company}")
    print(f"Candidate region: {application.region}")
    print()
    print("Please screen this candidate using the screen-candidate skill.")


def print_review_output(output):  # no type hints — avoids dependency on 7-pydantic-ai-reviewer
    """Print the structured review result."""
    print(color(C_HEADER, f"\n{'─' * 70}"))
    print(color(C_HEADER, "FINAL REVIEW"))
    print(color(C_HEADER, f"{'─' * 70}"))
    print(color(C_FINAL, f"recommendation: {output.update_type.value}"))
    print()
    print(color(C_HEADER, "internal_notes"))
    print(output.internal_notes)
    print()
    print(color(C_HEADER, "correspondence"))
    print(output.correspondence)
