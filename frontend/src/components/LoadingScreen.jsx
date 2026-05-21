import { useEffect, useState } from "react";
import { Sparkles, Music2 } from "lucide-react";

const PAINT_MSGS = [
  { icon: "🦄", text: "החד-קרן מכין את הצבעים..." },
  { icon: "🧚", text: "הפיה מפזרת אבק כוכבים..." },
  { icon: "🐉", text: "הדרקון מנשף צבעים..." },
  { icon: "🌈", text: "הקשת בוחרת צבעים..." },
  { icon: "🎠", text: "הסוסון דוהר עם המכחול..." },
  { icon: "🦋", text: "הפרפר מצייר בכנפיים..." },
];

const STORY_MSGS = [
  { icon: "📖", text: "כותבת את הסיפור..." },
  { icon: "✍️", text: "מוסיפה פרטים מצחיקים..." },
  { icon: "🎭", text: "הדמות מתחממת לסיפור..." },
  { icon: "🌙", text: "מכינה סיפור שינה מושלם..." },
  { icon: "⭐", text: "מוסיפה קצת קסם..." },
  { icon: "🎤", text: "מכינה את הקול..." },
];

const SONG_MSGS = [
  { icon: "🎵", text: "כותבת את מילות השיר..." },
  { icon: "🎶", text: "מלחינה מנגינה..." },
  { icon: "🎤", text: "מכינה את הקול..." },
  { icon: "🎼", text: "מסדרת את התווים..." },
  { icon: "🎹", text: "מנגנת על הפסנתר..." },
  { icon: "🌟", text: "כמעט מוכן לשיר!" },
];

export default function LoadingScreen({ mode }) {
  const msgs = mode === "song" ? SONG_MSGS : mode === "story" ? STORY_MSGS : PAINT_MSGS;
  const [idx, setIdx] = useState(Math.floor(Math.random() * msgs.length));

  useEffect(() => {
    setIdx(0);
    const t = setInterval(() => setIdx(i => (i + 1) % msgs.length), 1800);
    return () => clearInterval(t);
  }, [mode]);

  const { icon, text } = msgs[idx];

  return (
    <div className="card py-12 flex flex-col items-center gap-6 animate-pop text-center">
      <div className="text-8xl animate-float">{icon}</div>
      <div>
        <p className="text-2xl font-black text-purple-700">{text}</p>
        <p className="text-gray-400 mt-1 font-medium text-sm flex items-center justify-center gap-1">
          {mode === "song" ? "יוצרת שיר" : mode === "story" ? "יוצרת סיפור" : "יוצרת ציור"}
          <Sparkles size={14} className="text-purple-300"/>
        </p>
      </div>
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-3 h-3 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}/>
        ))}
      </div>
    </div>
  );
}
