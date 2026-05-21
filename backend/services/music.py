import os
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

TEXT_MODEL  = "gemini-2.5-flash"
IMAGE_MODEL = "gemini-2.5-flash-image"
MUSIC_MODEL = "lyria-3-pro-preview"

VOICE_STYLES = {
    "man":    "sung by a warm adult male voice",
    "woman":  "sung by a warm adult female voice",
    "girl":   "sung by a bright young girl's voice",
    "boy":    "sung by an energetic young boy's voice",
    "default":"sung by a friendly warm voice",
}

# Gemini TTS voice per detected type (for vocal track)
TTS_VOICES = {
    "man":    "Charon",
    "woman":  "Kore",
    "girl":   "Aoede",
    "boy":    "Puck",
    "default":"Zephyr",
}


def make_kid_prompt(idea: str, has_photo: bool = False) -> str:
    context = "enhance the uploaded photo based on" if has_photo else "create a painting of"
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A 5-year-old Israeli girl named Carmel said (in Hebrew, baby talk, or broken words): '{idea}'. "
            f"Understand what she means and write a prompt to {context} her idea (max 50 words). "
            "IMPORTANT: Do NOT use copyrighted character names (no Disney, Marvel, etc.). "
            "Describe characters by appearance instead. "
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
            f"The current painting shows: '{previous_prompt}'. "
            "Write a SHORT image editing instruction (max 40 words). "
            "Start with: 'Edit this image:' then describe ONLY what to add or change. Keep everything else the same. "
            "Do NOT use copyrighted character names. "
            "Return only the instruction in English, nothing else."
        ),
    )
    return response.text.strip()


def make_song_lyrics(idea: str) -> tuple:
    """Returns (lyrics_hebrew, music_style_english)."""
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A child wants a song about: '{idea}' (may be in Hebrew or baby talk). "
            "Write a SHORT children's song:\n"
            "LYRICS:\n<2 short verses + chorus in Hebrew, max 8 lines>\n\n"
            "MUSIC STYLE: <upbeat/slow/etc, instruments, mood — in English, max 15 words>"
        ),
    )
    raw = response.text.strip()
    lyrics, style = "", "upbeat happy children's pop, playful melody, major key"
    if "LYRICS:" in raw and "MUSIC STYLE:" in raw:
        parts = raw.split("MUSIC STYLE:")
        lyrics = parts[0].replace("LYRICS:", "").strip()
        style  = parts[1].strip()
    else:
        lyrics = raw
    return lyrics, style


def _pcm_to_wav(pcm: bytes, rate: int = 24000) -> bytes:
    import struct
    n = len(pcm)
    hdr = struct.pack("<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36+n, b"WAVE", b"fmt ", 16,
        1, 1, rate, rate*2, 2, 16, b"data", n)
    return hdr + pcm


def _gemini_tts_vocals(lyrics: str, voice_name: str) -> str:
    """Sing lyrics with Gemini TTS in the matched voice. Returns base64 data URL."""
    resp = _gemini.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=f"Sing these Hebrew children's song lyrics expressively with rhythm:\n\n{lyrics}",
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                )
            )
        )
    )
    for part in resp.candidates[0].content.parts:
        if part.inline_data is not None:
            wav = _pcm_to_wav(part.inline_data.data)
            return f"data:audio/wav;base64,{base64.b64encode(wav).decode()}"
    raise RuntimeError("TTS returned no audio")


def _lyria_instrumental(prompt: str) -> str:
    """Generate instrumental track with Lyria. Returns base64 data URL."""
    response = _gemini.models.generate_content(
        model=MUSIC_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(response_modalities=["AUDIO"]),
    )
    candidate = response.candidates[0]
    if candidate.content is None:
        raise RuntimeError(f"Lyria blocked: {candidate.finish_reason}")
    for part in candidate.content.parts:
        if part.inline_data is not None:
            mime = part.inline_data.mime_type
            data = base64.b64encode(part.inline_data.data).decode("utf-8")
            return f"data:{mime};base64,{data}"
    raise RuntimeError("Lyria returned no audio")


def generate_song(idea: str, voice_type: str = "default", instruments: list = None) -> dict:
    """Lyria instrumental + Gemini TTS vocals in the speaker's voice type."""
    import concurrent.futures
    lyrics, style = make_song_lyrics(idea)
    voice_name = TTS_VOICES.get(voice_type, TTS_VOICES["default"])

    instrument_str = f"featuring {', '.join(instruments)}. " if instruments else ""
    lyria_prompt = (
        f"{style}. {instrument_str}"
        "INSTRUMENTAL ONLY. NO vocals. NO singing. Pure music track for children."
    )
    print(f"[song] voice={voice_type}→{voice_name} instruments={instruments}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
        lyria_f = ex.submit(_lyria_instrumental, lyria_prompt)
        tts_f   = ex.submit(_gemini_tts_vocals, lyrics, voice_name)
        instrumental_url = lyria_f.result()
        vocals_url       = tts_f.result()

    return {
        "audio_url":        vocals_url,
        "instrumental_url": instrumental_url,
        "lyrics":           lyrics,
        "prompt_used":      lyria_prompt[:200],
        "voice_type":       voice_type,
        "voice_name":       voice_name,
    }


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
    print(f"[paint] prompt: {prompt[:80]}")
    return _call_image_model(prompt)


def generate_image_from_photo(prompt: str, photo_b64: str) -> str:
    mime, photo_bytes = _extract_mime_and_bytes(photo_b64)
    print(f"[paint] photo mime={mime} size={len(photo_bytes)}b")
    contents = [
        types.Part(inline_data=types.Blob(data=photo_bytes, mime_type=mime)),
        types.Part(text=prompt),
    ]
    return _call_image_model(contents)
