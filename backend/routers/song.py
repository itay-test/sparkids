import base64
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.music import generate_song
from services.voice import clone_voice

router = APIRouter()


class SongRequest(BaseModel):
    idea: str
    kid_name: str
    voice_audio_b64: Optional[str] = None  # webm audio from mic


@router.post("/")
def create_song(req: SongRequest):
    voice_id = None

    # clone voice from this request's audio if provided
    if req.voice_audio_b64:
        try:
            audio_bytes = base64.b64decode(req.voice_audio_b64)
            voice_id = clone_voice(audio_bytes, name=f"{req.kid_name}_auto")
            print(f"[song] cloned voice on-the-fly: {voice_id}")
        except Exception as e:
            print(f"[song] voice clone failed, using Lyria default: {e}")

    return generate_song(req.idea, voice_id=voice_id)
