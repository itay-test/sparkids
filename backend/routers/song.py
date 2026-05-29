import base64
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.music import generate_song, improve_song
from services.voice import analyze_voice

router = APIRouter()


class SongRequest(BaseModel):
    idea: str
    kid_name: str
    voice_audio_b64: Optional[str] = None
    instruments: list = []
    preferences: Optional[str] = None
    companion_name: Optional[str] = None
    companion_likes: Optional[str] = None


class SongImproveRequest(BaseModel):
    feedback: str
    previous_lyrics: str
    previous_style: str = "upbeat happy children's pop, 120bpm, major key"
    voice_type: str = "default"
    instruments: list = []
    companion_name: Optional[str] = None


@router.post("/")
def create_song(req: SongRequest):
    voice_type = "default"
    if req.voice_audio_b64:
        try:
            audio_bytes = base64.b64decode(req.voice_audio_b64)
            voice_type = analyze_voice(audio_bytes)
            print(f"[song] voice_type={voice_type}")
        except Exception as e:
            print(f"[song] voice analysis failed: {e}")
    return generate_song(
        req.idea,
        voice_type=voice_type,
        instruments=req.instruments,
        preferences=req.preferences or "",
        companion_name=req.companion_name or "",
        companion_likes=req.companion_likes or "",
    )


@router.post("/improve")
def improve_song_endpoint(req: SongImproveRequest):
    return improve_song(
        feedback=req.feedback,
        previous_lyrics=req.previous_lyrics,
        previous_style=req.previous_style,
        voice_type=req.voice_type,
        instruments=req.instruments,
        companion_name=req.companion_name or "",
    )
