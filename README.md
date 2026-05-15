# 🌟 Sparkids — AI Painting for Kids

Carmel speaks → AI paints → share with family in seconds.

## How it works
1. Tap the 🎤 mic button
2. Say what you want to paint (e.g. "a rainbow unicorn in space")
3. Watch the magic happen ✨
4. Save or share the link with parents & friends

## Run locally

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # fill in your API keys
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — works best in Chrome.

## Stack
- **Voice**: Browser Web Speech API (free, no key needed)
- **AI Prompt**: Claude Haiku (fast + cheap)
- **Image**: DALL-E 3
- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite + Tailwind
