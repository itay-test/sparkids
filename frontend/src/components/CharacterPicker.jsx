import { useState } from "react";
import { ChevronLeft } from "lucide-react";

const CHARACTERS = [
  { id: "elsa",    emoji: "👸", label: "אלזה",   color: "from-blue-300 to-cyan-200" },
  { id: "grandma", emoji: "👵", label: "סבתא",   color: "from-pink-300 to-rose-200" },
  { id: "grandpa", emoji: "👴", label: "סבא",    color: "from-amber-300 to-orange-200" },
  { id: "baby",    emoji: "👶", label: "תינוק",  color: "from-yellow-300 to-lime-200" },
  { id: "robot",   emoji: "🤖", label: "רובוט",  color: "from-slate-300 to-blue-200" },
  { id: "dragon",  emoji: "🐉", label: "דרקון",  color: "from-green-300 to-emerald-200" },
  { id: "wizard",  emoji: "🧙", label: "קוסם",   color: "from-purple-300 to-violet-200" },
  { id: "lion",    emoji: "🦁", label: "אריה",   color: "from-yellow-400 to-amber-300" },
];

export default function CharacterPicker({ onSelect, onBack }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="flex flex-col gap-5 animate-pop w-full">
      <div className="text-center">
        <p className="text-3xl font-black text-purple-800">מי יספר את הסיפור? 📖</p>
        <p className="text-purple-300 font-bold text-sm mt-1">בחרי דמות</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CHARACTERS.map(ch => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            onMouseEnter={() => setHovered(ch.id)}
            onMouseLeave={() => setHovered(null)}
            className={`
              relative rounded-3xl p-5 flex flex-col items-center gap-2
              bg-gradient-to-br ${ch.color}
              shadow-md hover:shadow-xl active:scale-95
              transition-all duration-200 border-2 border-white/60
              ${hovered === ch.id ? "scale-105" : ""}
            `}
          >
            <span className="text-6xl animate-float" style={{ animationDelay: `${Math.random()*2}s` }}>
              {ch.emoji}
            </span>
            <span className="font-black text-gray-700 text-lg">{ch.label}</span>
          </button>
        ))}
      </div>

      <button onClick={onBack} className="flex items-center justify-center gap-1 text-gray-400 font-bold text-sm">
        <ChevronLeft size={16}/> חזרי
      </button>
    </div>
  );
}
