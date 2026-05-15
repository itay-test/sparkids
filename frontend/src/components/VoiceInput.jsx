import { useEffect, useRef, useState } from "react";

export default function VoiceInput({ status, onTranscript, onListening, onCancel, disabled }) {
  const recognitionRef = useRef(null);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const interimRef = useRef("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("השתמשי בכרום"); return; }
    const r = new SR();
    r.lang = "he-IL";
    r.interimResults = true;
    r.continuous = true;
    r.onresult = (e) => {
      let text = "";
      for (const res of e.results) text += res[0].transcript;
      setInterim(text);
      interimRef.current = text;
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") setError("אפשרי מיקרופון 🎤");
      else if (e.error !== "aborted") setError("לא שמעתי, נסי שוב!");
    };
    // auto-trigger when Chrome stops recognition
    r.onend = () => {
      if (status === "listening") triggerStop();
    };
    recognitionRef.current = r;
  }, [status]);

  // stop on mouseup anywhere on page
  useEffect(() => {
    if (status !== "listening") return;
    const handler = () => triggerStop();
    window.addEventListener("mouseup", handler);
    window.addEventListener("touchend", handler);
    return () => {
      window.removeEventListener("mouseup", handler);
      window.removeEventListener("touchend", handler);
    };
  }, [status]);

  function triggerStop() {
    recognitionRef.current?.stop();
    setTimeout(() => {
      const text = interimRef.current.trim();
      setInterim("");
      interimRef.current = "";
      if (text.length > 0) onTranscript(text);
      else { setError("לא שמעתי, נסי שוב!"); onTranscript(null); }
    }, 300);
  }

  function start() {
    if (status !== "idle" || !recognitionRef.current || disabled) return;
    setInterim(""); setError("");
    interimRef.current = "";
    onListening();
    recognitionRef.current.start();
  }

  const isListening = status === "listening";
  const isBusy = status === "loading" || status === "done";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onMouseDown={start}
        onTouchStart={(e) => { e.preventDefault(); start(); }}
        disabled={isBusy || disabled}
        className={`
          w-36 h-36 rounded-full flex items-center justify-center
          transition-all duration-200 select-none text-6xl
          ${isListening ? "bg-red-500 scale-110 mic-ring-active"
            : isBusy || disabled ? "bg-gray-200 cursor-not-allowed opacity-40"
            : "shimmer-btn mic-ring hover:scale-105 cursor-pointer"}
        `}
      >
        {isListening ? "🔴" : "🎤"}
      </button>

      {/* Cancel button */}
      {(isListening) && (
        <button
          onClick={() => { recognitionRef.current?.abort(); setInterim(""); interimRef.current = ""; onCancel(); }}
          className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 hover:text-red-400 hover:shadow-lg transition-all text-lg"
        >
          ✕
        </button>
      )}

      {!isBusy && !isListening && (
        <p className={`font-bold text-lg text-center ${disabled ? "text-gray-300" : "text-purple-400"}`}>
          {disabled ? "📸 קודם" : "לחצי 🎤"}
        </p>
      )}
      {isListening && interim && (
        <div className="card px-5 py-3 text-center max-w-xs animate-pop">
          <p className="text-lg font-bold text-purple-700">{interim}</p>
        </div>
      )}
      {error && <p className="text-red-400 font-semibold text-sm">{error}</p>}
    </div>
  );
}
