export default function CompanionAvatar({ companion, onClick }) {
  if (!companion) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-4 z-50 flex flex-col items-center gap-1 group"
      style={{ filter: "drop-shadow(0 4px 12px rgba(124,58,237,0.4))" }}
    >
      <div className="w-16 h-16 rounded-full border-3 border-white overflow-hidden shadow-xl
        group-active:scale-90 transition-transform"
        style={{ borderWidth: 3, borderColor: "white" }}>
        {companion.imageUrl
          ? <img src={companion.imageUrl} alt={companion.name} className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
              ✨
            </div>
        }
      </div>
      <span className="text-xs font-black text-purple-700 bg-white/90 rounded-full px-2 py-0.5 shadow
        max-w-16 truncate text-center" style={{ fontSize: "0.65rem" }}>
        {companion.name}
      </span>
    </button>
  );
}
