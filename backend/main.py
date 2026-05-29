import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import paint, share, song, voice, story, companion, payment

app = FastAPI(title="Sparkids API")

origins = ["http://localhost:5173"]
for url in filter(None, [os.getenv("FRONTEND_URL"), os.getenv("ADDITIONAL_ORIGIN")]):
    origins.append(url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(paint.router, prefix="/paint", tags=["paint"])
app.include_router(share.router, prefix="/share", tags=["share"])
app.include_router(song.router, prefix="/song", tags=["song"])
app.include_router(voice.router, prefix="/voice", tags=["voice"])
app.include_router(story.router, prefix="/story", tags=["story"])
app.include_router(companion.router, prefix="/companion", tags=["companion"])
app.include_router(payment.router,  prefix="/payment",  tags=["payment"])


@app.get("/health")
def health():
    return {"status": "ok"}
