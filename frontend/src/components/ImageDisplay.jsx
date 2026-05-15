import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ImageDisplay({ imageUrl, promptUsed, onShare, onReset, onImproved }) {
  const [improving, setImproving] = useState(false);
  const [listening, setListening] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  function startFeedback() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening || improving) return;
    const r = new SR();
    r.lang = "he-IL";
    r.interimResults = true;
    r.continuous = true;
    let collected = "";
    r.onresult = (e) => {
      collected = "";
      for (const res of e.results) collected += res[0].transcript;
      setFeedbackText(collected);
    };
    r.onend = async () => {
      setListening(false);
      if (!collected.trim()) return;
      setImproving(true);
      try {
        const { data } = await axios.post(`${API}/paint/improve`, {
          feedback: collected,
          previous_prompt: promptUsed,
          kid_name: "Carmel",
        });
        onImproved(data);
      } finally {
        setImproving(false);
        setFeedbackText("");
      }
    };
    setListening(true);
    setFeedbackText("");
    r.start();
    setTimeout(() => r.stop(), 8000);
  }

  return (
    <div className="flex flex-col gap-4 w-full animate-pop">
      {/* Image */}
      <div className="card overflow-hidden">
        <img src={imageUrl} alt="ציור" className="w-full object-cover" />
      </div>

      {/* Improve by voice */}
      <button
        onMouseDown={startFeedback}
        onTouchStart={(e) => { e.preventDefault(); startFeedback(); }}
        disabled={improving}
        className={`w-full py-4 rounded-2xl font-black text-xl transition-all select-none ${
          improving ? "bg-purple-100 text-purple-400 cursor-not-allowed" :
          listening ? "bg-red-500 text-white animate-pulse" :
          "bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-95"
        }`}
      >
        {improving ? "✨ משפרת..." : listening ? `🎧 ${feedbackText || "מקשיבה..."}` : "🗣️ שפרי את הציור"}
      </button>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <a href={imageUrl} download="sparkids.png"
          className="card py-3 text-center font-bold text-green-600 hover:shadow-md transition-all text-sm">
          💾<br/>שמור
        </a>
        <button onClick={onShare}
          className="card py-3 font-bold text-orange-500 hover:shadow-md transition-all text-sm">
          📤<br/>שתף
        </button>
        <button onClick={onReset}
          className="card py-3 font-bold text-purple-600 hover:shadow-md transition-all text-sm">
          🎨<br/>ציור חדש
        </button>
      </div>
    </div>
  );
}
