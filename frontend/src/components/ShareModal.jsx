import { useState } from "react";

export default function ShareModal({ shareData, onClose }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(shareData.share_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-80 flex flex-col gap-4 items-center">
        <p className="text-3xl">🎉</p>
        <p className="text-xl font-bold text-purple-700 text-center">
          Your painting is ready to share!
        </p>
        <input
          readOnly
          value={shareData.share_url}
          className="w-full border-2 border-purple-300 rounded-xl p-2 text-sm text-center"
        />
        <button
          onClick={copy}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl py-3 transition-all"
        >
          {copied ? "✅ Copied!" : "📋 Copy link"}
        </button>
        <p className="text-gray-400 text-sm text-center">
          Send this link to your parents or friends!
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
