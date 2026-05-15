export default function ImageDisplay({ imageUrl, onShare, onReset }) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg animate-bounce_slow">
      <p className="text-3xl font-bold text-purple-700">🎉 !הציור שלך מוכן</p>
      <img
        src={imageUrl}
        alt="Carmel's painting"
        className="rounded-3xl w-full shadow-2xl border-4 border-purple-300"
      />
      <div className="flex gap-3 w-full">
        <a
          href={imageUrl}
          download="carmel-painting.png"
          className="flex-1 text-center bg-green-400 hover:bg-green-500 text-white font-bold text-lg rounded-2xl py-3 transition-all"
        >
          💾 שמור
        </a>
        <button
          onClick={onShare}
          className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-bold text-lg rounded-2xl py-3 transition-all"
        >
          📤 שתף עם המשפחה
        </button>
        <button
          onClick={onReset}
          className="flex-1 bg-purple-400 hover:bg-purple-500 text-white font-bold text-lg rounded-2xl py-3 transition-all"
        >
          🎤 ציור חדש
        </button>
      </div>
    </div>
  );
}
