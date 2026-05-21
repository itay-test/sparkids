import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import paint, share, song

app = FastAPI(title="Sparkids API")

origins = ["http://localhost:5173"]
if frontend := os.getenv("FRONTEND_URL"):
    origins.append(frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(paint.router, prefix="/paint", tags=["paint"])
app.include_router(share.router, prefix="/share", tags=["share"])
app.include_router(song.router, prefix="/song", tags=["song"])


@app.get("/health")
def health():
    return {"status": "ok"}
