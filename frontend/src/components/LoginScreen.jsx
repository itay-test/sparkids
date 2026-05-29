import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FIREBASE_ENABLED } from "../firebase";
import Logo from "./Logo";

export default function LoginScreen() {
  const { signInWithGoogle, signInLocal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [localName, setLocalName] = useState("");
  const [listenForName, setListenForName] = useState(false);

  async function handleGoogle() {
    setLoading(true); setError("");
    try { await signInWithGoogle(); }
    catch { setError("לא הצלחנו להתחבר. נסה שוב."); }
    finally { setLoading(false); }
  }

  function handleLocal() {
    if (!localName.trim()) { setError("אמר/י את השם קודם!"); return; }
    signInLocal(localName.trim());
  }

  function startVoiceName() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang = "he-IL"; r.interimResults = false;
    r.onresult = (e) => setLocalName(e.results[0][0].transcript);
    r.onerror  = () => setListenForName(false);
    r.onend    = () => setListenForName(false);
    r.start(); setListenForName(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      dir="rtl"
      style={{ background: "linear-gradient(160deg,#ede9fe,#fdf2f8,#e0e7ff)" }}>

      {["🌟","✨","🦄","🎨","🎵","📖"].map((e, i) => (
        <span key={i} className="fixed select-none pointer-events-none text-5xl opacity-20"
          style={{ top:`${10 + i * 14}%`, left: i % 2 === 0 ? `${5 + i * 4}%` : `${72 + i * 2}%`,
            animation:`float ${3 + i * 0.6}s ease-in-out infinite alternate` }}>{e}</span>
      ))}

      <div className="w-full max-w-sm flex flex-col items-center gap-7 relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Logo size={80}/>
          <p className="text-6xl font-black bg-clip-text text-transparent"
            style={{ backgroundImage:"linear-gradient(90deg,#7c3aed,#ec4899)" }}>
            ניצוץ
          </p>
          <p className="text-purple-500 font-bold text-lg text-center">
            המקום שבו הדמיון שלך מדליק הכל
          </p>
        </div>

        {/* Mode icons */}
        <div className="flex gap-5 text-6xl">
          <span style={{ animation:"float 3s ease-in-out infinite alternate" }}>🎨</span>
          <span style={{ animation:"float 3.5s ease-in-out infinite alternate", animationDelay:"0.3s" }}>📖</span>
          <span style={{ animation:"float 4s ease-in-out infinite alternate", animationDelay:"0.6s" }}>🎤</span>
        </div>

        {/* ── LOCAL MODE (no Firebase configured) ── */}
        {!FIREBASE_ENABLED && (
          <div className="w-full flex flex-col gap-4">
            <div className="card w-full px-6 py-6 text-center border-2 border-purple-100">
              <p className="text-2xl font-black text-purple-800 mb-4">מי אתה/את?</p>

              {localName ? (
                <p className="text-4xl font-black text-purple-600 mb-4">👋 {localName}</p>
              ) : (
                <p className="text-purple-400 font-bold mb-4">אמר/י את השם שלך בקול</p>
              )}

              <button
                onMouseDown={startVoiceName}
                onTouchStart={(e) => { e.preventDefault(); startVoiceName(); }}
                className={`w-full py-7 rounded-3xl font-black text-2xl flex items-center justify-center gap-3 mb-4 transition-all select-none
                  ${listenForName ? "bg-red-500 text-white shadow-lg" : "shimmer-btn text-white shadow-xl active:scale-95"}`}>
                <span className="text-4xl">{listenForName ? "👂" : "🎤"}</span>
                <span>{listenForName ? "מקשיב/ה..." : localName ? "שנה/י שם" : "אמר/י את שמך"}</span>
              </button>

              {localName && (
                <button onClick={handleLocal}
                  className="w-full py-7 rounded-3xl font-black text-2xl text-white shadow-xl active:scale-95 transition-all"
                  style={{ background:"linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                  <span className="text-4xl ml-3">✨</span>
                  בואו ניצור!
                </button>
              )}
            </div>
            <p className="text-purple-300 text-xs text-center font-bold">
              מצב דמו — כל הנתונים שמורים במכשיר
            </p>
          </div>
        )}

        {/* ── FIREBASE MODE ── */}
        {FIREBASE_ENABLED && (
          <div className="w-full flex flex-col gap-4">
            <button onClick={handleGoogle} disabled={loading}
              className="w-full py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all bg-white border-2 border-purple-100 text-purple-700">
              {loading
                ? <span className="text-3xl animate-spin">⚡</span>
                : <svg width="28" height="28" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>}
              <span>{loading ? "מתחבר..." : "כניסה עם Google"}</span>
            </button>
            <div className="card w-full px-5 py-4 border-2 border-green-100 bg-green-50 text-center">
              <p className="text-green-700 font-black text-base">🎁 10 יצירות חינם — ללא כרטיס אשראי</p>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 font-bold text-center">{error}</p>}
      </div>
    </div>
  );
}
