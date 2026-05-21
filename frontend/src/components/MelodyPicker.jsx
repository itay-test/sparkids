import { useState } from "react";
import { ChevronLeft } from "lucide-react";

const MOODS = [
  { id: "lullaby",   emoji: "🌙", label: "שקט",      sub: "פסנתר רך" },
  { id: "magic",     emoji: "✨", label: "קסום",     sub: "נבל וצלצולים" },
  { id: "adventure", emoji: "🏰", label: "הרפתקה",   sub: "תזמורת קלה" },
  { id: "nature",    emoji: "🌿", label: "טבע",      sub: "ציפורים וחליל" },
  { id: "happy",     emoji: "🎠", label: "שמח",      sub: "אוקולילי" },
  { id: "mystery",   emoji: "🔮", label: "מסתורי",   sub: "פסנתר עדין" },
];

export default function MelodyPicker({ onConfirm, onBack }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-5 animate-pop w-full">
      <div className="text-center">
        <p className="text-3xl font-black text-purple-800">מה המנגינה ברקע? 🎵</p>
        <p className="text-purple-300 font-bold text-sm mt-1">בחרי אווירה — אפשר גם בלי</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MOODS.map(m => (
          <button key={m.id} onClick={() => setSelected(selected === m.id ? null : m.id)}
            className={`card py-5 flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 border-2 ${
              selected === m.id
                ? "border-purple-400 bg-purple-50 shadow-lg scale-[1.02]"
                : "border-transparent hover:border-purple-200"
            }`}>
            <span className="text-5xl">{m.emoji}</span>
            <span className={`font-black text-lg ${selected === m.id ? "text-purple-700" : "text-gray-600"}`}>{m.label}</span>
            <span className="text-gray-400 text-xs">{m.sub}</span>
            {selected === m.id && <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center mt-1"><span className="text-white text-xs">✓</span></div>}
          </button>
        ))}
      </div>

      <button onClick={() => onConfirm(selected)}
        className="w-full py-5 shimmer-btn text-white font-black text-xl rounded-3xl shadow-xl active:scale-95 transition-all">
        {selected ? `עם מנגינת ${MOODS.find(m=>m.id===selected)?.label} ←` : "בלי מנגינה ←"}
      </button>

      <button onClick={onBack} className="flex items-center justify-center gap-1 text-gray-400 font-bold text-sm">
        <ChevronLeft size={16}/> חזרי
      </button>
    </div>
  );
}
