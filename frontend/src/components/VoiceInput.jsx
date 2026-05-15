import { useEffect, useRef, useState } from "react";

export default function VoiceInput({ status, onTranscript, onListening, disabled }) {
  const recognitionRef = useRef(null);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("השתמשי בכרום 🙁"); return; }
    const r = new SR();
    r.lang = "he-IL";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (e) => {
      let text = "";
      for (const res of e.results) text += res[0].transcript;
      setInterim(text);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") setError("אפשרי גישה למיקרופון 🎤");
      else if (e.error !== "aborted") setError("לא שמעתי, נסי שוב!");
    };
    recognitionRef.current = r;
  }, []);

  function start() {
    if (status !== "idle" || !recognitionRef.current || disabled) return;
    setInterim(""); setError("");
    onListening();
    recognitionRef.current.start();
  }

  function stop() {
    if (status !== "listening") return;
    recognitionRef.current?.stop();
    setTimeout(() => {
      if (interim.trim().length > 0) { onTranscript(interim.trim()); setInterim(""); }
      else { setError("לא שמעתי, נסי שוב!"); onTranscript(null); }
    }, 300);
  }

  const isListening = status === "listening";
  const isBusy = status === "loading" || status === "done";

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Mic button */}
      <button
        onMouseDown={start} onMouseUp={stop}
        onTouchStart={(e) => { e.preventDefault(); start(); }}
        onTouchEnd={(e) => { e.preventDefault(); stop(); }}
        disabled={isBusy || disabled}
        className={`
          w-36 h-36 rounded-full flex items-center justify-center
          transition-all duration-200 select-none text-6xl
          ${isListening
            ? "bg-red-500 scale-110 mic-ring-active"
            : isBusy || disabled
            ? "bg-gray-200 cursor-not-allowed opacity-40"
            : "shimmer-btn mic-ring hover:scale-105 active:scale-95 cursor-pointer"
          }
        `}
      >
        {isListening ? "🔴" : "🎤"}
      </button>

      {/* Label */}
      {!isBusy && (
        <p className={`font-bold text-lg text-center ${disabled ? "text-gray-300" : "text-purple-500"}`}>
          {disabled ? "קודם בחרי תמונה 📸" : isListening ? "מקשיבה... דברי!" : "לחצי והחזיקי"}
        </p>
      )}

      {/* Live transcript */}
      {interim && isListening && (
        <div className="card px-5 py-3 text-center max-w-xs">
          <p className="text-lg font-bold text-purple-700">{interim}</p>
        </div>
      )}

      {error && <p className="text-red-400 font-semibold text-center text-sm">{error}</p>}
    </div>
  );
}
