import { useCallback, useEffect, useRef, useState } from 'react'

const THRESHOLD = 5

// Arrastar e soltar por ponteiro (mouse, toque e caneta): reordenar blocos, inserir novos
// da biblioteca e redimensionar a largura na grade de 12 colunas.
export function useBuilderDrag({ surfaceRef, blocks, onMove, onInsert, onResize }) {
  const getGrid = useCallback(() => surfaceRef.current?.querySelector('[data-blocks-grid]') ?? null, [surfaceRef])
  const [drag, setDrag] = useState(null) // { kind: 'move' | 'new', id, type, label, x, y }
  const [indicator, setIndicator] = useState(null)
  const [resizing, setResizing] = useState(null)
  const cleanup = useRef(null)
  const latest = useRef({ blocks, onMove, onInsert, onResize })
  useEffect(() => { latest.current = { blocks, onMove, onInsert, onResize } })
  useEffect(() => () => cleanup.current?.(), [])

  // Decide em qual posição o item cairia, a partir do ponteiro.
  const resolveDrop = useCallback((x, y, draggingId) => {
    const surface = surfaceRef.current
    const grid = getGrid()
    if (!surface || !grid) return null
    const area = surface.getBoundingClientRect()
    if (x < area.left || x > area.right || y < area.top || y > area.bottom) return null
    const list = latest.current.blocks
    const slots = [...grid.querySelectorAll('[data-slot]')]
    if (!slots.length) return { index: 0, rect: null }
    let best = null
    for (const slot of slots) {
      if (slot.dataset.blockId === draggingId) continue
      const r = slot.getBoundingClientRect()
      const dx = Math.max(r.left - x, 0, x - r.right)
      const dy = Math.max(r.top - y, 0, y - r.bottom)
      const distance = Math.hypot(dx, dy)
      if (!best || distance < best.distance) best = { slot, r, distance }
    }
    if (!best) return { index: list.findIndex(b => b.id === draggingId), rect: null, same: true }
    const gridRect = grid.getBoundingClientRect()
    const partial = best.r.width < gridRect.width * 0.9
    const after = partial ? x > best.r.left + best.r.width / 2 : y > best.r.top + best.r.height / 2
    const target = list.findIndex(b => b.id === best.slot.dataset.blockId)
    let index = target + (after ? 1 : 0)
    const from = draggingId ? list.findIndex(b => b.id === draggingId) : -1
    if (from !== -1 && index > from) index -= 1
    const vertical = partial
    const rect = vertical
      ? { left: (after ? best.r.right + 3 : best.r.left - 7), top: best.r.top, width: 4, height: best.r.height }
      : { left: best.r.left, top: after ? best.r.bottom + 1 : best.r.top - 5, width: best.r.width, height: 4 }
    return { index, rect, same: from !== -1 && index === from }
  }, [surfaceRef, getGrid])

  const start = useCallback((event, source) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    cleanup.current?.()
    const origin = { x: event.clientX, y: event.clientY }
    let moved = false
    let drop = null
    let lastY = origin.y
    const scroller = window.setInterval(() => {
      if (!moved) return
      if (lastY < 90) window.scrollBy(0, -16)
      else if (lastY > window.innerHeight - 90) window.scrollBy(0, 16)
    }, 16)

    const onPointerMove = e => {
      lastY = e.clientY
      if (!moved && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < THRESHOLD) return
      moved = true
      setDrag({ ...source, x: e.clientX, y: e.clientY })
      drop = resolveDrop(e.clientX, e.clientY, source.kind === 'move' ? source.id : null)
      setIndicator(drop && !drop.same ? drop.rect : null)
    }
    const finish = apply => {
      window.clearInterval(scroller)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey)
      cleanup.current = null
      setDrag(null)
      setIndicator(null)
      if (!apply) return
      if (!moved) { if (source.kind === 'new') latest.current.onInsert(source.type, null); return }
      if (!drop || drop.same) return
      if (source.kind === 'move') latest.current.onMove(source.id, drop.index)
      else latest.current.onInsert(source.type, drop.index)
    }
    const onUp = () => finish(true)
    const onCancel = () => finish(false)
    const onKey = e => { if (e.key === 'Escape') finish(false) }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey)
    cleanup.current = () => finish(false)
  }, [resolveDrop])

  const startResize = useCallback((event, id) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    cleanup.current?.()
    const grid = getGrid()
    const slot = event.currentTarget.closest('[data-slot]')
    if (!grid || !slot) return
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0
    const gridRect = grid.getBoundingClientRect()
    const column = (gridRect.width + gap) / 12
    const left = slot.getBoundingClientRect().left
    setResizing(id)
    const onPointerMove = e => {
      const span = Math.min(12, Math.max(1, Math.round((e.clientX - left + gap) / column)))
      latest.current.onResize(id, span)
    }
    const finish = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      cleanup.current = null
      setResizing(null)
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    cleanup.current = finish
  }, [getGrid])

  return { drag, indicator, resizing, startDrag: start, startResize }
}
