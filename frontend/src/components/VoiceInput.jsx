import { useEffect, useRef } from "react";

export default function VoiceInput({ status, onTranscript, onListening }) {
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => onTranscript(e.results[0][0].transcript);
    r.onerror = () => {};
    recognitionRef.current = r;
  }, []);

  function startListening() {
    if (status !== "idle" || !recognitionRef.current) return;
    onListening();
    recognitionRef.current.start();
  }

  const isListening = status === "listening";
  const isbusy = status === "loading" || status === "done";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={startListening}
        disabled={isbusy}
        className={`
          w-40 h-40 rounded-full text-7xl shadow-2xl transition-all duration-300 flex items-center justify-center
          ${isListening
            ? "bg-red-400 scale-110 ring-8 ring-red-300 animate-pulse"
            : isbusy
            ? "bg-gray-300 cursor-not-allowed opacity-60"
            : "bg-purple-400 hover:bg-purple-500 hover:scale-105 active:scale-95"
          }
        `}
      >
        {isListening ? "🔴" : "🎤"}
      </button>
      <p className="text-purple-600 font-semibold text-lg">
        {isListening
          ? "Listening... speak now!"
          : isbusy
          ? ""
          : "Tap the mic and tell me!"}
      </p>
    </div>
  );
}
