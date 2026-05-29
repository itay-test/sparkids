import { useEffect, useRef, useState } from "react";
import { Play, Pause, Sparkles, Film, Mic, Wand2, Share2 } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const IMPROVE_MSGS = ["כותבת מחדש...","מוסיפה הרפתקאות...","שוזרת מילים...","כמעט מוכן..."];

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

export default function StoryPlayer({ storyText, scenes, sceneImages, audioUrl, melodyUrl, characterId, onReset, onImproved, onShare }) {
  const narrationRef = useRef(null);
  const melodyRef    = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [wordIdx, setWordIdx]   = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [viewMode, setViewMode] = useState(sceneImages?.length > 0 ? "video" : "text");
  const [improving, setImproving]   = useState(false);
  const [listening, setListening]   = useState(false);
  const [liveText, setLiveText]     = useState("");
  const [msgIdx, setMsgIdx]         = useState(0);
  const recognitionRef = useRef(null);
  const collectedRef   = useRef("");

  const char    = CHAR_INFO[characterId] || CHAR_INFO.grandma;
  const words   = storyText?.split(/\s+/) || [];
  const hasVideo  = sceneImages?.length > 0;
  const hasMelody = !!melodyUrl;

  useEffect(() => {
    const a = narrationRef.current;
    if (!a) return;
    a.onloadedmetadata = () => {};
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

  useEffect(() => {
    if (!improving) return;
    setMsgIdx(0);
    const t = setInterval(() => setMsgIdx(i => (i + 1) % IMPROVE_MSGS.length), 1600);
    return () => clearInterval(t);
  }, [improving]);

  useEffect(() => {
    if (!listening) return;
    const stop = () => stopFeedback();
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => { window.removeEventListener("mouseup", stop); window.removeEventListener("touchend", stop); };
  }, [listening]);

  function startFeedback() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening || improving) return;
    collectedRef.current = ""; setLiveText("");
    const r = new SR();
    r.lang = "he-IL"; r.interimResults = true; r.continuous = true;
    r.onresult = (e) => {
      let text = "";
      for (const res of e.results) text += res[0].transcript;
      collectedRef.current = text; setLiveText(text);
    };
    r.onerror = () => {};
    recognitionRef.current = r;
    r.start(); setListening(true);
  }

  function stopFeedback() {
    recognitionRef.current?.stop(); setListening(false);
    setTimeout(async () => {
      const text = collectedRef.current.trim();
      setLiveText(""); collectedRef.current = "";
      if (!text || !onImproved) return;
      setImproving(true);
      try {
        const { data } = await axios.post(`${API}/story/improve`, {
          feedback: text,
          previous_story_text: storyText,
          character_id: characterId,
        });
        onImproved(data);
      } finally { setImproving(false); }
    }, 400);
  }

  function toggle() {
    const a = narrationRef.current;
    const m = melodyRef.current;
    if (!a) return;
    if (playing) { a.pause(); m?.pause(); setPlaying(false); }
    else         { a.play();  m?.play();  setPlaying(true);  }
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-pop">

      {/* View toggle — only if we have video */}
      {hasVideo && (
        <div className="card p-1.5 flex gap-1">
          {[["video", "🎬", "סרטון"], ["text", "📖", "טקסט"]].map(([m, icon, label]) => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`flex-1 py-3 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                viewMode === m ? "bg-purple-600 text-white shadow" : "text-gray-400"
              }`}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}

      {/* Video mode */}
      {viewMode === "video" && hasVideo && (
        <div className="card overflow-hidden relative">
          <img
            src={sceneImages[sceneIdx]}
            alt={`scene ${sceneIdx + 1}`}
            className="w-full object-cover transition-opacity duration-700"
            key={sceneIdx}
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {sceneImages.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${i === sceneIdx ? "bg-white scale-125" : "bg-white/40"}`}/>
            ))}
          </div>
          <div className={`absolute top-3 right-3 bg-gradient-to-br ${char.bg} rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-lg`}>
            <span className="text-2xl">{char.emoji}</span>
            <span className="text-white font-black text-sm">{char.label}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
            <div className="h-full bg-white/80 transition-all duration-300" style={{ width: `${progress*100}%` }}/>
          </div>
        </div>
      )}

      {/* Text mode — character header */}
      {viewMode === "text" && (
        <div className={`card bg-gradient-to-br ${char.bg} py-6 flex flex-col items-center gap-3`}>
          <span className="text-7xl animate-float">{char.emoji}</span>
          <p className="font-black text-white text-xl">{char.label} מספרת</p>
          <div className="w-full px-4">
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white/90 rounded-full transition-all duration-300" style={{ width: `${progress*100}%` }}/>
            </div>
          </div>
        </div>
      )}

      {/* Single play/pause button */}
      <button onClick={toggle}
        className="w-full py-5 rounded-3xl shimmer-btn flex items-center justify-center shadow-xl active:scale-95 transition-all gap-3">
        {playing
          ? <><Pause size={34} color="white" strokeWidth={2}/><span className="text-white font-black text-xl">עצרי</span></>
          : <><Play  size={34} color="white" strokeWidth={2} fill="white"/><span className="text-white font-black text-xl">נגני</span></>}
      </button>

      {/* Story text with word highlight */}
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

      {/* Scene text in video mode */}
      {viewMode === "video" && scenes?.[sceneIdx] && (
        <div className="card px-5 py-3 border-2 border-purple-100" dir="rtl">
          <p className="text-purple-700 font-bold leading-relaxed">{scenes[sceneIdx]}</p>
        </div>
      )}

      {/* Live transcript while listening */}
      {listening && liveText && (
        <div className="card px-5 py-3 text-center border-2 border-red-100 animate-pop">
          <p className="text-purple-700 font-bold text-lg leading-snug">{liveText}</p>
        </div>
      )}

      {/* Improve story */}
      {onImproved && (
        <button
          onMouseDown={startFeedback}
          onTouchStart={(e) => { e.preventDefault(); startFeedback(); }}
          disabled={improving}
          className={`w-full py-5 rounded-3xl font-black text-xl transition-all select-none flex items-center gap-3 px-6
            ${improving ? "bg-purple-100 text-purple-400 cursor-not-allowed justify-center" :
              listening  ? "bg-red-500 text-white shadow-lg justify-start" :
              "shimmer-btn text-white shadow-lg hover:opacity-90 active:scale-95 justify-center"}`}
        >
          <Wand2 size={26} strokeWidth={2} className="shrink-0"/>
          <span>{improving ? IMPROVE_MSGS[msgIdx] : listening ? (liveText || "מקשיבה...") : "שני את הסיפור"}</span>
        </button>
      )}

      {/* Share + New story */}
      <div className={`grid gap-3 ${onShare ? "grid-cols-2" : "grid-cols-1"}`}>
        {onShare && (
          <button onClick={onShare}
            className="card py-5 flex items-center justify-center gap-3 text-orange-500 font-black text-xl hover:shadow-lg active:scale-95 transition-all border-2 border-orange-100">
            <Share2 size={26} strokeWidth={2}/> תראי לאמא
          </button>
        )}
        <button onClick={onReset}
          className="card py-5 flex items-center justify-center gap-3 text-purple-600 font-black text-xl hover:shadow-lg active:scale-95 transition-all border-2 border-purple-100">
          <Sparkles size={26} strokeWidth={2}/> סיפור חדש
        </button>
      </div>

      <audio ref={narrationRef} src={audioUrl} preload="auto"/>
      {melodyUrl && <audio ref={melodyRef} src={melodyUrl} preload="auto"/>}
    </div>
  );
}
