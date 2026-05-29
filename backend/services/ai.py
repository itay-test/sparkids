import os
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

TEXT_MODEL = "gemini-2.5-flash"
IMAGE_MODEL = "gemini-2.5-flash-image"


def make_kid_prompt(idea: str, has_photo: bool = False, preferences: str = "",
                    companion_name: str = "", companion_desc: str = "") -> str:
    context = "enhance the uploaded photo based on" if has_photo else "create a painting of"
    pref_line = f"\nChild's taste profile: {preferences}" if preferences else ""
    companion_line = ""
    if companion_name:
        companion_line = f"\nThe child's companion character named '{companion_name}'"
        if companion_desc:
            companion_line += f" (looks like: {companion_desc})"
        companion_line += " should appear prominently in the painting."
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A 5-year-old Israeli child said (in Hebrew, baby talk, or broken words): '{idea}'.{pref_line}{companion_line} "
            f"Understand what they mean and write a vivid, joyful prompt to {context} their idea (max 60 words). "
            "IMPORTANT: Do NOT use copyrighted character names (no Disney, Marvel, etc.). "
            "Describe characters by appearance instead. "
            "Make it magical, colorful, and delightful for young children. "
            "Return only the image prompt in English, nothing else."
        ),
    )
    return response.text.strip()


def make_improve_prompt(feedback: str, previous_prompt: str) -> str:
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A 5-year-old Israeli child wants to improve their painting (feedback in Hebrew or baby talk): '{feedback}'. "
            f"The current painting shows: '{previous_prompt}'. "
            "Write a SHORT image editing instruction (max 40 words). "
            "Start with: 'Edit this image:' then describe ONLY what to add or change. Keep everything else the same. "
            "Do NOT use copyrighted character names. "
            "Return only the instruction in English, nothing else."
        ),
    )
    return response.text.strip()


def make_companion_portrait_prompt(description: str, companion_type: str = "") -> str:
    """Generate a safe image-gen prompt for a companion character portrait."""
    type_line = f"The character type is: {companion_type}. " if companion_type else ""
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A child described their companion character (in Hebrew or baby talk): '{description}'. {type_line}"
            "Write a vivid image-generation prompt for this character's portrait (max 50 words). "
            "Style: cute chibi cartoon, white or soft background, vibrant colors, big expressive eyes, friendly smile, child-friendly. "
            "Do NOT use copyrighted names. Describe appearance only. "
            "Return only the image prompt in English, nothing else."
        ),
    )
    return response.text.strip()


def _extract_mime_and_bytes(data_url: str):
    if "," in data_url:
        header, b64data = data_url.split(",", 1)
        mime = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
    else:
        b64data = data_url
        mime = "image/jpeg"
    return mime, base64.b64decode(b64data)


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
    print(f"[generate_image] prompt: {prompt[:80]}")
    return _call_image_model(prompt)


def generate_image_from_photo(prompt: str, photo_b64: str) -> str:
    mime, photo_bytes = _extract_mime_and_bytes(photo_b64)
    print(f"[generate_image_from_photo] mime={mime} size={len(photo_bytes)}b")
    contents = [
        types.Part.from_bytes(data=photo_bytes, mime_type=mime),
        types.Part.from_text(text=prompt),
    ]
    return _call_image_model(contents)
