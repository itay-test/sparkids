import { useEffect, useRef, useState } from "react";
import { Play, Pause, Sparkles, Music2, Mic, Wand2 } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const IMPROVE_MSGS = ["יוצר שיר חדש...","מוסיף קסם...","מערבב צלילים...","כמעט מוכן..."];

export default function SongPlayer({ instrumentalUrl, lyrics, style, voiceType, instruments,
  companionName, onReset, onImproved, onShare }) {
  const audioRef       = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [improving, setImproving] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText]   = useState("");
  const [msgIdx, setMsgIdx]       = useState(0);
  const recognitionRef = useRef(null);
  const collectedRef   = useRef("");

  // Parse lyrics into lines for karaoke display
  const lyricLines = (lyrics || "").split("\n").filter(l => l.trim());
  const activeLine = lyricLines.length > 0
    ? Math.min(Math.floor(progress * lyricLines.length), lyricLines.length - 1)
    : -1;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.9;
    a.ontimeupdate = () => setProgress(a.currentTime / (a.duration || 1));
    a.onended = () => setPlaying(false);
    a.play().then(() => setPlaying(true)).catch(() => {});
  }, [instrumentalUrl]);

  useEffect(() => {
    if (!improving) return;
    setMsgIdx(0);
    const t = setInterval(() => setMsgIdx(i => (i + 1) % IMPROVE_MSGS.length), 1600);
    return () => clearInterval(t);
  }, [improving]);

  useEffect(() => {
    if (!listening) return;
    const stop = () => stopFeedback();
    window.addEventListener("mouseup",  stop);
    window.addEventListener("touchend", stop);
    return () => { window.removeEventListener("mouseup", stop); window.removeEventListener("touchend", stop); };
  }, [listening]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play();  setPlaying(true);  }
  }

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
        const { data } = await axios.post(`${API}/song/improve`, {
          feedback: text,
          previous_lyrics: lyrics,
          previous_style: style || "upbeat happy children's pop, 120bpm, major key",
          voice_type: voiceType || "default",
          instruments: instruments || [],
          companion_name: companionName || "",
        });
        onImproved(data);
      } finally { setImproving(false); }
    }, 400);
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-pop">

      {/* Album art + karaoke display */}
      <div className="card overflow-hidden relative"
        style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)" }}>

        {/* Karaoke badge */}
        <div className="absolute top-3 right-3 bg-white/20 rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
          <Mic size={14} color="white"/>
          <span className="text-white font-black text-xs">שיר קריוקי!</span>
        </div>

        {/* Animated bars when playing */}
        <div className="pt-8 pb-4 flex justify-center items-end gap-1 h-16">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="w-2 rounded-full bg-white/60"
              style={{
                height: playing ? `${25 + Math.sin(Date.now()/200 + i) * 15}%` : "20%",
                animation: playing ? `bar-dance ${0.4 + i * 0.1}s ease-in-out infinite alternate` : "none",
                animationDelay: `${i * 0.07}s`,
                minHeight: "20%",
              }}
            />
          ))}
        </div>

        {/* Karaoke lyrics */}
        {lyricLines.length > 0 && (
          <div className="px-5 pb-6 flex flex-col gap-2">
            {lyricLines.map((line, i) => (
              <p key={i} className={`text-center font-black transition-all duration-300 leading-snug
                ${i === activeLine
                  ? "text-white text-xl scale-105"
                  : i < activeLine
                  ? "text-white/40 text-base"
                  : "text-white/70 text-base"}`}
              >
                {i === activeLine && playing ? "🎤 " : ""}{line}
              </p>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
          <div className="h-full bg-white/80 transition-all duration-300 rounded-full"
            style={{ width: `${progress * 100}%` }}/>
        </div>
      </div>

      {/* Play / pause */}
      <button onClick={toggle}
        className="w-full py-5 rounded-3xl shimmer-btn flex items-center justify-center shadow-xl active:scale-95 transition-all gap-3">
        {playing
          ? <><Pause size={34} color="white" strokeWidth={2}/><span className="text-white font-black text-xl">עצור</span></>
          : <><Play  size={34} color="white" strokeWidth={2} fill="white"/><span className="text-white font-black text-xl">נגן</span></>}
      </button>

      {/* Encourage singing */}
      {playing && (
        <div className="card px-5 py-3 flex items-center justify-center gap-3 border-2 border-purple-100 animate-pop">
          <span className="text-2xl animate-bounce">🎤</span>
          <span className="text-purple-600 font-black text-lg">שיר/י איתנו!</span>
          <span className="text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>⭐</span>
        </div>
      )}

      {/* Feedback while listening */}
      {listening && liveText && (
        <div className="card px-5 py-3 text-center border-2 border-red-100 animate-pop">
          <p className="text-purple-700 font-bold text-lg">{liveText}</p>
        </div>
      )}

      {/* Improve button */}
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
          <span>{improving ? IMPROVE_MSGS[msgIdx] : listening ? (liveText || "מקשיב/ה...") : "שנה/י את השיר"}</span>
        </button>
      )}

      {/* Action row */}
      <div className={`grid gap-3 ${onShare ? "grid-cols-2" : "grid-cols-1"}`}>
        {onShare && (
          <button onClick={onShare}
            className="card py-5 flex flex-col items-center gap-2 hover:shadow-lg active:scale-95 transition-all border-2 border-orange-100">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
              <span className="text-2xl">📤</span>
            </div>
            <span className="text-sm font-black text-orange-500">תראה/י לאמא</span>
          </button>
        )}

        <button onClick={onReset}
          className="card py-5 flex flex-col items-center gap-2 hover:shadow-lg active:scale-95 transition-all border-2 border-purple-100">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Sparkles size={24} className="text-purple-600" strokeWidth={2}/>
          </div>
          <span className="text-sm font-black text-purple-600">שיר חדש</span>
        </button>
      </div>

      <audio ref={audioRef} src={instrumentalUrl} preload="auto"/>
    </div>
  );
}
