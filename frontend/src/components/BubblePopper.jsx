import { useState, useCallback } from 'react'

const EMOJIS = ['⭐', '💫', '✨', '🌟', '🎈', '🎀', '🌸', '🦋', '🍭', '🌈', '🎵', '💝']

function randomBubble(id) {
  return {
    id,
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    x: 10 + Math.random() * 80,   // %
    y: 20 + Math.random() * 60,   // %
    size: 2.2 + Math.random() * 1.4, // rem
    popped: false,
  }
}

const INITIAL_COUNT = 6

export default function BubblePopper() {
  const [bubbles, setBubbles] = useState(() =>
    Array.from({ length: INITIAL_COUNT }, (_, i) => randomBubble(i))
  )
  const [nextId, setNextId] = useState(INITIAL_COUNT)
  const [score, setScore]   = useState(0)

  const pop = useCallback((id) => {
    setBubbles(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, popped: true } : b)
      // respawn after 600ms
      setTimeout(() => {
        setNextId(n => {
          const newId = n + 1
          setBubbles(cur => [...cur.filter(b => b.id !== id), randomBubble(newId)])
          return newId
        })
      }, 600)
      return updated
    })
    setScore(s => s + 1)
  }, [])

  return (
    <div className="relative w-full h-32 select-none">
      {/* Score */}
      {score > 0 && (
        <div className="absolute top-0 left-0 right-0 text-center text-purple-400 font-black text-sm animate-pop">
          {score} 💥
        </div>
      )}
      {bubbles.map(b => (
        <button
          key={b.id}
          onClick={() => !b.popped && pop(b.id)}
          className="absolute transition-all duration-300"
          style={{
            left: `${b.x}%`,
            top:  `${b.y}%`,
            fontSize: `${b.size}rem`,
            transform: b.popped ? 'scale(2)' : 'scale(1)',
            opacity:   b.popped ? 0 : 1,
            filter:    b.popped ? 'blur(4px)' : 'none',
            animation: !b.popped ? `float-drift ${2.5 + Math.random()}s ease-in-out infinite` : 'none',
          }}
        >
          {b.emoji}
        </button>
      ))}
      <p className="absolute bottom-0 left-0 right-0 text-center text-purple-300 font-bold text-xs">
        פוצצי את הכוכבים! 👆
      </p>
    </div>
  )
}
