import os
import base64
from google import genai
from google.genai import types

_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

TEXT_MODEL = "gemini-2.5-flash"
IMAGE_MODEL = "gemini-2.5-flash-image"


def make_kid_prompt(idea: str) -> str:
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A 5-year-old Israeli girl named Carmel said (possibly in Hebrew, baby talk, or broken words): '{idea}'. "
            "Understand what she means even if the words are incomplete or childish. "
            "Translate her idea to English and write a vivid, colorful, joyful image-generation prompt (max 50 words). "
            "Keep it magical, cute, and appropriate for young children. "
            "Return only the image prompt in English, nothing else."
        ),
    )
    return response.text.strip()


def generate_image(prompt: str) -> str:
    response = _gemini.models.generate_content(
        model=IMAGE_MODEL,
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
