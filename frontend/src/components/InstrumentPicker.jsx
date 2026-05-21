import { useState } from "react";
import { ChevronLeft } from "lucide-react";

const INSTRUMENTS = [
  { id: "piano",      emoji: "🎹", label: "פסנתר",    en: "piano" },
  { id: "guitar",     emoji: "🎸", label: "גיטרה",    en: "guitar" },
  { id: "drums",      emoji: "🥁", label: "תופים",    en: "drums" },
  { id: "violin",     emoji: "🎻", label: "כינור",    en: "violin" },
  { id: "trumpet",    emoji: "🎺", label: "חצוצרה",   en: "trumpet" },
  { id: "flute",      emoji: "🪈", label: "חליל",     en: "flute" },
  { id: "ukulele",    emoji: "🪕", label: "אוקולילי", en: "ukulele" },
  { id: "saxophone",  emoji: "🎷", label: "סקסופון",  en: "saxophone" },
  { id: "xylophone",  emoji: "🎶", label: "קסילופון", en: "xylophone and glockenspiel" },
  { id: "accordion",  emoji: "🪗", label: "אקורדיון", en: "accordion" },
];

export default function InstrumentPicker({ onConfirm, onBack }) {
  const [selected, setSelected] = useState(new Set());

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function confirm() {
    const instruments = INSTRUMENTS
      .filter(i => selected.has(i.id))
      .map(i => i.en);
    onConfirm(instruments);
  }

  return (
    <div className="flex flex-col gap-5 animate-pop w-full">
      {/* Header */}
      <div className="text-center">
        <p className="text-3xl font-black text-purple-800">איזה כלים בשיר? 🎵</p>
        <p className="text-purple-300 font-bold text-sm mt-1">בחרי אחד או יותר</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {INSTRUMENTS.map(inst => {
          const isOn = selected.has(inst.id);
          return (
            <button
              key={inst.id}
              onClick={() => toggle(inst.id)}
              className={`card py-5 flex flex-col items-center gap-2 transition-all duration-150 active:scale-95 border-2 ${
                isOn
                  ? "border-purple-400 bg-purple-50 shadow-lg scale-[1.02]"
                  : "border-transparent hover:border-purple-200"
              }`}
            >
              <span className="text-5xl">{inst.emoji}</span>
              <span className={`font-black text-base ${isOn ? "text-purple-700" : "text-gray-500"}`}>
                {inst.label}
              </span>
              {isOn && (
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs font-black">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <button
        onClick={confirm}
        className="w-full py-5 shimmer-btn text-white font-black text-xl rounded-3xl shadow-xl active:scale-95 transition-all"
      >
        {selected.size === 0 ? "המשיכי ←" : `עם ${selected.size} כלים ←`}
      </button>

      <button onClick={onBack} className="flex items-center justify-center gap-1 text-gray-400 font-bold text-sm">
        <ChevronLeft size={16}/> חזרי
      </button>
    </div>
  );
}
