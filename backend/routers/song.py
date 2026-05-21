from fastapi import APIRouter
from pydantic import BaseModel
from services.music import generate_song

router = APIRouter()


class SongRequest(BaseModel):
    idea: str
    kid_name: str


class SongResponse(BaseModel):
    audio_url: str
    lyrics: str
    prompt_used: str


@router.post("/", response_model=SongResponse)
def create_song(req: SongRequest):
    result = generate_song(req.idea)
    return SongResponse(**result)
