import { useCallback, useEffect, useRef, useState } from 'react'
import { sizeFor } from '../data/canvasLayout'

const THRESHOLD = 5

// Arrastar e soltar por ponteiro (mouse, toque e caneta): reordenar blocos, inserir novos
// da biblioteca e redimensionar a largura na grade de 12 colunas.
export function useBuilderDrag({ surfaceRef, canvasApiRef, blocks, selectedId, onMove, onInsert, onInsertAt, onResize, onStyle, onSelect, onEditAt }) {
  const getGrid = useCallback(() => surfaceRef.current?.querySelector('[data-blocks-grid]') ?? null, [surfaceRef])
  const [drag, setDrag] = useState(null) // { kind: 'move' | 'new', id, type, label, x, y }
  const [indicator, setIndicator] = useState(null)
  const [resizing, setResizing] = useState(null)
  const cleanup = useRef(null)
  const latest = useRef({ blocks, selectedId, onMove, onInsert, onInsertAt, onResize, onStyle, onSelect, onEditAt })
  useEffect(() => { latest.current = { blocks, selectedId, onMove, onInsert, onInsertAt, onResize, onStyle, onSelect, onEditAt } })
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
      const canvas = canvasApiRef?.current
      if (canvas && source.kind === 'new') {
        // canvas livre: solta o bloco exatamente onde o ponteiro está
        const point = canvas.pointToDesign(e.clientX, e.clientY)
        const size = sizeFor(source.type)
        const zoom = canvas.zoom()
        drop = point ? { point } : null
        setIndicator(point ? { ghost: true, left: e.clientX - size.w * zoom / 2, top: e.clientY - 24 * zoom, width: size.w * zoom, height: (size.h || 56) * zoom } : null)
        return
      }
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
      if (drop.point) { latest.current.onInsertAt(source.type, drop.point); return }
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
  }, [resolveDrop, canvasApiRef])

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
    const slotRect = slot.getBoundingClientRect()
    const left = slotRect.left
    const grab = event.clientX - slotRect.right // o bloco pode estar deslocado: compensa
    setResizing(id)
    const onPointerMove = e => {
      const span = Math.min(12, Math.max(1, Math.round((e.clientX - grab - left + gap) / column)))
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

  const findBlock = id => latest.current.blocks.find(b => b.id === id)

  // Arrastar o corpo do bloco = mover livremente (deslocamento X/Y). Clique sem arrastar: seleciona,
  // e se já estava selecionado coloca o cursor no texto.
  const startBody = useCallback((event, id) => {
    if (event.button !== undefined && event.button !== 0) return
    if (event.target.closest?.('.inline-edit') === document.activeElement) return // já digitando
    cleanup.current?.()
    const slot = event.currentTarget
    const wasSelected = latest.current.selectedId === id
    const origin = { x: event.clientX, y: event.clientY }
    const base = findBlock(id)?.style || {}
    const ox = base.offsetX || 0
    const oy = base.offsetY || 0
    let moved = false
    const onPointerMove = e => {
      const dx = e.clientX - origin.x
      const dy = e.clientY - origin.y
      if (!moved && Math.hypot(dx, dy) < 4) return
      if (!moved) { moved = true; if (!wasSelected) latest.current.onSelect(id); window.getSelection()?.removeAllRanges() }
      let nx = ox + dx
      let ny = oy + dy
      if (!e.altKey) { if (Math.abs(nx) < 6) nx = 0; if (Math.abs(ny) < 6) ny = 0 }
      latest.current.onStyle(id, { offsetX: Math.round(nx), offsetY: Math.round(ny) })
    }
    const finish = apply => e => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      cleanup.current = null
      if (!apply || moved) return
      if (wasSelected) latest.current.onEditAt(slot, e.clientX, e.clientY)
      else latest.current.onSelect(id)
    }
    const onUp = finish(true)
    const onCancel = finish(false)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    cleanup.current = () => finish(false)()
  }, [])

  const startRotate = useCallback((event, id) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    cleanup.current?.()
    const mover = event.currentTarget.closest('[data-mover]')
    const rect = mover.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const onPointerMove = e => {
      let angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90
      if (angle > 180) angle -= 360
      angle = Math.round(angle)
      const snapped = Math.round(angle / 15) * 15
      if (!e.altKey && Math.abs(angle - snapped) <= 4) angle = snapped
      latest.current.onStyle(id, { rotate: Math.max(-180, Math.min(180, angle)) })
    }
    const finish = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      cleanup.current = null
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    cleanup.current = finish
  }, [])

  const startHeight = useCallback((event, id) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    cleanup.current?.()
    const frame = event.currentTarget.closest('[data-mover]')?.querySelector('.block-frame')
    if (!frame) return
    const top = frame.getBoundingClientRect().top
    const onPointerMove = e => latest.current.onStyle(id, { minHeight: Math.max(0, Math.round((e.clientY - top) / 4) * 4) })
    const finish = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      cleanup.current = null
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    cleanup.current = finish
  }, [])

  return { drag, indicator, resizing, startDrag: start, startResize, startBody, startRotate, startHeight }
}
