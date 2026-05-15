import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ImageDisplay({ imageUrl, promptUsed, onShare, onReset, onImproved }) {
  const [improving, setImproving] = useState(false);
  const [listening, setListening]  = useState(false);
  const [liveText, setLiveText]    = useState("");
  const recognitionRef = useRef(null);
  const collectedRef   = useRef("");

  // stop on mouseup / touchend anywhere
  useEffect(() => {
    if (!listening) return;
    const stop = () => stopFeedback();
    window.addEventListener("mouseup",  stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mouseup",  stop);
      window.removeEventListener("touchend", stop);
    };
  }, [listening]);

  function startFeedback() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening || improving) return;
    collectedRef.current = "";
    setLiveText("");

    const r = new SR();
    r.lang = "he-IL";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (e) => {
      let text = "";
      for (const res of e.results) text += res[0].transcript;
      collectedRef.current = text;
      setLiveText(text);
    };
    r.onerror = () => {};

    recognitionRef.current = r;
    r.start();
    setListening(true);
  }

  function stopFeedback() {
    recognitionRef.current?.stop();
    setListening(false);
    // wait a tick for onresult to finish, then submit
    setTimeout(async () => {
      const text = collectedRef.current.trim();
      setLiveText("");
      collectedRef.current = "";
      if (!text) return;
      setImproving(true);
      try {
        const { data } = await axios.post(`${API}/paint/improve`, {
          feedback: text,
          previous_prompt: promptUsed,
          kid_name: "Carmel",
        });
        onImproved(data);
      } finally {
        setImproving(false);
      }
    }, 400);
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-pop">
      <div className="card overflow-hidden">
        <img src={imageUrl} alt="ציור" className="w-full object-cover" />
      </div>

      {/* Improve button — hold to speak */}
      <button
        onMouseDown={startFeedback}
        onTouchStart={(e) => { e.preventDefault(); startFeedback(); }}
        disabled={improving}
        className={`w-full py-4 rounded-2xl font-black text-xl transition-all select-none ${
          improving  ? "bg-purple-100 text-purple-400 cursor-not-allowed animate-pulse" :
          listening  ? "bg-red-500 text-white mic-ring-active" :
          "bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95"
        }`}
      >
        {improving ? "✨ משפרת..." : listening ? `🎧 ${liveText || "מקשיבה..."}` : "🗣️ שפרי את הציור"}
      </button>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <a href={imageUrl} download="sparkids.png"
          className="card py-4 text-center font-black text-green-500 hover:shadow-lg transition-all flex flex-col items-center gap-1">
          <span className="text-2xl">💾</span><span className="text-xs">שמור</span>
        </a>
        <button onClick={onShare}
          className="card py-4 font-black text-orange-500 hover:shadow-lg transition-all flex flex-col items-center gap-1">
          <span className="text-2xl">📤</span><span className="text-xs">שתף</span>
        </button>
        <button onClick={onReset}
          className="card py-4 font-black text-purple-500 hover:shadow-lg transition-all flex flex-col items-center gap-1">
          <span className="text-2xl">🎨</span><span className="text-xs">חדש</span>
        </button>
      </div>
    </div>
  );
}
