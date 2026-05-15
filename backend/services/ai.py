import os
import base64
import anthropic
from google import genai
from google.genai import types

_claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])


def make_kid_prompt(idea: str) -> str:
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


def generate_image(prompt: str) -> str:
    """Generate image with Gemini and return a base64 data URL."""
    response = _gemini.models.generate_content(
        model="gemini-2.0-flash-preview-image-generation",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"]
        ),
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            mime = part.inline_data.mime_type
            data = base64.b64encode(part.inline_data.data).decode("utf-8")
            return f"data:{mime};base64,{data}"
    raise RuntimeError("Gemini returned no image")
