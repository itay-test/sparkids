from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.story import generate_story

router = APIRouter()


class StoryRequest(BaseModel):
    idea: str
    kid_name: str
    character_id: str
    melody_mood: Optional[str] = None
    include_video: bool = False


@router.post("/")
def create_story(req: StoryRequest):
    return generate_story(
        idea=req.idea,
        character_id=req.character_id,
        melody_mood=req.melody_mood,
        include_video=req.include_video,
    )
