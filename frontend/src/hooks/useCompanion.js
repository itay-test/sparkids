import { useState } from 'react'

export function useCompanion(userId) {
  const key = `sparkids_companion_${userId}`

  const [companion, setCompanion] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || null }
    catch { return null }
  })

  function save(data) {
    const next = { ...data, updatedAt: Date.now() }
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
    setCompanion(next)
  }

  function clear() {
    try { localStorage.removeItem(key) } catch {}
    setCompanion(null)
  }

  // Formatted string for AI prompt injection
  const companionString = companion
    ? `Child's companion character: "${companion.name}"` +
      (companion.likes?.length ? `. Loves: ${companion.likes.join(', ')}` : "") + "."
    : ""

  return { companion, save, clear, companionString }
}
