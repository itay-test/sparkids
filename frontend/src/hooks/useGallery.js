import { useState } from 'react'

const MAX_ITEMS = 20

export function useGallery(userId) {
  const key = `sparkids_gallery_${userId}`

  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || [] }
    catch { return [] }
  })

  function save(item) {
    setItems(prev => {
      const next = [{ ...item, id: Date.now(), ts: Date.now() }, ...prev].slice(0, MAX_ITEMS)
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* storage full */ }
      return next
    })
  }

  return { items, save }
}
