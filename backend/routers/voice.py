import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.voice import clone_voice, get_voices, sing_with_voice

router = APIRouter()

# store voice_id in memory (replace with DB for prod)
_voice_store: dict[str, str] = {}  # kid_name → voice_id


class CloneRequest(BaseModel):
    audio_b64: str   # base64 webm audio
    kid_name: str


class SingRequest(BaseModel):
    lyrics: str
    kid_name: str


@router.post("/clone")
def clone(req: CloneRequest):
    try:
        audio_bytes = base64.b64decode(req.audio_b64)
        voice_id = clone_voice(audio_bytes, name=req.kid_name)
        _voice_store[req.kid_name] = voice_id
        return {"voice_id": voice_id, "status": "cloned"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/status/{kid_name}")
def status(kid_name: str):
    voice_id = _voice_store.get(kid_name)
    return {"has_voice": bool(voice_id), "voice_id": voice_id}


@router.post("/sing")
def sing(req: SingRequest):
    voice_id = _voice_store.get(req.kid_name)
    if not voice_id:
        raise HTTPException(404, "No cloned voice found — record first")
    audio_url = sing_with_voice(req.lyrics, voice_id)
    return {"audio_url": audio_url}


@router.delete("/reset/{kid_name}")
def reset_voice(kid_name: str):
    _voice_store.pop(kid_name, None)
    return {"status": "cleared"}
