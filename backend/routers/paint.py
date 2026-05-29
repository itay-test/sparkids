from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.ai import make_kid_prompt, make_improve_prompt, generate_image, generate_image_from_photo

router = APIRouter()


class PaintRequest(BaseModel):
    idea: str
    kid_name: str
    photo: Optional[str] = None
    preferences: Optional[str] = None
    companion_name: Optional[str] = None
    companion_desc: Optional[str] = None


class ImproveRequest(BaseModel):
    feedback: str
    previous_prompt: str
    kid_name: str
    current_image: Optional[str] = None


class PaintResponse(BaseModel):
    image_url: str
    prompt_used: str


@router.post("/", response_model=PaintResponse)
def paint(req: PaintRequest):
    if len(req.idea.strip()) < 1:
        raise HTTPException(400, "תגידי לי מה לצייר!")
    prompt = make_kid_prompt(
        req.idea,
        has_photo=bool(req.photo),
        preferences=req.preferences or "",
        companion_name=req.companion_name or "",
        companion_desc=req.companion_desc or "",
    )
    if req.photo:
        image_url = generate_image_from_photo(prompt, req.photo)
    else:
        image_url = generate_image(prompt)
    return PaintResponse(image_url=image_url, prompt_used=prompt)


@router.post("/improve", response_model=PaintResponse)
def improve(req: ImproveRequest):
    prompt = make_improve_prompt(req.feedback, req.previous_prompt)
    if req.current_image:
        image_url = generate_image_from_photo(prompt, req.current_image)
    else:
        image_url = generate_image(prompt)
    return PaintResponse(image_url=image_url, prompt_used=prompt)
