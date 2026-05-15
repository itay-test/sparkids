import { useState } from "react";

export default function ShareModal({ shareData, onClose }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(shareData.share_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="card p-8 w-full max-w-sm flex flex-col gap-4 items-center animate-pop">
        <div className="text-6xl animate-float">🎉</div>
        <p className="text-2xl font-black text-purple-700 text-center">הציור מוכן לשיתוף!</p>
        <input readOnly value={shareData.share_url}
          className="w-full border-2 border-purple-200 rounded-xl p-3 text-sm text-center text-gray-500 bg-gray-50 font-mono" />
        <button onClick={copy}
          className="w-full shimmer-btn text-white font-black rounded-2xl py-3 text-lg transition-all">
          {copied ? "✅ הועתק!" : "📋 העתיקי לינק"}
        </button>
        <p className="text-gray-400 text-sm text-center">שלחי למשפחה וחברים!</p>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-sm font-medium">סגרי</button>
      </div>
    </div>
  );
}
