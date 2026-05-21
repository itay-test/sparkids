import base64
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.music import generate_song
from services.voice import analyze_voice, sing_with_voice, VOICE_MAP

router = APIRouter()


class SongRequest(BaseModel):
    idea: str
    kid_name: str
    voice_audio_b64: Optional[str] = None


@router.post("/")
def create_song(req: SongRequest):
    voice_name = VOICE_MAP["default"]

    if req.voice_audio_b64:
        try:
            audio_bytes = base64.b64decode(req.voice_audio_b64)
            voice_name = analyze_voice(audio_bytes)
            print(f"[song] matched voice: {voice_name}")
        except Exception as e:
            print(f"[song] voice analysis failed: {e}")

    return generate_song(req.idea, voice_name=voice_name)
