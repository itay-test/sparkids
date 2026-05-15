import { useState } from "react";
import VoiceInput from "./components/VoiceInput";
import ImageDisplay from "./components/ImageDisplay";
import ShareModal from "./components/ShareModal";
import axios from "axios";

const API = "http://localhost:8000";

export default function App() {
  const [status, setStatus] = useState("idle"); // idle | listening | loading | done
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState(null);
  const [shareData, setShareData] = useState(null);

  async function handleTranscript(text) {
    setTranscript(text);
    setStatus("loading");
    try {
      const { data } = await axios.post(`${API}/paint/`, {
        idea: text,
        kid_name: "Carmel",
      });
      setResult(data);
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  }

  async function handleShare() {
    if (!result) return;
    const { data } = await axios.post(`${API}/share/`, {
      kid_name: "Carmel",
      image_url: result.image_url,
      prompt_used: result.prompt_used,
    });
    setShareData(data);
  }

  function reset() {
    setStatus("idle");
    setTranscript("");
    setResult(null);
    setShareData(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-6">
      {/* Header */}
      <div className="text-center mt-4">
        <h1 className="text-5xl font-bold text-purple-700 drop-shadow-lg">
          🌟 Hi Carmel!
        </h1>
        <p className="text-xl text-purple-500 mt-1">
          Tell me what you want to paint ✨
        </p>
      </div>

      {/* Voice input */}
      <VoiceInput
        status={status}
        onTranscript={handleTranscript}
        onListening={() => setStatus("listening")}
      />

      {/* Transcript bubble */}
      {transcript && (
        <div className="bg-white/80 rounded-3xl px-6 py-3 shadow-lg max-w-md text-center text-lg text-purple-700 font-semibold">
          💬 "{transcript}"
        </div>
      )}

      {/* Loading sparkles */}
      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 animate-pulse_slow">
          <div className="text-6xl animate-spin_slow">🎨</div>
          <p className="text-purple-600 text-xl font-bold">Creating your magic painting...</p>
          <div className="flex gap-2 text-3xl">
            {["✨","🌈","⭐","🎀","🦄"].map((e, i) => (
              <span key={i} className="animate-bounce_slow" style={{ animationDelay: `${i * 0.15}s` }}>
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {status === "done" && result && (
        <ImageDisplay
          imageUrl={result.image_url}
          onShare={handleShare}
          onReset={reset}
        />
      )}

      {shareData && (
        <ShareModal shareData={shareData} onClose={() => setShareData(null)} />
      )}
    </div>
  );
}
