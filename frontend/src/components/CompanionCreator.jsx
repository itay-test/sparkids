import { useState, useRef } from "react";
import { Mic, Check, RefreshCw, ChevronLeft } from "lucide-react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const COMPANION_TYPES = [
  { id: "hero",     emoji: "🦸", label: "גיבור" },
  { id: "princess", emoji: "👸", label: "נסיכה" },
  { id: "animal",   emoji: "🦄", label: "חיה" },
  { id: "alien",    emoji: "👾", label: "חייזר" },
];

const LOADING_MSGS = ["מצייר את הדמות...","מוסיף קסם...","כמעט מוכן...","עוד שנייה..."];

export default function CompanionCreator({ kidName, onDone, onBack }) {
  const [step, setStep]           = useState(1); // 1=name 2=looks 3=likes
  const [name, setName]           = useState("");
  const [selectedType, setType]   = useState(null);
  const [imageUrl, setImageUrl]   = useState(null);
  const [likes, setLikes]         = useState([]);
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [loadMsg, setLoadMsg]     = useState(0);
  const recognitionRef = useRef(null);
  const collectedRef   = useRef("");
  const msgTimer       = useRef(null);

  function startListening(onResult) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening) return;
    collectedRef.current = ""; setLiveText("");
    const r = new SR();
    r.lang = "he-IL"; r.interimResults = true; r.continuous = true;
    r.onresult = (e) => {
      let t = "";
      for (const res of e.results) t += res[0].transcript;
      collectedRef.current = t; setLiveText(t);
    };
    r.onerror = () => stopListening(onResult);
    recognitionRef.current = r;
    r.start(); setListening(true);

    const stopOnRelease = () => stopListening(onResult);
    window.addEventListener("mouseup",  stopOnRelease, { once: true });
    window.addEventListener("touchend", stopOnRelease, { once: true });
  }

  function stopListening(onResult) {
    recognitionRef.current?.stop(); setListening(false);
    setTimeout(() => {
      const t = collectedRef.current.trim();
      setLiveText(""); collectedRef.current = "";
      if (t) onResult(t);
    }, 300);
  }

  // ── Step 1: Name ──────────────────────────────────────────
  function handleNameListen() {
    startListening((t) => setName(t));
  }

  // ── Step 2: Image ──────────────────────────────────────────
  async function handleGenerateImage(description) {
    if (!selectedType) return;
    setLoading(true);
    setLoadMsg(0);
    msgTimer.current = setInterval(() => setLoadMsg(i => (i + 1) % LOADING_MSGS.length), 1500);
    try {
      const { data } = await axios.post(`${API}/companion/create-image`, {
        description: description || `a ${selectedType} character`,
        companion_type: selectedType,
      });
      setImageUrl(data.image_url);
    } catch { /* silent fail — image is optional */ }
    finally {
      clearInterval(msgTimer.current); setLoading(false);
    }
  }

  function handleLooksListen() {
    startListening((t) => handleGenerateImage(t));
  }

  // ── Step 3: Likes ──────────────────────────────────────────
  function handleLikeListen() {
    startListening((t) => {
      if (t && likes.length < 4) setLikes(prev => [...prev, t]);
    });
  }

  // ── Done ──────────────────────────────────────────────────
  function finish() {
    onDone({ name: name || "הדמות שלי", imageUrl, likes, companionType: selectedType });
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 animate-pop">

      {/* Header */}
      <div className="text-center">
        <p className="text-4xl font-black text-purple-800">✨ הדמות שלי</p>
        <div className="flex justify-center gap-2 mt-3">
          {[1,2,3].map(i => (
            <div key={i} className={`h-2 rounded-full transition-all ${step >= i ? "w-8 bg-purple-500" : "w-4 bg-purple-200"}`}/>
          ))}
        </div>
      </div>

      {/* ── Step 1: Name ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="card px-6 py-8 text-center border-2 border-purple-100">
            <p className="text-6xl mb-4">🌟</p>
            <p className="text-2xl font-black text-purple-800">מה השם של הדמות שלך?</p>
            <p className="text-purple-400 font-bold mt-2 text-base">לחצ/י על הכפתור ואמר/י את השם</p>
          </div>

          {name && (
            <div className="card px-6 py-5 text-center border-2 border-purple-200 animate-pop">
              <p className="text-4xl font-black text-purple-700">{name}</p>
            </div>
          )}

          {listening && liveText && (
            <div className="card px-5 py-3 text-center border-2 border-red-100 animate-pop">
              <p className="text-purple-600 font-bold text-xl">{liveText}</p>
            </div>
          )}

          <button
            onMouseDown={handleNameListen}
            onTouchStart={(e) => { e.preventDefault(); handleNameListen(); }}
            className={`w-full py-7 rounded-3xl font-black text-2xl flex items-center justify-center gap-3 transition-all select-none
              ${listening ? "bg-red-500 text-white shadow-lg" : "shimmer-btn text-white shadow-xl active:scale-95"}`}
          >
            <Mic size={32} strokeWidth={2}/>
            <span>{listening ? (liveText || "מקשיב/ה...") : "אמר/י את השם"}</span>
          </button>

          {name && (
            <button onClick={() => setStep(2)}
              className="w-full py-5 rounded-3xl font-black text-xl text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              <Check size={28}/> <span>הבא!</span>
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Looks ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="card px-6 py-5 text-center border-2 border-purple-100">
            <p className="text-2xl font-black text-purple-800">איך נראית הדמות שלך?</p>
            <p className="text-purple-400 font-bold mt-1 text-base">קודם בחר/י סוג, אחר כך תאר/י בקול</p>
          </div>

          {/* Type picker */}
          <div className="grid grid-cols-4 gap-3">
            {COMPANION_TYPES.map(t => (
              <button key={t.id} onClick={() => setType(t.id)}
                className={`card py-4 flex flex-col items-center gap-2 transition-all active:scale-95 border-2
                  ${selectedType === t.id ? "border-purple-400 bg-purple-50" : "border-transparent"}`}>
                <span className="text-4xl">{t.emoji}</span>
                <span className="text-sm font-black text-purple-700">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Generated image */}
          {imageUrl && (
            <div className="card overflow-hidden border-2 border-purple-200 animate-pop">
              <img src={imageUrl} alt={name} className="w-full object-cover" style={{ maxHeight: 280 }}/>
              <div className="px-4 py-3 text-center">
                <p className="text-purple-600 font-black text-lg">{name} 🌟</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card px-6 py-8 text-center border-2 border-purple-100 animate-pop">
              <div className="text-4xl animate-bounce mb-3">🎨</div>
              <p className="text-purple-600 font-black text-xl">{LOADING_MSGS[loadMsg]}</p>
            </div>
          )}

          {listening && liveText && (
            <div className="card px-5 py-3 text-center border-2 border-red-100">
              <p className="text-purple-600 font-bold text-lg">{liveText}</p>
            </div>
          )}

          {selectedType && !loading && (
            <button
              onMouseDown={handleLooksListen}
              onTouchStart={(e) => { e.preventDefault(); handleLooksListen(); }}
              className={`w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all select-none
                ${listening ? "bg-red-500 text-white shadow-lg" : "shimmer-btn text-white shadow-xl active:scale-95"}`}
            >
              <Mic size={28}/>
              <span>{listening ? (liveText || "מקשיב/ה...") : imageUrl ? "נסה שוב" : "תאר/י בקול!"}</span>
            </button>
          )}

          {imageUrl && (
            <button onClick={() => setStep(3)}
              className="w-full py-5 rounded-3xl font-black text-xl text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              <Check size={28}/> <span>מושלם!</span>
            </button>
          )}

          {!imageUrl && selectedType && !loading && (
            <button onClick={() => handleGenerateImage("")}
              className="w-full py-4 rounded-3xl font-black text-lg text-purple-600 bg-purple-50 border-2 border-purple-200 active:scale-95 transition-all flex items-center justify-center gap-2">
              <RefreshCw size={22}/> צור ללא תיאור
            </button>
          )}
        </div>
      )}

      {/* ── Step 3: Likes ── */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="card px-6 py-5 text-center border-2 border-purple-100">
            <p className="text-2xl font-black text-purple-800">מה {name} אוהב/ת?</p>
            <p className="text-purple-400 font-bold mt-1 text-base">אמר/י עד 4 דברים שהדמות אוהבת</p>
          </div>

          {/* Likes badges */}
          {likes.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {likes.map((like, i) => (
                <span key={i} className="bg-purple-100 text-purple-700 font-black text-base rounded-2xl px-4 py-2 animate-pop">
                  {like}
                </span>
              ))}
            </div>
          )}

          {listening && liveText && (
            <div className="card px-5 py-3 text-center border-2 border-red-100">
              <p className="text-purple-600 font-bold text-lg">{liveText}</p>
            </div>
          )}

          {likes.length < 4 && (
            <button
              onMouseDown={handleLikeListen}
              onTouchStart={(e) => { e.preventDefault(); handleLikeListen(); }}
              className={`w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all select-none
                ${listening ? "bg-red-500 text-white shadow-lg" : "shimmer-btn text-white shadow-xl active:scale-95"}`}
            >
              <Mic size={28}/>
              <span>{listening ? (liveText || "מקשיב/ה...") : "הוסף/י אהבה"}</span>
            </button>
          )}

          <button onClick={finish}
            className="w-full py-6 rounded-3xl font-black text-2xl text-white shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
            <span>בואו ניצור! 🎉</span>
          </button>
        </div>
      )}

      {/* Back button */}
      <button onClick={step > 1 ? () => setStep(s => s - 1) : onBack}
        className="flex items-center gap-2 text-purple-400 font-bold text-base justify-center py-2">
        <ChevronLeft size={20}/> חזור
      </button>
    </div>
  );
}
