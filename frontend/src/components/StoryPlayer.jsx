import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, BookOpen, Sparkles } from "lucide-react";

const CHAR_INFO = {
  elsa:    { emoji: "👸", label: "אלזה",   bg: "from-blue-400 to-cyan-300" },
  grandma: { emoji: "👵", label: "סבתא",   bg: "from-pink-400 to-rose-300" },
  grandpa: { emoji: "👴", label: "סבא",    bg: "from-amber-400 to-orange-300" },
  baby:    { emoji: "👶", label: "תינוק",  bg: "from-yellow-300 to-lime-300" },
  robot:   { emoji: "🤖", label: "רובוט",  bg: "from-slate-400 to-blue-300" },
  dragon:  { emoji: "🐉", label: "דרקון",  bg: "from-green-400 to-emerald-300" },
  wizard:  { emoji: "🧙", label: "קוסם",   bg: "from-purple-400 to-violet-300" },
  lion:    { emoji: "🦁", label: "אריה",   bg: "from-yellow-400 to-amber-300" },
};

export default function StoryPlayer({ storyText, audioUrl, characterId, onReset }) {
  const audioRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [wordIdx, setWordIdx]   = useState(0);

  const char = CHAR_INFO[characterId] || CHAR_INFO.grandma;
  const words = storyText?.split(/\s+/) || [];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.onloadedmetadata = () => setDuration(a.duration);
    a.ontimeupdate = () => {
      const pct = a.currentTime / (a.duration || 1);
      setProgress(pct);
      setWordIdx(Math.floor(pct * words.length));
    };
    a.onended = () => { setPlaying(false); setWordIdx(words.length - 1); };
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, [audioUrl]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play();  setPlaying(true); }
  }

  function restart() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0; setWordIdx(0);
    a.play(); setPlaying(true);
  }

  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col gap-4 w-full animate-pop">

      {/* Character header */}
      <div className={`card bg-gradient-to-br ${char.bg} py-8 flex flex-col items-center gap-3`}>
        <span className="text-8xl animate-float">{char.emoji}</span>
        <p className="font-black text-white text-2xl drop-shadow">{char.label} מספרת</p>

        {/* Progress bar */}
        <div className="w-full px-4">
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white/90 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}/>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-5">
          <button onClick={restart}
            className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center text-white hover:bg-white/50 active:scale-95 transition-all">
            <RotateCcw size={22} strokeWidth={2}/>
          </button>
          <button onClick={toggle}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl active:scale-95 transition-all">
            {playing
              ? <Pause size={34} className={`text-${char.bg.split('-')[1]}-500`} strokeWidth={2}/>
              : <Play  size={34} className={`text-${char.bg.split('-')[1]}-500`} strokeWidth={2} fill="currentColor"/>
            }
          </button>
          <span className="text-white/80 font-bold text-sm w-12">{mins}:{secs}</span>
        </div>
      </div>

      {/* Story text with word highlight */}
      <div className="card px-5 py-5 border-2 border-purple-100 max-h-64 overflow-y-auto" dir="rtl">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-purple-400" strokeWidth={2}/>
          <p className="text-purple-400 font-bold text-sm">הסיפור</p>
        </div>
        <p className="text-purple-800 font-bold leading-loose text-lg">
          {words.map((word, i) => (
            <span key={i}
              className={`transition-all duration-150 ${
                i === wordIdx && playing
                  ? "bg-yellow-200 rounded px-0.5 text-purple-900"
                  : i < wordIdx ? "text-purple-400" : "text-purple-800"
              }`}>
              {word}{" "}
            </span>
          ))}
        </p>
      </div>

      {/* New story */}
      <button onClick={onReset}
        className="card py-4 flex items-center justify-center gap-3 text-purple-600 font-black hover:shadow-lg active:scale-95 transition-all border-2 border-purple-100">
        <Sparkles size={22} strokeWidth={2}/>
        סיפור חדש
      </button>

      <audio ref={audioRef} src={audioUrl} preload="auto"/>
    </div>
  );
}
