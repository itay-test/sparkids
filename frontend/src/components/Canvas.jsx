export default function Canvas({ imageUrl, kidName, onShare }) {
  return (
    <div className="bg-white/80 rounded-3xl shadow-xl p-6 w-full max-w-lg flex flex-col items-center gap-4">
      <p className="text-2xl font-bold text-purple-600">
        🌟 {kidName}'s Masterpiece!
      </p>
      <img
        src={imageUrl}
        alt="AI painting"
        className="rounded-2xl w-full object-cover shadow-lg"
      />
      <div className="flex gap-3 w-full">
        <a
          href={imageUrl}
          download="sparkids-painting.png"
          className="flex-1 text-center bg-green-400 hover:bg-green-500 text-white font-bold text-lg rounded-2xl py-3 transition-all"
        >
          💾 Save
        </a>
        <button
          onClick={onShare}
          className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-bold text-lg rounded-2xl py-3 transition-all"
        >
          🔗 Share
        </button>
      </div>
    </div>
  );
}
