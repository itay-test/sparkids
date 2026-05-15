from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai import make_kid_prompt, generate_image

router = APIRouter()


class PaintRequest(BaseModel):
    idea: str
    kid_name: str


class PaintResponse(BaseModel):
    image_url: str
    prompt_used: str


@router.post("/", response_model=PaintResponse)
async def paint(req: PaintRequest):
    if len(req.idea.strip()) < 3:
        raise HTTPException(400, "Tell me more about what you want to paint!")
    prompt = make_kid_prompt(req.idea)
    image_url = generate_image(prompt)
    return PaintResponse(image_url=image_url, prompt_used=prompt)
