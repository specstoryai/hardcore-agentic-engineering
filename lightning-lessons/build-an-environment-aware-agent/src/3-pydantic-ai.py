import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen

from dotenv import load_dotenv
from pydantic_ai import Agent

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def main(user_prompt: str) -> None:
    agent = Agent(
        "anthropic:claude-haiku-4-5",
        name="tool_loop_agent",
        instructions="You are a helpful assistant. Be concise.",
    )

    @agent.tool_plain(docstring_format="google", require_parameter_descriptions=True)
    def search_hacker_news(query: str) -> str:
        """Search Hacker News stories from the internet.

        Args:
            query: The search query to look up on Hacker News.
        """
        with urlopen(
            f"https://hn.algolia.com/api/v1/search?query={quote(query)}&hitsPerPage=5&tags=story"
        ) as response:
            data = json.loads(response.read().decode())
        # trim noisy fields to save tokens
        for hit in data.get("hits", []):
            hit.pop("_highlightResult", None)
            hit.pop("children", None)
        tool_result = json.dumps(data)
        print(f"-----------------------\nTool call: search_hacker_news({json.dumps({'query': query})})")
        print(f"-----------------------\nTool response: {tool_result}")
        return tool_result

    result = agent.run_sync(user_prompt)
    print(f"-----------------------\nResponse: {result.output}")


if __name__ == "__main__":
    main(input("Prompt: "))
