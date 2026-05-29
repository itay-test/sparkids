import { useAuth, STRIPE_MONTHLY_LINK, STRIPE_ANNUAL_LINK, FREE_CREATION_LIMIT } from "../contexts/AuthContext";
import { Sparkles, X } from "lucide-react";

const PERKS = [
  "✨ יצירות ללא הגבלה",
  "🤖 הדמות שלך זוכרת הכל",
  "📖 סיפורים עם תמונות",
  "🎬 פרקי הרפתקה שלמים",
  "📲 שיתוף קל לכל המשפחה",
  "⚡ עדיפות בייצור (מהיר יותר)",
];

export default function Paywall({ childName, usedCount, onClose }) {
  const { isPremium } = useAuth();
  if (isPremium()) return null;

  function openStripe(link) {
    window.open(link, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-pop" dir="rtl"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md bg-white rounded-t-3xl px-6 pt-6 pb-10 flex flex-col gap-5"
        style={{ boxShadow: "0 -8px 40px rgba(124,58,237,0.3)" }}>

        {/* Close */}
        {onClose && (
          <button onClick={onClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 active:scale-90">
            <X size={18}/>
          </button>
        )}

        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-2">🌟</div>
          <p className="text-3xl font-black text-purple-800">שדרגי לניצוץ פרמיום!</p>
          <p className="text-purple-400 font-bold text-base mt-1">
            {childName} השתמש/ה ב-{usedCount} מתוך {FREE_CREATION_LIMIT} יצירות חינמיות
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-purple-100 rounded-full h-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min((usedCount / FREE_CREATION_LIMIT) * 100, 100)}%` }}/>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-2 gap-2">
          {PERKS.map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-purple-50 rounded-2xl px-3 py-2">
              <span className="text-sm font-bold text-purple-700">{p}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="flex flex-col gap-3">

          {/* Annual — recommended */}
          <button onClick={() => openStripe(STRIPE_ANNUAL_LINK)}
            className="w-full py-5 rounded-3xl font-black text-white text-xl flex items-center justify-between px-6 shadow-xl active:scale-95 transition-all relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)" }}>
            <div className="absolute top-2 right-3 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-0.5 rounded-full">
              חסכי ₪99! ⭐
            </div>
            <span className="text-right">
              <p>שנתי</p>
              <p className="text-sm font-bold opacity-80">₪249 / שנה</p>
            </span>
            <Sparkles size={28}/>
          </button>

          {/* Monthly */}
          <button onClick={() => openStripe(STRIPE_MONTHLY_LINK)}
            className="w-full py-4 rounded-3xl font-black text-purple-700 text-lg flex items-center justify-between px-6 border-2 border-purple-200 bg-white active:scale-95 transition-all">
            <span>חודשי</span>
            <span className="text-purple-500 font-black">₪29 / חודש</span>
          </button>
        </div>

        {/* Legal note (Ruti's requirement) */}
        <p className="text-purple-300 text-xs text-center font-bold">
          ניתן לביטול בכל עת. ₪29/חודש או ₪249/שנה.<br/>
          פרטיות הילדים מוגנת לחלוטין — ללא פרסומות.
        </p>
      </div>
    </div>
  );
}
