import os
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

TEXT_MODEL = "gemini-2.5-flash"
IMAGE_MODEL = "gemini-2.5-flash-image"


def make_kid_prompt(idea: str, has_photo: bool = False) -> str:
    context = "enhance the uploaded photo based on" if has_photo else "create a painting of"
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A 5-year-old Israeli girl named Carmel said (in Hebrew, baby talk, or broken words): '{idea}'. "
            f"Understand what she means and write a prompt to {context} her idea (max 50 words). "
            "IMPORTANT: Do NOT use copyrighted character names (no Disney, Marvel, etc.). "
            "Describe characters by appearance instead (e.g. 'a girl with ice powers in a blue dress'). "
            "Keep it magical, cute, and appropriate for young children. "
            "Return only the image prompt in English, nothing else."
        ),
    )
    return response.text.strip()


def make_improve_prompt(feedback: str, previous_prompt: str) -> str:
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A 5-year-old Israeli girl wants to improve her painting (feedback in Hebrew or baby talk): '{feedback}'. "
            f"The current painting is: '{previous_prompt}'. "
            "Write an editing instruction that KEEPS the existing image and only ADDS or CHANGES what she asked for (max 60 words). "
            "Start with 'Keep the existing image exactly as is, but...' "
            "Do NOT use copyrighted character names. Describe by appearance. "
            "Return only the instruction in English, nothing else."
        ),
    )
    return response.text.strip()


def _call_image_model(contents) -> str:
    response = _gemini.models.generate_content(
        model=IMAGE_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"]),
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


def generate_image(prompt: str) -> str:
    return _call_image_model(prompt)


def generate_image_from_photo(prompt: str, photo_b64: str, mime: str = "image/jpeg") -> str:
    photo_bytes = base64.b64decode(photo_b64.split(",")[-1])
    contents = [
        types.Part.from_bytes(data=photo_bytes, mime_type=mime),
        types.Part.from_text(text=prompt),
    ]
    return _call_image_model(contents)
