import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Sparkles, Film, Mic } from "lucide-react";

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

export default function StoryPlayer({ storyText, scenes, sceneImages, audioUrl, melodyUrl, characterId, onReset }) {
  const narrationRef = useRef(null);
  const melodyRef    = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [duration, setDuration]   = useState(0);
  const [wordIdx, setWordIdx]     = useState(0);
  const [sceneIdx, setSceneIdx]   = useState(0);
  const [viewMode, setViewMode]   = useState(sceneImages?.length > 0 ? "video" : "text");

  const char  = CHAR_INFO[characterId] || CHAR_INFO.grandma;
  const words = storyText?.split(/\s+/) || [];
  const hasVideo   = sceneImages?.length > 0;
  const hasMelody  = !!melodyUrl;

  useEffect(() => {
    const a = narrationRef.current;
    if (!a) return;
    a.onloadedmetadata = () => setDuration(a.duration);
    a.ontimeupdate = () => {
      const pct = a.currentTime / (a.duration || 1);
      setProgress(pct);
      setWordIdx(Math.floor(pct * words.length));
      setSceneIdx(Math.min(Math.floor(pct * (sceneImages?.length || 1)), (sceneImages?.length || 1) - 1));
    };
    a.onended = () => { setPlaying(false); };
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, [audioUrl]);

  useEffect(() => {
    const m = melodyRef.current;
    if (!m || !melodyUrl) return;
    m.volume = 0.25;
    m.loop = true;
  }, [melodyUrl]);

  function toggle() {
    const a = narrationRef.current;
    const m = melodyRef.current;
    if (!a) return;
    if (playing) {
      a.pause(); m?.pause(); setPlaying(false);
    } else {
      a.play(); m?.play(); setPlaying(true);
    }
  }

  function restart() {
    const a = narrationRef.current;
    const m = melodyRef.current;
    if (!a) return;
    a.currentTime = 0; if (m) m.currentTime = 0;
    setWordIdx(0); setSceneIdx(0);
    a.play(); m?.play(); setPlaying(true);
  }

  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col gap-4 w-full animate-pop">

      {/* View toggle */}
      {hasVideo && (
        <div className="card p-1.5 flex gap-1">
          {[["video", Film, "📽️ וידאו"], ["text", Mic, "📖 טקסט"]].map(([m, Icon, label]) => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`flex-1 py-2.5 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 ${
                viewMode === m ? "bg-purple-600 text-white shadow" : "text-gray-400"
              }`}>
              <Icon size={18} strokeWidth={2}/> {label}
            </button>
          ))}
        </div>
      )}

      {/* Video mode — scene image slideshow */}
      {viewMode === "video" && hasVideo && (
        <div className="card overflow-hidden relative">
          <img
            src={sceneImages[sceneIdx]}
            alt={`scene ${sceneIdx + 1}`}
            className="w-full object-cover transition-opacity duration-700"
            key={sceneIdx}
          />
          {/* Scene indicator dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {sceneImages.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === sceneIdx ? "bg-white scale-125" : "bg-white/40"}`}/>
            ))}
          </div>
          {/* Character badge */}
          <div className={`absolute top-3 right-3 bg-gradient-to-br ${char.bg} rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-lg`}>
            <span className="text-2xl">{char.emoji}</span>
            <span className="text-white font-black text-sm">{char.label}</span>
          </div>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
            <div className="h-full bg-white/80 transition-all duration-300" style={{width:`${progress*100}%`}}/>
          </div>
        </div>
      )}

      {/* Text mode — character header + highlighted words */}
      {viewMode === "text" && (
        <div className={`card bg-gradient-to-br ${char.bg} py-6 flex flex-col items-center gap-3`}>
          <span className="text-7xl animate-float">{char.emoji}</span>
          <p className="font-black text-white text-xl">{char.label} מספרת</p>
          <div className="w-full px-4">
            <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white/90 rounded-full transition-all duration-300" style={{width:`${progress*100}%`}}/>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="card px-6 py-4 flex items-center justify-between">
        <button onClick={restart}
          className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 hover:bg-purple-200 active:scale-95 transition-all">
          <RotateCcw size={22} strokeWidth={2}/>
        </button>
        <button onClick={toggle}
          className="w-20 h-20 rounded-full shimmer-btn flex items-center justify-center shadow-xl active:scale-95 transition-all">
          {playing
            ? <Pause size={34} color="white" strokeWidth={2}/>
            : <Play  size={34} color="white" strokeWidth={2} fill="white"/>}
        </button>
        <span className="text-purple-400 font-bold text-sm w-12 text-center">
          {hasMelody ? "🎵" : ""} {mins}:{secs}
        </span>
      </div>

      {/* Story text with word highlight (always visible in text mode) */}
      {viewMode === "text" && (
        <div className="card px-5 py-4 border-2 border-purple-100 max-h-52 overflow-y-auto" dir="rtl">
          <p className="text-purple-800 font-bold leading-loose text-lg">
            {words.map((word, i) => (
              <span key={i} className={`transition-all duration-100 ${
                i === wordIdx && playing ? "bg-yellow-200 rounded px-0.5 text-purple-900"
                : i < wordIdx ? "text-purple-300" : "text-purple-800"
              }`}>{word}{" "}</span>
            ))}
          </p>
        </div>
      )}

      {/* Scene text (in video mode show current scene) */}
      {viewMode === "video" && scenes?.[sceneIdx] && (
        <div className="card px-5 py-3 border-2 border-purple-100" dir="rtl">
          <p className="text-purple-700 font-bold leading-relaxed">{scenes[sceneIdx]}</p>
        </div>
      )}

      {/* New story */}
      <button onClick={onReset}
        className="card py-4 flex items-center justify-center gap-3 text-purple-600 font-black hover:shadow-lg active:scale-95 transition-all border-2 border-purple-100">
        <Sparkles size={22} strokeWidth={2}/> סיפור חדש
      </button>

      <audio ref={narrationRef} src={audioUrl} preload="auto"/>
      {melodyUrl && <audio ref={melodyRef} src={melodyUrl} preload="auto"/>}
    </div>
  );
}
