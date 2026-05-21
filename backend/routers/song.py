from fastapi import APIRouter
from pydantic import BaseModel
from services.music import generate_song
from routers.voice import get_voice_id

router = APIRouter()


class SongRequest(BaseModel):
    idea: str
    kid_name: str


@router.post("/")
def create_song(req: SongRequest):
    voice_id = get_voice_id(req.kid_name)
    print(f"[song] kid={req.kid_name} voice_id={voice_id}")
    return generate_song(req.idea, voice_id=voice_id)
