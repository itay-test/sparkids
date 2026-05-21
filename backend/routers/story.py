from fastapi import APIRouter
from pydantic import BaseModel
from services.story import generate_story

router = APIRouter()


class StoryRequest(BaseModel):
    idea: str
    kid_name: str
    character_id: str


@router.post("/")
def create_story(req: StoryRequest):
    return generate_story(req.idea, req.character_id)
