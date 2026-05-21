import os
import base64
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from dotenv import load_dotenv

load_dotenv()

_eleven = None

def _client():
    global _eleven
    if _eleven is None:
        key = os.environ.get("ELEVENLABS_API_KEY")
        if not key:
            raise RuntimeError("ELEVENLABS_API_KEY not set")
        _eleven = ElevenLabs(api_key=key)
    return _eleven


def clone_voice(audio_bytes: bytes, name: str = "Carmel") -> str:
    """Upload a voice sample and return the cloned voice_id."""
    client = _client()
    voice = client.voices.ivc.create(
        name=name,
        files=[("carmel_voice.webm", audio_bytes, "audio/webm")],
        description="Carmel's voice for Sparkids",
    )
    print(f"[clone_voice] created voice_id={voice.voice_id}")
    return voice.voice_id


def get_voices() -> list:
    """List all cloned voices."""
    client = _client()
    return [{"id": v.voice_id, "name": v.name}
            for v in client.voices.get_all().voices
            if v.category == "cloned"]


def sing_with_voice(lyrics: str, voice_id: str) -> str:
    """Generate speech/song with cloned voice, return base64 data URL."""
    client = _client()
    audio = client.text_to_speech.convert(
        voice_id=voice_id,
        text=lyrics,
        model_id="eleven_multilingual_v2",
        voice_settings=VoiceSettings(
            stability=0.4,
            similarity_boost=0.85,
            style=0.3,
            use_speaker_boost=True,
        ),
    )
    # audio is a generator — collect bytes
    chunks = b"".join(audio)
    b64 = base64.b64encode(chunks).decode("utf-8")
    return f"data:audio/mpeg;base64,{b64}"
