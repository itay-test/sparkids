import { useEffect, useState } from "react";

const MESSAGES = [
  { icon: "🦄", text: "החד-קרן מכין את הצבעים..." },
  { icon: "🧚", text: "הפיה מפזרת אבק כוכבים..." },
  { icon: "🐉", text: "הדרקון מנשף צבעים על הציור..." },
  { icon: "🌈", text: "הקשת בוחרת את הצבע הכי יפה..." },
  { icon: "⭐", text: "הכוכבים מצייצים בשבילך..." },
  { icon: "🎠", text: "הסוסון הקסום דוהר עם המכחול..." },
  { icon: "🧁", text: "הכבקייק מוסיף נצנצים..." },
  { icon: "🦋", text: "הפרפר מצייר בכנפיים..." },
];

export default function LoadingScreen() {
  const [idx, setIdx] = useState(Math.floor(Math.random() * MESSAGES.length));

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const { icon, text } = MESSAGES[idx];

  return (
    <div className="card py-12 flex flex-col items-center gap-6 animate-pop text-center">
      <div className="text-8xl animate-float">{icon}</div>
      <div>
        <p className="text-2xl font-black text-purple-700">{text}</p>
        <p className="text-gray-400 mt-1 font-medium text-sm">רק עוד שנייה... 🎨</p>
      </div>
      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-3 h-3 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}
