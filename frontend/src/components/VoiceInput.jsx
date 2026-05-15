import { useEffect, useRef, useState } from "react";

export default function VoiceInput({ status, onTranscript, onListening }) {
  const recognitionRef = useRef(null);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Use Chrome — this browser doesn't support voice 🙁");
      return;
    }
    const r = new SR();
    r.lang = "he-IL";
    r.interimResults = true;
    r.continuous = true;

    r.onresult = (e) => {
      let final = "";
      let live = "";
      for (const res of e.results) {
        if (res.isFinal) final += res[0].transcript;
        else live += res[0].transcript;
      }
      if (live) setInterim(live);
      if (final) setInterim(final);
    };

    r.onerror = (e) => {
      if (e.error === "not-allowed") setError("אנא אפשרי גישה למיקרופון בכרום 🎤");
      else if (e.error !== "aborted") setError("לא הצלחתי לשמוע, נסי שוב!");
    };

    recognitionRef.current = r;
  }, []);

  function startRecording() {
    if (status !== "idle" || !recognitionRef.current) return;
    setInterim("");
    setError("");
    onListening();
    recognitionRef.current.start();
  }

  function stopRecording() {
    if (status !== "listening") return;
    recognitionRef.current?.stop();
    setTimeout(() => {
      if (interim.trim().length > 1) {
        onTranscript(interim.trim());
        setInterim("");
      } else {
        setError("לא הצלחתי לשמוע, נסי שוב!");
        // reset back to idle via parent
        onTranscript(null);
      }
    }, 300);
  }

  const isListening = status === "listening";
  const isBusy = status === "loading" || status === "done";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
        disabled={isBusy}
        className={`
          w-44 h-44 rounded-full text-8xl shadow-2xl transition-all duration-200
          flex items-center justify-center select-none
          ${isListening
            ? "bg-red-400 scale-125 ring-8 ring-red-300 animate-pulse"
            : isBusy
            ? "bg-gray-300 cursor-not-allowed opacity-50"
            : "bg-purple-400 hover:bg-purple-500 active:scale-110 active:bg-red-400 cursor-pointer"
          }
        `}
      >
        {isListening ? "🔴" : "🎤"}
      </button>

      <p className="text-purple-600 font-bold text-xl text-center">
        {isListening
          ? "🎧 המשיכי להחזיק... דברי עכשיו!"
          : isBusy
          ? ""
          : "לחצי והחזיקי כדי לדבר 🎤"}
      </p>

      {interim && isListening && (
        <div className="bg-white/80 rounded-2xl px-5 py-2 text-purple-700 font-semibold text-lg animate-pulse">
          {interim}
        </div>
      )}

      {error && (
        <p className="text-red-500 font-semibold text-center">{error}</p>
      )}
    </div>
  );
}
