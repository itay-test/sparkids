import os
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])


def make_song_prompt(idea: str) -> str:
    """Turn a kid's Hebrew idea into a Lyria music prompt with Hebrew lyrics."""
    response = _gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"A 5-year-old Israeli girl wants a song about: '{idea}' (may be in Hebrew or baby talk). "
            "Write a SHORT children's song prompt for an AI music generator. "
            "Include: 1) Simple Hebrew lyrics (2 short verses + chorus, max 8 lines total) "
            "2) Music style instruction in English (e.g. 'upbeat children's pop, playful, major key'). "
            "Format:\nLYRICS:\n<hebrew lyrics>\n\nMUSIC STYLE: <english style description>"
        ),
    )
    return response.text.strip()


def generate_song(idea: str, voice_id: str = None, voice_name: str = "Zephyr") -> dict:
    """Generate a children's song. Returns {audio_url, lyrics, prompt_used}."""
    raw = make_song_prompt(idea)

    # parse lyrics + style
    lyrics = ""
    style = "upbeat happy children's song, simple melody, major key"
    if "LYRICS:" in raw and "MUSIC STYLE:" in raw:
        parts = raw.split("MUSIC STYLE:")
        lyrics = parts[0].replace("LYRICS:", "").strip()
        style = parts[1].strip()
    else:
        lyrics = raw

    # build Lyria prompt
    lyria_prompt = (
        f"{style}. "
        f"Vocals singing these Hebrew lyrics: {lyrics}"
    )

    print(f"[generate_song] style={style[:60]} | lyrics={lyrics[:60]}")

    response = _gemini.models.generate_content(
        model="lyria-3-pro-preview",
        contents=lyria_prompt,
        config=types.GenerateContentConfig(response_modalities=["AUDIO"]),
    )

    candidate = response.candidates[0]
    if candidate.content is None:
        raise RuntimeError(f"Song blocked: {candidate.finish_reason}")

    for part in candidate.content.parts:
        if part.inline_data is not None:
            mime = part.inline_data.mime_type
            data = base64.b64encode(part.inline_data.data).decode("utf-8")
            lyria_audio_url = f"data:{mime};base64,{data}"

            # generate vocals with Gemini TTS in matched voice
            vocals_url = None
            try:
                from services.voice import sing_with_voice
                vocals_url = sing_with_voice(lyrics, voice_name)
                print(f"[generate_song] vocals generated with voice={voice_name}")
            except Exception as e:
                print(f"[generate_song] vocals failed: {e}")

            return {
                "audio_url": vocals_url or lyria_audio_url,
                "instrumental_url": lyria_audio_url,
                "lyrics": lyrics,
                "prompt_used": lyria_prompt[:200],
                "has_cloned_voice": bool(vocals_url),
                "voice_used": voice_name,
            }

    raise RuntimeError("Lyria returned no audio")
