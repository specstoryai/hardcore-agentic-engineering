import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def search_hacker_news(query: str) -> str:
    with urlopen(
        f"https://hn.algolia.com/api/v1/search?query={quote(query)}&hitsPerPage=5&tags=story"
    ) as response:
        data = json.loads(response.read().decode())
    # trim noisy fields to save tokens
    for hit in data.get("hits", []):
        hit.pop("_highlightResult", None)
        hit.pop("children", None)
    return json.dumps(data)


def main(user_prompt: str) -> None:
    client = Anthropic()

    messages = [
        {"role": "user", "content": user_prompt},
    ]

    while True:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=400,
            system="You are a helpful assistant. Be concise.",
            tools=[
                {
                    "name": "search_hacker_news",
                    "description": "Search Hacker News stories from the internet.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query to look up on Hacker News.",
                            }
                        },
                        "required": ["query"],
                    },
                },
            ],
            messages=messages,
        )

        messages.append({"role": "assistant", "content": response.content})

        tool_results = []

        for block in response.content:
            if block.type == "tool_use" and block.name == "search_hacker_news":
                print(f"-----------------------\nTool call: {block.name}({json.dumps(block.input)})")
                tool_result = search_hacker_news(block.input["query"])
                print(f"-----------------------\nTool response: {tool_result}")
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": tool_result,
                    }
                )

        if not tool_results:
            text = "\n".join(
                block.text for block in response.content if block.type == "text"
            )
            print(f"-----------------------\nResponse: {text}")
            break

        messages.append({"role": "user", "content": tool_results})


if __name__ == "__main__":
    main(input("Prompt: "))
