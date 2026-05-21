from fastapi import APIRouter
from pydantic import BaseModel
from services.music import generate_song
from routers.voice import _voice_store

router = APIRouter()


class SongRequest(BaseModel):
    idea: str
    kid_name: str


@router.post("/")
def create_song(req: SongRequest):
    voice_id = _voice_store.get(req.kid_name)
    result = generate_song(req.idea, voice_id=voice_id)
    return result
