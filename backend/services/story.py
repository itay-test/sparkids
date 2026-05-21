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
    "elsa":    {"voice": "Kore",    "persona": "You are a graceful ice queen with a warm heart. Tell the story magically with wonder and sparkle."},
    "grandma": {"voice": "Aoede",   "persona": "You are a sweet grandma. Speak slowly and warmly. Add 'יקירי' and 'מאמי' occasionally."},
    "grandpa": {"voice": "Charon",  "persona": "You are a funny grandpa full of wisdom and humor. Add old sayings. Speak slowly and warmly."},
    "baby":    {"voice": "Puck",    "persona": "You are a very young child telling a story. Use simple cute words, be adorable and funny."},
    "robot":   {"voice": "Zephyr",  "persona": "You are a funny robot. Add BEEP BOOP between sentences. Use robotic but warm language."},
    "dragon":  {"voice": "Fenrir",  "persona": "You are a friendly dramatic dragon. Add [ROAR!] occasionally but stay warm and funny."},
    "wizard":  {"voice": "Schedar", "persona": "You are a wise funny wizard. Add magic words like אברקדברא. Be mysterious but loving."},
    "lion":    {"voice": "Orus",    "persona": "You are a royal lion king. Be majestic and brave but gentle and loving."},
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
    """Generate one scene image, return base64 data URL."""
    prompt_resp = _gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"Write a vivid, colorful image-generation prompt for this children's story scene (max 30 words, English only, no copyrighted names): {scene_desc}"
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
    """Generate background instrumental with Lyria, return base64 data URL."""
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


def generate_story(idea: str, character_id: str, melody_mood: str = None, include_video: bool = False) -> dict:
    char = CHARACTERS.get(character_id, CHARACTERS["grandma"])

    # 1. Generate story split into scenes
    story_resp = _gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            f"{char['persona']}\n\n"
            f"Write a SHORT funny Hebrew bedtime story about: '{idea}'.\n"
            "Format as exactly 4 scenes separated by '---SCENE---'.\n"
            "Each scene: 2-3 sentences. Total: 150-200 words.\n"
            "Rules: Hebrew only, funny and warm, ends with happy sleep, no copyrighted names.\n"
            "Return ONLY the story with scene separators, no title."
        )
    )
    full_text = story_resp.text.strip()
    scenes = [s.strip() for s in full_text.split("---SCENE---") if s.strip()]
    story_text = " ".join(scenes)

    print(f"[story] char={character_id} scenes={len(scenes)} mood={melody_mood} video={include_video}")

    # 2. Run TTS + images in parallel, melody separately after (API rate limits)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        tts_future  = ex.submit(_generate_tts, story_text, char["voice"])
        img_futures = [ex.submit(_generate_scene_image, s) for s in scenes] if include_video else []
        audio_url    = tts_future.result()
        scene_images = [f.result() for f in img_futures]

    # melody after to avoid concurrent Lyria conflicts
    melody_url = None
    if melody_mood:
        try:
            melody_url = _generate_melody(melody_mood)
            print(f"[story] melody generated: {len(melody_url)} chars")
        except Exception as e:
            print(f"[story] melody failed: {e}")

    return {
        "story_text":    story_text,
        "scenes":        scenes,
        "scene_images":  [img for img in scene_images if img],
        "audio_url":     audio_url,
        "melody_url":    melody_url,
        "character_id":  character_id,
        "voice_used":    char["voice"],
    }


def _generate_tts(text: str, voice_name: str) -> str:
    resp = _gemini.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=f"Read this Hebrew children's bedtime story expressively and warmly:\n\n{text}",
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
