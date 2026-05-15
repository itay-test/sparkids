from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import paint, share

app = FastAPI(title="Sparkids API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(paint.router, prefix="/paint", tags=["paint"])
app.include_router(share.router, prefix="/share", tags=["share"])


@app.get("/health")
def health():
    return {"status": "ok"}
