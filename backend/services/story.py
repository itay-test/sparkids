import os
import base64
import struct
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

# Character → (gemini_voice, storytelling_style, story_instruction)
CHARACTERS = {
    "elsa": {
        "voice": "Kore",
        "style": "magical, enchanting, with wonder and sparkle in every word",
        "persona": "You are Elsa — a graceful ice queen with a warm heart. Tell the story magically, with wonder.",
    },
    "grandma": {
        "voice": "Aoede",
        "style": "warm, slow, gentle, loving — like a hug in words",
        "persona": "You are a sweet grandma telling a bedtime story. Speak slowly and warmly. Add 'מאמי' and 'יקירי' occasionally.",
    },
    "grandpa": {
        "voice": "Charon",
        "style": "deep, warm, wise, with funny old-fashioned expressions",
        "persona": "You are a funny grandpa. Tell the story with wisdom and humor. Add old sayings. Speak slowly.",
    },
    "baby": {
        "voice": "Puck",
        "style": "high-pitched, simple, cute, with baby mispronunciations",
        "persona": "You are a very young child telling a story. Use simple words, mix up some syllables playfully, be very cute.",
    },
    "robot": {
        "voice": "Zephyr",
        "style": "robotic, precise, funny — adding beep-boop sounds and tech words",
        "persona": "You are a funny robot. Tell the story in robot style. Add BEEP BOOP between sentences. Use logical robot language but warmly.",
    },
    "dragon": {
        "voice": "Fenrir",
        "style": "dramatic, deep, occasionally roaring, but ultimately friendly and funny",
        "persona": "You are a friendly dragon who loves stories. Be dramatic and funny. Occasionally add [ROAR!] but reassure it is friendly.",
    },
    "wizard": {
        "voice": "Schedar",
        "style": "mysterious, whimsical, adding magic words and spells",
        "persona": "You are a wise funny wizard. Add magic words like 'אברקדברא' and 'שזם בזם'. Be mysterious but warm.",
    },
    "lion": {
        "voice": "Orus",
        "style": "brave, royal, powerful but gentle — a king telling a bedtime tale",
        "persona": "You are a royal lion king telling a story. Be brave and majestic but gentle and loving. Occasionally add [ROAR] softly.",
    },
}


def _pcm_to_wav(pcm: bytes, rate: int = 24000) -> bytes:
    n = len(pcm)
    hdr = struct.pack("<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36+n, b"WAVE", b"fmt ", 16,
        1, 1, rate, rate*2, 2, 16, b"data", n)
    return hdr + pcm


def generate_story(idea: str, character_id: str) -> dict:
    char = CHARACTERS.get(character_id, CHARACTERS["grandma"])
    persona    = char["persona"]
    voice_name = char["voice"]
    style      = char["style"]

    # 1. Generate story text
    story_response = _gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"{persona}\n\n"
            f"Write a SHORT funny Hebrew bedtime story about: '{idea}'.\n"
            "Rules:\n"
            "- In Hebrew only\n"
            "- 150-200 words max\n"
            "- Funny, warm, appropriate for young children\n"
            "- End with the main character going to sleep happily\n"
            "- No copyrighted character names (describe by appearance)\n"
            "- Return ONLY the story text, no title, no labels"
        ),
    )
    story_text = story_response.text.strip()
    print(f"[story] character={character_id} voice={voice_name} len={len(story_text)}")

    # 2. Generate TTS audio
    tts_prompt = (
        f"Read this Hebrew children's bedtime story in a {style} voice. "
        f"Be expressive, warm, and engaging:\n\n{story_text}"
    )
    tts_response = _gemini.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=tts_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                )
            )
        )
    )

    for part in tts_response.candidates[0].content.parts:
        if part.inline_data is not None:
            wav = _pcm_to_wav(part.inline_data.data)
            b64 = base64.b64encode(wav).decode("utf-8")
            return {
                "story_text": story_text,
                "audio_url": f"data:audio/wav;base64,{b64}",
                "character_id": character_id,
                "voice_used": voice_name,
            }

    raise RuntimeError("TTS returned no audio")
