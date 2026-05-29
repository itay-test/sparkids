import { Music2, BookOpen, Paintbrush2, Play } from 'lucide-react'

const TYPE_META = {
  image: { icon: Paintbrush2, color: 'bg-purple-100 text-purple-500', label: '🎨' },
  song:  { icon: Music2,      color: 'bg-pink-100 text-pink-500',     label: '🎵' },
  story: { icon: BookOpen,    color: 'bg-indigo-100 text-indigo-500', label: '📖' },
}

export default function GalleryRow({ items, onOpen }) {
  if (!items || items.length === 0) return null

  return (
    <div className="w-full animate-pop">
      <p className="text-purple-400 font-black text-sm mb-2 px-1">היצירות שלי ✨</p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => {
          const meta = TYPE_META[item.type] || TYPE_META.image
          return (
            <button
              key={item.id}
              onClick={() => onOpen(item)}
              className="shrink-0 rounded-2xl overflow-hidden shadow-md active:scale-95 transition-all relative"
              style={{ width: 80, height: 80 }}
            >
              {item.type === 'image' && item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover"/>
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${meta.color} bg-opacity-30`}
                  style={{ background: item.type === 'song' ? 'linear-gradient(135deg,#a855f7,#ec4899)' : item.type === 'story' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <span className="text-3xl">{meta.label}</span>
                </div>
              )}
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/10 flex items-end justify-end p-1">
                <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center">
                  <Play size={10} fill="currentColor" className="text-purple-600"/>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
