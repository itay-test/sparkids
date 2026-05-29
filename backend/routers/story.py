from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.story import generate_story, improve_story

router = APIRouter()


class StoryRequest(BaseModel):
    idea: str
    kid_name: str
    character_id: str
    melody_mood: Optional[str] = None
    include_video: bool = False
    preferences: Optional[str] = None
    companion_name: Optional[str] = None
    companion_likes: Optional[str] = None


class StoryImproveRequest(BaseModel):
    feedback: str
    previous_story_text: str
    character_id: str


@router.post("/")
def create_story(req: StoryRequest):
    return generate_story(
        idea=req.idea,
        character_id=req.character_id,
        melody_mood=req.melody_mood,
        include_video=req.include_video,
        preferences=req.preferences or "",
        companion_name=req.companion_name or "",
        companion_likes=req.companion_likes or "",
    )


@router.post("/improve")
def improve_story_endpoint(req: StoryImproveRequest):
    return improve_story(
        feedback=req.feedback,
        previous_story_text=req.previous_story_text,
        character_id=req.character_id,
    )
