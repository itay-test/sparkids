import os
import base64
import struct
import pathlib
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
_gemini = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

# voice map: gender+age → best Gemini TTS voice
VOICE_MAP = {
    "man":          "Charon",   # deep, masculine
    "woman":        "Kore",     # warm, feminine
    "girl":         "Aoede",    # bright, young female
    "boy":          "Puck",     # energetic, young male
    "default":      "Zephyr",   # neutral, clear
}


def analyze_voice(audio_bytes: bytes) -> str:
    """Use Gemini to detect voice type from audio sample. Returns voice_name."""
    try:
        response = _gemini.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part(inline_data=types.Blob(data=audio_bytes, mime_type="audio/webm")),
                types.Part(text=(
                    "Listen to this voice recording. "
                    "Answer with ONE word only — the best description: man, woman, girl, or boy. "
                    "Base it only on the voice characteristics (pitch, tone)."
                )),
            ]
        )
        label = response.text.strip().lower()
        print(f"[voice] detected: {label}")
        for key in VOICE_MAP:
            if key in label:
                return VOICE_MAP[key]
    except Exception as e:
        print(f"[voice] analysis failed: {e}")
    return VOICE_MAP["default"]


def pcm_to_wav(pcm_bytes: bytes, sample_rate: int = 24000, channels: int = 1, bit_depth: int = 16) -> bytes:
    """Wrap raw PCM in a WAV header."""
    byte_rate = sample_rate * channels * bit_depth // 8
    block_align = channels * bit_depth // 8
    data_size = len(pcm_bytes)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + data_size, b"WAVE",
        b"fmt ", 16, 1, channels, sample_rate, byte_rate, block_align, bit_depth,
        b"data", data_size,
    )
    return header + pcm_bytes


def sing_with_voice(text: str, voice_name: str) -> str:
    """Generate TTS with Gemini using a matched voice. Returns base64 data URL."""
    response = _gemini.models.generate_content(
        model="gemini-2.5-flash-preview-tts",
        contents=f"Read this expressively and warmly as a children's song: {text}",
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                )
            )
        )
    )
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            raw = part.inline_data.data
            wav = pcm_to_wav(raw)
            b64 = base64.b64encode(wav).decode("utf-8")
            return f"data:audio/wav;base64,{b64}"
    raise RuntimeError("Gemini TTS returned no audio")
