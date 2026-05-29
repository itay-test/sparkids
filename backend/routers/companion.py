from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.ai import make_companion_portrait_prompt, generate_image

router = APIRouter()


class CompanionImageRequest(BaseModel):
    description: str
    companion_type: Optional[str] = ""


@router.post("/create-image")
def create_companion_image(req: CompanionImageRequest):
    prompt = make_companion_portrait_prompt(req.description, req.companion_type)
    image_url = generate_image(prompt)
    print(f"[companion] type={req.companion_type} desc={req.description[:40]}")
    return {"image_url": image_url, "prompt_used": prompt}
