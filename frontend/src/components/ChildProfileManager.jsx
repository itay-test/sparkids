import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Mic } from "lucide-react";

const EMOJIS = ["👑","🌸","⭐","🦁","🐬","🦋","🐣","🌈","🦊","🐸","🚀","🌙"];

export default function ChildProfileManager({ onDone }) {
  const { addChild, children } = useAuth();
  const [name, setName]   = useState("");
  const [emoji, setEmoji] = useState("👑");
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = { current: null };

  function listenForName() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening) return;
    const r = new SR(); r.lang = "he-IL"; r.interimResults = false;
    r.onresult = (e) => setName(e.results[0][0].transcript);
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    recognitionRef.current = r;
    r.start(); setListening(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await addChild(name.trim(), emoji);
    setSaving(false);
    onDone?.();
  }

  return (
    <div className="flex flex-col gap-5 animate-pop" dir="rtl">
      <div className="text-center">
        <p className="text-4xl font-black text-purple-800">הוסף/י ילד/ה</p>
        <p className="text-purple-400 font-bold text-base mt-1">
          {children.length === 0 ? "בוא/י ניצור את הפרופיל הראשון!" : `כבר יש לך ${children.length} ילדים`}
        </p>
      </div>

      {/* Emoji picker */}
      <div className="card px-4 py-4 border-2 border-purple-100">
        <p className="text-purple-400 font-bold text-sm mb-3 text-center">בחר/י אייקון</p>
        <div className="grid grid-cols-6 gap-2">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className={`text-3xl py-2 rounded-2xl transition-all active:scale-90
                ${emoji === e ? "bg-purple-100 scale-110 shadow" : "hover:bg-gray-50"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Name input */}
      <div className="card px-5 py-5 border-2 border-purple-100">
        <p className="text-purple-400 font-bold text-sm mb-3 text-center">שם הילד/ה</p>
        {name && (
          <p className="text-4xl font-black text-purple-700 text-center mb-3">{emoji} {name}</p>
        )}
        <button
          onMouseDown={listenForName}
          onTouchStart={(e) => { e.preventDefault(); listenForName(); }}
          className={`w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all select-none
            ${listening ? "bg-red-500 text-white shadow-lg" : "shimmer-btn text-white shadow-xl active:scale-95"}`}
        >
          <Mic size={28}/>
          <span>{listening ? "מקשיב/ה..." : name ? "שנה/י שם" : "אמר/י את השם בקול"}</span>
        </button>
      </div>

      <button onClick={handleSave} disabled={!name.trim() || saving}
        className={`w-full py-5 rounded-3xl font-black text-xl text-white shadow-xl active:scale-95 transition-all
          ${!name.trim() || saving ? "opacity-40 cursor-not-allowed bg-purple-300" : "shimmer-btn"}`}>
        {saving ? "שומר..." : `➕ הוסף את ${name || "הילד/ה"}`}
      </button>
    </div>
  );
}
