import os
import anthropic
import httpx

_claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def make_kid_prompt(idea: str) -> str:
    """Turn a kid's rough idea into a vivid painting prompt."""
    msg = _claude.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": (
                f"A child wants to paint: '{idea}'. "
                "Write a short, vivid, colorful image-generation prompt (max 50 words). "
                "Keep it fun, bright, and appropriate for kids."
            ),
        }],
    )
    return msg.content[0].text.strip()


async def generate_image(prompt: str) -> str:
    """Call OpenAI DALL-E 3 and return the image URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}"},
            json={"model": "dall-e-3", "prompt": prompt, "n": 1, "size": "1024x1024"},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["url"]
