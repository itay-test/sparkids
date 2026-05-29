import { useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";

export default function VoiceInput({ status, onTranscript, onListening, onCancel, disabled, captureAudio = false }) {
  const recognitionRef = useRef(null);
  const recorderRef    = useRef(null);
  const chunksRef      = useRef([]);
  const interimRef     = useRef("");
  const [interim, setInterim] = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("השתמשי בכרום"); return; }
    const r = new SR();
    r.lang = "he-IL"; r.interimResults = true; r.continuous = true;
    r.onresult = (e) => {
      let text = "";
      for (const res of e.results) text += res[0].transcript;
      setInterim(text); interimRef.current = text;
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") setError("אפשרי מיקרופון");
      else if (e.error !== "aborted") setError("לא שמעתי, נסי שוב!");
    };
    r.onend = () => { if (status === "listening") triggerStop(); };
    recognitionRef.current = r;
  }, [status]);

  useEffect(() => {
    if (status !== "listening") return;
    const handler = () => triggerStop();
    window.addEventListener("mouseup", handler);
    window.addEventListener("touchend", handler);
    return () => { window.removeEventListener("mouseup", handler); window.removeEventListener("touchend", handler); };
  }, [status]);

  async function start() {
    if (status !== "idle" || !recognitionRef.current || disabled) return;
    setInterim(""); setError(""); interimRef.current = ""; chunksRef.current = [];

    // start audio recording if requested
    if (captureAudio) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
        rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        rec.start(100);
        recorderRef.current = { recorder: rec, stream };
      } catch { /* mic already open via SpeechRecognition, skip */ }
    }

    onListening();
    recognitionRef.current.start();
  }

  async function triggerStop() {
    recognitionRef.current?.stop();

    // stop audio recorder
    let audioB64 = null;
    if (captureAudio && recorderRef.current) {
      const { recorder, stream } = recorderRef.current;
      recorder.stop();
      stream.getTracks().forEach(t => t.stop());
      recorderRef.current = null;
      await new Promise(r => setTimeout(r, 400));
      if (chunksRef.current.length > 0) {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const buf  = await blob.arrayBuffer();
        audioB64   = btoa(String.fromCharCode(...new Uint8Array(buf)));
      }
    }

    setTimeout(() => {
      const text = interimRef.current.trim();
      setInterim(""); interimRef.current = "";
      if (text.length > 0) onTranscript(text, audioB64);
      else { setError("לא שמעתי, נסי שוב!"); onTranscript(null, null); }
    }, 300);
  }

  const isListening = status === "listening";
  const isBusy = status === "loading" || status === "done";

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onMouseDown={start}
        onTouchStart={(e) => { e.preventDefault(); start(); }}
        disabled={isBusy || disabled}
        className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-200 select-none
          ${isListening ? "bg-red-500 scale-110 mic-ring-active shadow-xl"
            : isBusy || disabled ? "bg-gray-100 cursor-not-allowed opacity-40"
            : "shimmer-btn mic-ring shadow-xl hover:scale-105 cursor-pointer active:scale-95"}`}
      >
        <Mic size={52} color="white" strokeWidth={1.5}/>
      </button>

      {isListening && (
        <button onClick={() => { recognitionRef.current?.abort(); recorderRef.current?.recorder?.stop(); recorderRef.current?.stream?.getTracks().forEach(t=>t.stop()); setInterim(""); interimRef.current = ""; onCancel(); }}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-red-400 active:scale-95 transition-all">
          <X size={28}/>
        </button>
      )}

      {!isBusy && !isListening && disabled && (
        <p className="text-4xl text-center">📸👆</p>
      )}
      {isListening && interim && (
        <div className="card px-5 py-3 text-center max-w-xs animate-pop">
          <p className="text-lg font-bold text-purple-700">{interim}</p>
        </div>
      )}
      {isListening && !interim && (
        <p className="text-3xl animate-pulse">🎤</p>
      )}
      {error && (
        <div className="card px-6 py-4 text-center border-2 border-yellow-100 animate-pop">
          <p className="text-4xl mb-1">😅</p>
          <p className="text-xl font-black text-purple-700">נסי שוב!</p>
        </div>
      )}
    </div>
  );
}
