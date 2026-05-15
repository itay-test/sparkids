import uuid
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# In-memory store — replace with DB (e.g. DynamoDB / Supabase) in production
_gallery: dict[str, dict] = {}


class ShareRequest(BaseModel):
    kid_name: str
    image_url: str
    prompt_used: str


class ShareResponse(BaseModel):
    share_id: str
    share_url: str


@router.post("/", response_model=ShareResponse)
def create_share(req: ShareRequest):
    share_id = str(uuid.uuid4())[:8]
    _gallery[share_id] = req.model_dump()
    return ShareResponse(
        share_id=share_id,
        share_url=f"http://localhost:5173/gallery/{share_id}",
    )


@router.get("/{share_id}")
def get_share(share_id: str):
    if share_id not in _gallery:
        return {"error": "Not found"}
    return _gallery[share_id]
