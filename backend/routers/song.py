import base64
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.music import generate_song
from services.voice import analyze_voice

router = APIRouter()


class SongRequest(BaseModel):
    idea: str
    kid_name: str
    voice_audio_b64: Optional[str] = None


@router.post("/")
def create_song(req: SongRequest):
    voice_type = "default"
    if req.voice_audio_b64:
        try:
            audio_bytes = base64.b64decode(req.voice_audio_b64)
            voice_type = analyze_voice(audio_bytes)
            print(f"[song] detected voice_type={voice_type}")
        except Exception as e:
            print(f"[song] voice analysis failed: {e}")
    return generate_song(req.idea, voice_type=voice_type)
