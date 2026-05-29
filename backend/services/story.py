import os
import base64
import struct
import concurrent.futures
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

CHARACTERS = {
    "elsa":    {
        "voice": "Kore",
        "tts_style": "Read as a graceful, magical ice queen — elegant, warm, with wonder in your voice.",
        "persona": "You are a graceful ice queen with a warm heart. Tell the story magically with wonder and sparkle.",
    },
    "grandma": {
        "voice": "Aoede",
        "tts_style": "Read slowly and warmly like a sweet grandmother telling a bedtime story to her grandchild.",
        "persona": "You are a sweet grandma. Speak slowly and warmly. Add 'יקירי' and 'מאמי' occasionally.",
    },
    "grandpa": {
        "voice": "Charon",
        "tts_style": "Read as a funny, wise old grandfather — slow, warm, with a twinkle of humor.",
        "persona": "You are a funny grandpa full of wisdom and humor. Add old sayings. Speak slowly and warmly.",
    },
    "baby":    {
        "voice": "Puck",
        "tts_style": "Read as a very young toddler — high-pitched, cute, stumbling over big words, adorably funny.",
        "persona": "You are a very young child telling a story. Use simple cute words, be adorable and funny.",
    },
    "robot":   {
        "voice": "Zephyr",
        "tts_style": "Read as a friendly robot — staccato, slightly mechanical but warm. Add BEEP or BOOP between sentences.",
        "persona": "You are a funny robot. Add BEEP BOOP between sentences. Use robotic but warm language.",
    },
    "dragon":  {
        "voice": "Fenrir",
        "tts_style": "Read as a dramatic, friendly dragon — deep, rumbling, excitable. Occasionally add a little roar.",
        "persona": "You are a friendly dramatic dragon. Add [ROAR!] occasionally but stay warm and funny.",
    },
    "wizard":  {
        "voice": "Schedar",
        "tts_style": "Read as a mysterious, wise wizard — slow, mystical, drawing out magical words with gravitas.",
        "persona": "You are a wise funny wizard. Add magic words like אברקדברא. Be mysterious but loving.",
    },
    "lion":    {
        "voice": "Charon",
        "tts_style": "Read as a deep-voiced, majestic lion king — slow, powerful, regal, but gentle and loving.",
        "persona": "You are a royal lion king. Be majestic and brave but gentle and loving.",
    },
}

MELODY_MOODS = {
    "lullaby":   "soft gentle lullaby, piano and strings, very quiet and soothing, bedtime",
    "magic":     "magical fairy tale, sparkly harp and bells, whimsical and enchanting",
    "adventure": "playful adventure, light brass and strings, exciting but not scary for children",
    "nature":    "peaceful nature sounds with soft flute and gentle guitar, birds chirping",
    "happy":     "upbeat cheerful children's music, ukulele and glockenspiel, bouncy and fun",
    "mystery":   "gentle mysterious music, soft piano with light strings, curious and wonder-filled",
}


def _pcm_to_wav(pcm: bytes, rate: int = 24000) -> bytes:
    n = len(pcm)
    hdr = struct.pack("<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36+n, b"WAVE", b"fmt ", 16,
        1, 1, rate, rate*2, 2, 16, b"data", n)
    return hdr + pcm


def _generate_scene_image(scene_desc: str) -> str:
    prompt_resp = _gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"Write a vivid, colorful image-generation prompt for this children's story scene "
            f"(max 30 words, English only, no copyrighted names): {scene_desc}"
        )
    )
    img_prompt = prompt_resp.text.strip()
    img_resp = _gemini.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=f"Children's book illustration, soft watercolor style, warm colors: {img_prompt}",
        config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
    )
    candidate = img_resp.candidates[0]
    if candidate.content is None:
        return None
    for part in candidate.content.parts:
        if part.inline_data:
            mime = part.inline_data.mime_type
            data = base64.b64encode(part.inline_data.data).decode()
            return f"data:{mime};base64,{data}"
    return None


def _generate_melody(mood: str) -> str:
    style = MELODY_MOODS.get(mood, MELODY_MOODS["lullaby"])
    resp = _gemini.models.generate_content(
        model="lyria-3-pro-preview",
        contents=f"Instrumental background music only, NO vocals, NO lyrics: {style}. Loop-friendly, 60 seconds.",
        config=types.GenerateContentConfig(response_modalities=["AUDIO"])
    )
    candidate = resp.candidates[0]
    if candidate.content is None:
        return None
    for part in candidate.content.parts:
        if part.inline_data:
            mime = part.inline_data.mime_type
            data = base64.b64encode(part.inline_data.data).decode()
            return f"data:{mime};base64,{data}"
    return None


