import json
import base64
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.voice import clone_voice, sing_with_voice

router = APIRouter()

# persist voice ids to disk so they survive restarts
VOICE_FILE = Path(__file__).parent.parent / "data" / "voices.json"
VOICE_FILE.parent.mkdir(exist_ok=True)

def _load() -> dict:
    if VOICE_FILE.exists():
        return json.loads(VOICE_FILE.read_text())
    return {}

def _save(data: dict):
    VOICE_FILE.write_text(json.dumps(data, indent=2))

def get_voice_id(kid_name: str):
    return _load().get(kid_name)


class CloneRequest(BaseModel):
    audio_b64: str
    kid_name: str


@router.post("/clone")
def clone(req: CloneRequest):
    try:
        audio_bytes = base64.b64decode(req.audio_b64)
        voice_id = clone_voice(audio_bytes, name=req.kid_name)
        data = _load()
        data[req.kid_name] = voice_id
        _save(data)
        return {"voice_id": voice_id, "status": "cloned"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/status/{kid_name}")
def status(kid_name: str):
    voice_id = get_voice_id(kid_name)
    return {"has_voice": bool(voice_id), "voice_id": voice_id}


@router.delete("/reset/{kid_name}")
def reset_voice(kid_name: str):
    data = _load()
    data.pop(kid_name, None)
    _save(data)
    return {"status": "cleared"}
