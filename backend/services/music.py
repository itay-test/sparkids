import os
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

TEXT_MODEL  = "gemini-2.5-flash"
MUSIC_MODEL = "lyria-3-pro-preview"

import re

def _clean_lyrics(text: str) -> str:
    """Strip markdown, structural labels, and any trailing English style lines."""
    text = re.sub(r'\*{1,3}([^*\n]+)\*{1,3}', r'\1', text)   # **bold** / *italic*
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)  # # headings
    text = re.sub(r'^[-*_]{2,}\s*$', '', text, flags=re.MULTILINE)  # --- *** ___
    text = re.sub(r'^\*+\s*$', '', text, flags=re.MULTILINE)   # lone asterisks
    # Remove structural labels: (Verse 1), [Chorus], <verse 1>, Verse 1:, בית 1:
    text = re.sub(r'^\s*[<\(\[]?\s*(verse|chorus|bridge|בית|פזמון|גשר)\s*\d*\s*[>\)\]:]?\s*$',
                  '', text, flags=re.MULTILINE | re.IGNORECASE)
    # Remove any trailing paragraph that is mostly ASCII (music style description leaked in)
    paragraphs = re.split(r'\n{2,}', text)
    filtered = []
    for p in paragraphs:
        lines = [l for l in p.strip().splitlines() if l.strip()]
        if lines:
            # Skip paragraph if >60% of chars are ASCII (likely English style note)
            all_chars = ''.join(lines)
            ascii_ratio = sum(c.isascii() for c in all_chars) / max(len(all_chars), 1)
            if ascii_ratio < 0.6:
                filtered.append(p.strip())
    text = '\n\n'.join(filtered)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def make_song_lyrics(idea: str, preferences: str = "", companion_name: str = "", companion_likes: str = "") -> tuple:
    """Returns (lyrics_hebrew, music_style_english)."""
    pref_line = f"\nChild's taste profile: {preferences}" if preferences else ""
    companion_line = ""
    if companion_name:
        companion_line = f"\nThe child's companion character is called '{companion_name}'"
        if companion_likes:
            companion_line += f" and loves {companion_likes}"
        companion_line += ". Include this character by name in the song."
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A child (age 3-5) wants a fun karaoke song about: '{idea}' (may be in Hebrew or baby talk).{pref_line}{companion_line}\n"
            "Write a joyful, very singable Hebrew children's karaoke song with strong rhythm, clear rhymes, and short lines easy to sing along:\n\n"
            "LYRICS:\n"
            "[2 rhyming lines]\n"
            "[2 catchy chorus lines — the hook]\n"
            "[2 rhyming lines]\n"
            "[repeat chorus]\n"
            "Max 8 lines total. ONLY the song lines — NO labels, NO headers, NO asterisks, NO (Verse), NO [Chorus], NO markdown. "
            "Just the words. Hebrew only. Each line max 6 words.\n\n"
            "MUSIC STYLE: <detailed style — tempo (e.g. lively 120bpm), key (e.g. C major), specific instruments, mood — English, max 20 words>"
        ),
    )
    raw = response.text.strip()
    lyrics, style = "", "upbeat happy children's pop, 120bpm, glockenspiel and ukulele, C major key, bouncy"
    if "LYRICS:" in raw and "MUSIC STYLE:" in raw:
        parts = raw.split("MUSIC STYLE:")
        lyrics = _clean_lyrics(parts[0].replace("LYRICS:", ""))
        style  = parts[1].strip()
    else:
        lyrics = _clean_lyrics(raw)
    return lyrics, style


def improve_song_lyrics(feedback: str, previous_lyrics: str, companion_name: str = "") -> tuple:
    """Returns (improved_lyrics_hebrew, music_style_english)."""
    companion_line = f" Keep the character '{companion_name}' in the lyrics." if companion_name else ""
    response = _gemini.models.generate_content(
        model=TEXT_MODEL,
        contents=(
            f"A child gave feedback on their karaoke song (in Hebrew or baby talk): '{feedback}'.{companion_line}\n"
            f"Current song lyrics:\n{previous_lyrics}\n\n"
            "Improve the lyrics based on the feedback. Keep same theme, apply the change. Keep lines short and singable.\n"
            "LYRICS:\n<verse 1>\n<chorus>\n<verse 2>\n<chorus>\nMax 8 lines. Hebrew only. Each line max 6 words.\n\n"
            "MUSIC STYLE: <tempo, instruments, mood — English, max 20 words>"
        ),
    )
    raw = response.text.strip()
    lyrics, style = previous_lyrics, "upbeat happy children's pop, 120bpm, glockenspiel and ukulele, C major key, bouncy"
    if "LYRICS:" in raw and "MUSIC STYLE:" in raw:
        parts = raw.split("MUSIC STYLE:")
        lyrics = _clean_lyrics(parts[0].replace("LYRICS:", ""))
        style  = parts[1].strip()
    return lyrics, style


def _lyria_instrumental(prompt: str) -> str:
    """Generate instrumental karaoke track with Lyria. Returns base64 data URL."""
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


def _build_lyria_prompt(style: str, lyrics: str, instruments: list = None) -> str:
    instrument_str = f"Featuring: {', '.join(instruments)}. " if instruments else ""
    return (
        f"Children's karaoke backing track. {style}. {instrument_str}"
        f"Instrumental backing for a Hebrew children's song with this lyrical mood and rhythm: {lyrics[:120]}. "
        "INSTRUMENTAL ONLY — absolutely NO vocals, NO singing, NO humming, NO speech. "
        "Strong clear beat so a child can sing along. Energetic, fun, loop-friendly. 45 seconds."
    )


def generate_song(idea: str, voice_type: str = "default", instruments: list = None,
                  preferences: str = "", companion_name: str = "", companion_likes: str = "") -> dict:
    """Karaoke mode: Lyria instrumental only — kid sings along."""
    lyrics, style = make_song_lyrics(idea, preferences=preferences,
                                     companion_name=companion_name, companion_likes=companion_likes)
    lyria_prompt = _build_lyria_prompt(style, lyrics, instruments)
    print(f"[song/karaoke] style={style[:60]} companion={companion_name}")

    instrumental_url = _lyria_instrumental(lyria_prompt)

    return {
        "audio_url":        None,
        "instrumental_url": instrumental_url,
        "lyrics":           lyrics,
        "style":            style,
        "instruments":      instruments or [],
        "prompt_used":      lyria_prompt[:200],
        "voice_type":       voice_type,
        "karaoke":          True,
    }


def improve_song(feedback: str, previous_lyrics: str, previous_style: str,
                 voice_type: str = "default", instruments: list = None,
                 companion_name: str = "") -> dict:
    """Regenerate karaoke instrumental based on child's voice feedback."""
    lyrics, style = improve_song_lyrics(feedback, previous_lyrics, companion_name=companion_name)
    lyria_prompt = _build_lyria_prompt(style, lyrics, instruments)
    print(f"[song/karaoke/improve] feedback={feedback[:40]}")

    instrumental_url = _lyria_instrumental(lyria_prompt)

    return {
        "audio_url":        None,
        "instrumental_url": instrumental_url,
        "lyrics":           lyrics,
        "style":            style,
        "instruments":      instruments or [],
        "prompt_used":      lyria_prompt[:200],
        "voice_type":       voice_type,
        "karaoke":          True,
    }
