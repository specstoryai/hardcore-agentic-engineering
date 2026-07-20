from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def main(user_prompt: str) -> None:
    client = Anthropic()

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=200,
        system="You are a helpful assistant. Be concise.",
        messages=[
            {"role": "user", "content": user_prompt},
        ],
    )

    text = "\n".join(
        block.text for block in response.content if block.type == "text"
    )
    print(f"-----------------------\nResponse: {text}")


if __name__ == "__main__":
    main(input("Prompt: "))
