import { useState } from "react";
import VoiceInput from "./components/VoiceInput";
import ImageDisplay from "./components/ImageDisplay";
import ShareModal from "./components/ShareModal";
import PhotoInput from "./components/PhotoInput";
import LoadingScreen from "./components/LoadingScreen";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const BG_DECO = [
  { e:"🌸", top:5,  left:5,  size:2.8, dur:3.8, delay:0   },
  { e:"⭐", top:12, left:80, size:2.2, dur:4.2, delay:0.5 },
  { e:"🦋", top:22, left:15, size:3.0, dur:5.0, delay:1.0 },
  { e:"🌺", top:35, left:88, size:2.5, dur:4.5, delay:0.3 },
  { e:"✨", top:48, left:3,  size:2.0, dur:3.2, delay:1.5 },
  { e:"🌙", top:55, left:75, size:2.8, dur:4.8, delay:0.8 },
  { e:"🎀", top:65, left:20, size:3.2, dur:3.5, delay:0.2 },
  { e:"💫", top:72, left:60, size:2.3, dur:4.0, delay:1.2 },
  { e:"🌷", top:82, left:8,  size:2.6, dur:5.2, delay:0.7 },
  { e:"🦄", top:88, left:85, size:3.0, dur:3.9, delay:1.8 },
  { e:"🍭", top:30, left:50, size:2.0, dur:4.3, delay:0.4 },
  { e:"🌟", top:60, left:40, size:2.4, dur:3.6, delay:2.0 },
];

export default function App() {
  const [status, setStatus]       = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [result, setResult]       = useState(null);
  const [shareData, setShareData] = useState(null);
  const [mode, setMode]           = useState(null);   // null = not chosen yet
  const [photo, setPhoto]         = useState(null);

  async function handleTranscript(text) {
    if (!text) { setStatus("idle"); return; }
    setTranscript(text);
    setStatus("loading");
    try {
      const payload = { idea: text, kid_name: "Carmel" };
      if (photo) payload.photo = photo;
      const { data } = await axios.post(`${API}/paint/`, payload);
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  }

  // go back one level
  function goBack() {
    if (status === "done")      { setResult(null); setTranscript(""); setStatus("idle"); return; }
    if (status === "listening") { setStatus("idle"); return; }
    if (photo)                  { setPhoto(null); return; }
    if (mode)                   { setMode(null);  return; }
  }

  function reset() {
    setStatus("idle"); setTranscript(""); setResult(null);
    setShareData(null); setPhoto(null); setMode(null);
  }

  async function handleShare() {
    if (!result) return;
    const { data } = await axios.post(`${API}/share/`, {
      kid_name: "Carmel", image_url: result.image_url, prompt_used: result.prompt_used,
    });
    setShareData(data);
  }

  const isIdle      = status === "idle";
  const isLoading   = status === "loading";
  const isListening = status === "listening";
  const isDone      = status === "done";

  // show back arrow whenever there's something to go back to
  const canGoBack = mode !== null || photo || status !== "idle" || result;

  return (
    <div className="min-h-screen flex flex-col items-center pb-16 relative overflow-hidden" dir="rtl">

      {/* Animated background */}
      {BG_DECO.map((d, i) => (
        <span key={i} className="fixed select-none pointer-events-none deco"
          style={{ top:`${d.top}%`, left:`${d.left}%`, fontSize:`${d.size}rem`,
            opacity:0.22, "--dur":`${d.dur}s`, "--delay":`${d.delay}s` }}>
          {d.e}
        </span>
      ))}

      {/* Header */}
      <div className="w-full bg-white/70 backdrop-blur-sm shadow-sm px-5 py-3 flex items-center justify-between mb-6 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 shimmer-btn rounded-xl flex items-center justify-center text-lg">🎨</div>
          <span className="text-xl font-black text-purple-700">Sparkids</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Back — one level */}
          {canGoBack && !isLoading && (
            <button onClick={goBack}
              className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-purple-400 hover:text-purple-700 transition-all text-lg font-bold">
              ←
            </button>
          )}
          {/* Full reset */}
          {canGoBack && (
            <button onClick={reset}
              className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center text-gray-300 hover:text-red-400 transition-all text-base">
              ✕
            </button>
          )}
          <span className="text-lg font-black text-purple-700">כרמל 👑</span>
        </div>
      </div>

      <div className="w-full max-w-md px-4 flex flex-col gap-5 relative z-10">

        {/* Step 1 — choose mode */}
        {!mode && (
          <div className="flex flex-col items-center gap-5 animate-pop">
            <p className="text-4xl font-black text-purple-800 text-center leading-tight">מה תרצי<br/>לצייר היום?</p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={() => setMode("voice")}
                className="card p-8 flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95">
                <span className="text-6xl">🎤</span>
                <span className="text-purple-700 font-black text-lg">קול</span>
              </button>
              <button onClick={() => setMode("photo")}
                className="card p-8 flex flex-col items-center gap-3 hover:shadow-xl transition-all active:scale-95">
                <span className="text-6xl">📸</span>
                <span className="text-purple-700 font-black text-lg">תמונה</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — photo upload (photo mode) */}
        {mode === "photo" && isIdle && <PhotoInput onPhoto={setPhoto} />}

        {/* Step 2/3 — mic */}
        {mode && !isDone && !isLoading && (
          <VoiceInput
            status={status}
            onTranscript={handleTranscript}
            onListening={() => setStatus("listening")}
            onCancel={() => setStatus("idle")}
            disabled={mode === "photo" && !photo}
          />
        )}

        {/* Transcript */}
        {transcript && isIdle && (
          <div className="card px-6 py-4 text-center animate-pop">
            <p className="text-2xl font-black text-purple-700">"{transcript}"</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && <LoadingScreen />}

        {/* Result */}
        {isDone && result && (
          <ImageDisplay
            imageUrl={result.image_url}
            promptUsed={result.prompt_used}
            onShare={handleShare}
            onReset={reset}
            onImproved={(data) => setResult(data)}
          />
        )}

      </div>

      {shareData && <ShareModal shareData={shareData} onClose={() => setShareData(null)} />}
    </div>
  );
}
