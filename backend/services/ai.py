import os
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

TEXT_MODEL = "gemini-2.5-flash"
IMAGE_MODEL = "gemini-2.5-flash-image"


def make_kid_prompt(idea: str) -> str:
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A 5-year-old Israeli girl named Carmel said (in Hebrew, baby talk, or broken words): '{idea}'. "
            "Understand what she means even if words are incomplete or childish. "
            "Translate her idea to English and write a vivid, colorful, joyful image-generation prompt (max 50 words). "
            "IMPORTANT: Do NOT use any copyrighted character names (no Disney, Marvel, etc.). "
            "Instead describe the character by appearance: e.g. 'a girl with ice powers and a blue dress' instead of 'Elsa'. "
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
    candidate = response.candidates[0]

    if candidate.content is None:
        raise RuntimeError(f"Image blocked: {candidate.finish_reason}")

    for part in candidate.content.parts:
        if part.inline_data is not None:
            mime = part.inline_data.mime_type
            data = base64.b64encode(part.inline_data.data).decode("utf-8")
            return f"data:{mime};base64,{data}"

    raise RuntimeError("Gemini returned no image")