def generate_story(idea: str, character_id: str, melody_mood: str = None,
                   include_video: bool = False, preferences: str = "",
                   companion_name: str = "", companion_likes: str = "") -> dict:
    char = CHARACTERS.get(character_id, CHARACTERS["grandma"])
    pref_line = f"\nChild's taste profile: {preferences}" if preferences else ""
    companion_line = ""
    if companion_name:
        companion_line = f"\nIMPORTANT: The main character of the story must be named '{companion_name}'"
        if companion_likes:
            companion_line += f" and loves {companion_likes}"
        companion_line += ". Make the child's companion the hero of the story."

    story_resp = _gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"{char['persona']}\n\n"
            f"Write a SHORT funny Hebrew bedtime story about: '{idea}'.{pref_line}{companion_line}\n"
            "Format as exactly 4 scenes separated by '---SCENE---'.\n"
            "Each scene: 2-3 sentences. Total: 150-200 words.\n"
            "Rules: Hebrew only, funny and warm, ends with happy sleep, no copyrighted names.\n"
            "Return ONLY the story with scene separators, no title."
        )
    )
    full_text = story_resp.text.strip()
    scenes = [s.strip() for s in full_text.split("---SCENE---") if s.strip()]
    story_text = " ".join(scenes)

    print(f"[story] char={character_id} voice={char['voice']} scenes={len(scenes)} companion={companion_name}")

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
        tts_future    = ex.submit(_generate_tts, story_text, char["voice"], char["tts_style"])
        melody_future = ex.submit(_generate_melody, melody_mood) if melody_mood else None
        img_futures   = [ex.submit(_generate_scene_image, s) for s in scenes] if include_video else []

        audio_url   = tts_future.result()
        melody_url  = None
        if melody_future:
            try:
                melody_url = melody_future.result()
                print(f"[story] melody ok: {len(melody_url)} chars")
            except Exception as e:
                print(f"[story] melody failed: {e}")

        scene_images = [f.result() for f in img_futures]

    return {
        "story_text":   story_text,
        "scenes":       scenes,
        "scene_images": [img for img in scene_images if img],
        "audio_url":    audio_url,
        "melody_url":   melody_url,
        "character_id": character_id,
        "voice_used":   char["voice"],
    }


def improve_story(feedback: str, previous_story_text: str, character_id: str) -> dict:
    char = CHARACTERS.get(character_id, CHARACTERS["grandma"])

    story_resp = _gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"{char['persona']}\n\n"
            f"A child gave feedback on their story (in Hebrew or baby talk): '{feedback}'.\n"
            f"Current story:\n{previous_story_text}\n\n"
            "Rewrite the story applying the child's request. Keep the same characters and general theme.\n"
            "Format as exactly 4 scenes separated by '---SCENE---'.\n"
            "Each scene: 2-3 sentences. Total: 150-200 words.\n"
            "Rules: Hebrew only, funny and warm, ends with happy sleep, no copyrighted names.\n"
            "Return ONLY the story with scene separators, no title."
        )
    )
    full_text = story_resp.text.strip()
    scenes = [s.strip() for s in full_text.split("---SCENE---") if s.strip()]
    story_text = " ".join(scenes)

    print(f"[story/improve] char={character_id} feedback={feedback[:40]}")
    audio_url = _generate_tts(story_text, char["voice"], char["tts_style"])

    return {
        "story_text":   story_text,
        "scenes":       scenes,
        "scene_images": [],
        "audio_url":    audio_url,
        "melody_url":   None,
        "character_id": character_id,
        "voice_used":   char["voice"],
    }


def _generate_tts(text: str, voice_name: str, tts_style: str = "") -> str:
    style_prefix = f"{tts_style}\n\n" if tts_style else ""
    resp = _gemini.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=f"{style_prefix}Text to read (Hebrew):\n\n{text}",
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
        if part.inline_data:
            wav = _pcm_to_wav(part.inline_data.data)
            return f"data:audio/wav;base64,{base64.b64encode(wav).decode()}"
    raise RuntimeError("TTS returned no audio")
