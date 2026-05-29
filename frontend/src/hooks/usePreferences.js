import { useState } from 'react'

const MAX_LIKES = 8

export function usePreferences(userId) {
  const key = `sparkids_prefs_${userId}`

  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || { likes: [], showCelebration: false } }
    catch { return { likes: [], showCelebration: false } }
  })

  function addLike(text) {
    if (!text?.trim()) return
    setPrefs(prev => {
      const next = {
        likes: [text.trim(), ...prev.likes.filter(l => l !== text.trim())].slice(0, MAX_LIKES),
        showCelebration: true,
      }
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function dismissCelebration() {
    setPrefs(prev => {
      const next = { ...prev, showCelebration: false }
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // Top 3 recent themes formatted for Gemini injection
  const prefString = prefs.likes.length > 0
    ? `This child recently loved creating things about: ${prefs.likes.slice(0, 3).join(', ')}. Build on these themes.`
    : ''

  return { prefs, addLike, dismissCelebration, prefString }
}
